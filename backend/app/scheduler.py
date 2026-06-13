from collections import defaultdict
from .models import Restricciones


def schedule(partidos: list[dict], r: Restricciones) -> dict:
    TURNO_HORA = {}
    for i, h in enumerate(r.horarios, 1):
        TURNO_HORA[i] = h
    for i, h in enumerate(r.horarios_extra, len(r.horarios) + 1):
        TURNO_HORA[i] = h

    MAX_TURNO = len(r.horarios) + len(r.horarios_extra)
    MAX_TURNO_NORMAL = len(r.horarios)
    GAP_MIN = r.gap_min
    GAP_MAX = r.gap_max
    CANCHAS = list(range(1, r.total_canchas + 1))
    CANCHA_EXTRA = r.cancha_extra

    def max_turno_cancha(c):
        return MAX_TURNO if c == CANCHA_EXTRA else MAX_TURNO_NORMAL

    VALID_PAIRS = [
        (ta, tb)
        for ta in range(1, MAX_TURNO + 1)
        for tb in range(ta + 1, MAX_TURNO + 1)
        if GAP_MIN <= (tb - ta) <= GAP_MAX
    ]

    def team_ok(match, turno, team_turns):
        for tk in [(match['cat'], match['t1']), (match['cat'], match['t2'])]:
            for et in team_turns[tk]:
                gap = abs(et - turno)
                if gap < GAP_MIN or gap > GAP_MAX:
                    return False
            if turno in team_turns[tk]:
                return False
        return True

    def triple_ok(match, turno, slots):
        def base(n):
            return n.split('(')[0].strip().upper()
        b1, b2 = base(match['t1']), base(match['t2'])
        c1 = sum(1 for (tt, _), sm in slots.items()
                 if tt == turno and (base(sm['t1']) == b1 or base(sm['t2']) == b1))
        c2 = sum(1 for (tt, _), sm in slots.items()
                 if tt == turno and (base(sm['t1']) == b2 or base(sm['t2']) == b2))
        return c1 < r.max_repeticion_nombre and c2 < r.max_repeticion_nombre

    def juniors_ok(match, turno, slots):
        if not r.evitar_mismo_nombre_turno:
            return True
        for (tt, _), sm in slots.items():
            if tt != turno or sm['cat'] != match['cat']:
                continue
            for n1 in [match['t1'], match['t2']]:
                for n2 in [sm['t1'], sm['t2']]:
                    if 'JUNIORS' in n1 and 'JUNIORS' in n2 and n1 != n2:
                        return False
        return True

    def free_cancha(turno, slots, exclude=None):
        canchas = CANCHAS if turno <= MAX_TURNO_NORMAL else [CANCHA_EXTRA]
        for c in canchas:
            if c == exclude:
                continue
            if (turno, c) not in slots and turno <= max_turno_cancha(c):
                return c
        return None

    def place(match, t, c, slots, team_turns):
        slots[(t, c)] = match
        team_turns[(match['cat'], match['t1'])].add(t)
        team_turns[(match['cat'], match['t2'])].add(t)

    def schedule_day(day_matches):
        slots = {}
        team_turns = defaultdict(set)
        placed_ids = set()
        scheduled = []
        failed = []

        id_to_match = {m['id']: m for m in day_matches}

        team_matches = defaultdict(list)
        for m in day_matches:
            team_matches[(m['cat'], m['t1'])].append(m['id'])
            team_matches[(m['cat'], m['t2'])].append(m['id'])

        paired_ids = set()
        for tk, mids in team_matches.items():
            if len(mids) >= 2:
                for mid in mids:
                    paired_ids.add(mid)

        single_matches = [m for m in day_matches if m['id'] not in paired_ids]

        processed_pairs = set()
        pair_list = []
        for tk, mids in team_matches.items():
            if len(mids) == 2:
                key = frozenset(mids)
                if key not in processed_pairs:
                    processed_pairs.add(key)
                    pair_list.append((id_to_match[mids[0]], id_to_match[mids[1]]))

        def try_pair(m1, m2):
            best = None
            best_score = 9999
            for ta, tb in VALID_PAIRS:
                ok1 = True
                for tk in [(m1['cat'], m1['t1']), (m1['cat'], m1['t2'])]:
                    if ta in team_turns[tk]:
                        ok1 = False
                        break
                    for et in team_turns[tk]:
                        if abs(et - ta) < GAP_MIN or abs(et - ta) > GAP_MAX:
                            ok1 = False
                            break
                    if not ok1:
                        break
                if not ok1:
                    continue

                ok2 = True
                for tk in [(m2['cat'], m2['t1']), (m2['cat'], m2['t2'])]:
                    if tb in team_turns[tk]:
                        ok2 = False
                        break
                    for et in team_turns[tk]:
                        if abs(et - tb) < GAP_MIN or abs(et - tb) > GAP_MAX:
                            ok2 = False
                            break
                    if not ok2:
                        break
                if not ok2:
                    continue

                shared = (
                    set([(m1['cat'], m1['t1']), (m1['cat'], m1['t2'])]) &
                    set([(m2['cat'], m2['t1']), (m2['cat'], m2['t2'])])
                )
                if shared:
                    gap = abs(ta - tb)
                    if gap < GAP_MIN or gap > GAP_MAX:
                        continue

                if not triple_ok(m1, ta, slots):
                    continue
                if not triple_ok(m2, tb, slots):
                    continue

                ca = free_cancha(ta, slots)
                cb = free_cancha(tb, slots, exclude=ca)
                if ca is None or cb is None:
                    continue

                score = max(ta, tb) * 100 + ta + tb
                if not juniors_ok(m1, ta, slots):
                    score += 5
                if not juniors_ok(m2, tb, slots):
                    score += 5
                if score < best_score:
                    best_score = score
                    best = (ta, ca, tb, cb)
            return best

        # Schedule PAIRS FIRST
        for m1, m2 in pair_list:
            if m1['id'] in placed_ids or m2['id'] in placed_ids:
                continue
            result = try_pair(m1, m2) or try_pair(m2, m1)
            if result:
                r1 = try_pair(m1, m2)
                if r1:
                    ta, ca, tb, cb = r1
                    pm1, pm2 = m1, m2
                else:
                    ta, ca, tb, cb = try_pair(m2, m1)
                    pm1, pm2 = m2, m1
                place(pm1, ta, ca, slots, team_turns)
                scheduled.append({**pm1, 'turno': ta, 'cancha': ca, 'hora': TURNO_HORA.get(ta, f'T{ta}')})
                place(pm2, tb, cb, slots, team_turns)
                scheduled.append({**pm2, 'turno': tb, 'cancha': cb, 'hora': TURNO_HORA.get(tb, f'T{tb}')})
                placed_ids.update([m1['id'], m2['id']])
            else:
                for m in [m1, m2]:
                    if m['id'] in placed_ids:
                        continue
                    for t in range(1, MAX_TURNO + 1):
                        if not team_ok(m, t, team_turns):
                            continue
                        if not triple_ok(m, t, slots):
                            continue
                        c = free_cancha(t, slots)
                        if c:
                            place(m, t, c, slots, team_turns)
                            scheduled.append({**m, 'turno': t, 'cancha': c, 'hora': TURNO_HORA.get(t, f'T{t}')})
                            break
                    else:
                        failed.append(m)
                    placed_ids.add(m['id'])

        # Schedule SINGLES
        for m in single_matches:
            if m['id'] in placed_ids:
                continue
            for t in range(1, MAX_TURNO + 1):
                if not team_ok(m, t, team_turns):
                    continue
                if not triple_ok(m, t, slots):
                    continue
                c = free_cancha(t, slots)
                if c:
                    place(m, t, c, slots, team_turns)
                    scheduled.append({**m, 'turno': t, 'cancha': c, 'hora': TURNO_HORA.get(t, f'T{t}')})
                    break
            else:
                failed.append(m)
            placed_ids.add(m['id'])

        return scheduled, failed

    friday = [m for m in partidos if m['day'].upper() in ('VIERNES', 'FRIDAY')]
    saturday = [m for m in partidos if m['day'].upper() in ('SABADO', 'SÁBADO', 'SATURDAY')]

    fri_s, fri_f = schedule_day(friday)
    sat_s, sat_f = schedule_day(saturday)

    return {
        'viernes': sorted(fri_s, key=lambda x: (x['turno'], x['cancha'])),
        'sabado': sorted(sat_s, key=lambda x: (x['turno'], x['cancha'])),
        'failed': fri_f + sat_f,
    }
