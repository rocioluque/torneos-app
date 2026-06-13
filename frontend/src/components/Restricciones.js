import React from 'react';

const s = {
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    marginBottom: 20,
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#1565c0' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  label: { fontSize: 13, color: '#555', marginBottom: 4, display: 'block' },
  field: { marginBottom: 10 },
  section: { marginBottom: 18 },
  subtitle: { fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 8 },
  tag: {
    display: 'inline-block', background: '#e3f2fd',
    borderRadius: 4, padding: '3px 8px', margin: '2px', fontSize: 13,
  },
  addRow: { display: 'flex', gap: 8, marginBottom: 6 },
  removeBtn: {
    background: '#ffebee', color: '#c62828',
    padding: '3px 8px', fontSize: 12, borderRadius: 4,
  },
  catRow: {
    display: 'grid', gridTemplateColumns: '100px 1fr 1fr',
    gap: 10, alignItems: 'center', marginBottom: 8,
  },
};

export default function Restricciones({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  const updateHorario = (idx, val) => {
    const arr = [...data.horarios];
    arr[idx] = val;
    set('horarios', arr);
  };

  const updateHorarioExtra = (idx, val) => {
    const arr = [...data.horarios_extra];
    arr[idx] = val;
    set('horarios_extra', arr);
  };

  const addHorario = () => set('horarios', [...data.horarios, '']);
  const removeHorario = (idx) => set('horarios', data.horarios.filter((_, i) => i !== idx));

  const addHorarioExtra = () => set('horarios_extra', [...data.horarios_extra, '']);
  const removeHorarioExtra = (idx) => set('horarios_extra', data.horarios_extra.filter((_, i) => i !== idx));

  const updateCatDia = (cat, dia, val) => {
    const ppd = { ...data.partidos_por_dia };
    ppd[cat] = { ...ppd[cat], [dia]: Number(val) };
    set('partidos_por_dia', ppd);
  };

  const addCategoria = () => {
    const nombre = prompt('Nombre de la categoría (ej: 2016):');
    if (!nombre) return;
    const ppd = { ...data.partidos_por_dia, [nombre]: { viernes: 1, sabado: 2 } };
    set('partidos_por_dia', ppd);
  };

  const removeCategoria = (cat) => {
    const ppd = { ...data.partidos_por_dia };
    delete ppd[cat];
    set('partidos_por_dia', ppd);
  };

  return (
    <div>
      {/* Canchas */}
      <div style={s.card}>
        <div style={s.title}>Canchas</div>
        <div style={s.grid2}>
          <div style={s.field}>
            <label style={s.label}>Total de canchas</label>
            <input type="number" min={1} max={20} value={data.total_canchas}
              onChange={e => set('total_canchas', Number(e.target.value))} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Cancha que puede usar horarios extra</label>
            <input type="number" min={1} value={data.cancha_extra}
              onChange={e => set('cancha_extra', Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Horarios */}
      <div style={s.card}>
        <div style={s.title}>Horarios de turnos</div>

        <div style={s.section}>
          <div style={s.subtitle}>Turnos regulares</div>
          {data.horarios.map((h, i) => (
            <div key={i} style={s.addRow}>
              <span style={{ ...s.tag, minWidth: 30, textAlign: 'center' }}>T{i + 1}</span>
              <input type="text" value={h} onChange={e => updateHorario(i, e.target.value)}
                placeholder="ej: 08:40" style={{ maxWidth: 100 }} />
              <button style={s.removeBtn} onClick={() => removeHorario(i)}>✕</button>
            </div>
          ))}
          <button onClick={addHorario}
            style={{ background: '#e3f2fd', color: '#1565c0', padding: '5px 12px', fontSize: 13 }}>
            + Agregar turno
          </button>
        </div>

        <div style={s.section}>
          <div style={s.subtitle}>Turnos extra (solo cancha {data.cancha_extra})</div>
          {data.horarios_extra.map((h, i) => (
            <div key={i} style={s.addRow}>
              <span style={{ ...s.tag, minWidth: 30, textAlign: 'center' }}>T{data.horarios.length + i + 1}</span>
              <input type="text" value={h} onChange={e => updateHorarioExtra(i, e.target.value)}
                placeholder="ej: 18:00" style={{ maxWidth: 100 }} />
              <button style={s.removeBtn} onClick={() => removeHorarioExtra(i)}>✕</button>
            </div>
          ))}
          <button onClick={addHorarioExtra}
            style={{ background: '#fce4ec', color: '#880e4f', padding: '5px 12px', fontSize: 13 }}>
            + Agregar turno extra
          </button>
        </div>
      </div>

      {/* Gap entre partidos */}
      <div style={s.card}>
        <div style={s.title}>Gap entre partidos del mismo equipo</div>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
          Cantidad de turnos de <strong>descanso</strong> entre los dos partidos del mismo equipo en el mismo día.
          Ej: gap mínimo 2 = si juega T1, el próximo es T4 como mínimo.
        </p>
        <div style={s.grid2}>
          <div style={s.field}>
            <label style={s.label}>Turnos de descanso mínimo</label>
            <input type="number" min={1} max={8} value={data.gap_min - 1}
              onChange={e => set('gap_min', Number(e.target.value) + 1)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Turnos de descanso máximo</label>
            <input type="number" min={1} max={8} value={data.gap_max - 1}
              onChange={e => set('gap_max', Number(e.target.value) + 1)} />
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div style={s.card}>
        <div style={s.title}>Categorías y partidos por día</div>
        <div style={{ ...s.catRow, fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 10 }}>
          <span>Categoría</span><span>Partidos Viernes</span><span>Partidos Sábado</span>
        </div>
        {Object.entries(data.partidos_por_dia).map(([cat, dias]) => (
          <div key={cat} style={s.catRow}>
            <span style={{ fontWeight: 600 }}>{cat}</span>
            <input type="number" min={0} max={5} value={dias.viernes}
              onChange={e => updateCatDia(cat, 'viernes', e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min={0} max={5} value={dias.sabado}
                onChange={e => updateCatDia(cat, 'sabado', e.target.value)} />
              <button style={s.removeBtn} onClick={() => removeCategoria(cat)}>✕</button>
            </div>
          </div>
        ))}
        <button onClick={addCategoria}
          style={{ background: '#e8f5e9', color: '#1b5e20', padding: '5px 12px', fontSize: 13, marginTop: 8 }}>
          + Agregar categoría
        </button>
      </div>

      {/* Otras reglas */}
      <div style={s.card}>
        <div style={s.title}>Otras reglas</div>
        <div style={s.field}>
          <label style={s.label}>Máx. apariciones del mismo nombre de equipo por turno</label>
          <input type="number" min={1} max={10} value={data.max_repeticion_nombre}
            onChange={e => set('max_repeticion_nombre', Number(e.target.value))}
            style={{ maxWidth: 80 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="evitar" checked={data.evitar_mismo_nombre_turno}
            onChange={e => set('evitar_mismo_nombre_turno', e.target.checked)} />
          <label htmlFor="evitar" style={{ fontSize: 14 }}>
            Evitar equipos con mismo nombre base en el mismo turno (ej: Juniors Azul y Juniors Blanco)
          </label>
        </div>
      </div>
    </div>
  );
}
