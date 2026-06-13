import pandas as pd
from io import BytesIO


def leer_fixture_excel(contenido: bytes, categoria: str, partidos_por_dia: dict) -> list[dict]:
    """
    Lee un Excel de fixture con columnas:
    Número | Día | Hora | Cancha | Categoría | Equipo 1 | Resultado | Equipo 2 | Zona | Fecha

    Determina el día (VIERNES/SABADO) según la cantidad de fechas por día
    configurada en partidos_por_dia.
    """
    df = pd.read_excel(BytesIO(contenido))
    df.columns = [str(c).strip().upper() for c in df.columns]

    col_map = {
        "NÚMERO": "num", "NUMERO": "num", "N°": "num", "N": "num",
        "DÍA": "dia", "DIA": "dia",
        "HORA": "hora",
        "CANCHA": "cancha",
        "CATEGORÍA": "cat", "CATEGORIA": "cat",
        "EQUIPO 1": "t1",
        "RESULTADO": "resultado",
        "EQUIPO 2": "t2",
        "ZONA": "group",
        "FECHA": "fecha",
    }
    df = df.rename(columns={c: col_map[c] for c in df.columns if c in col_map})
    df = df.dropna(subset=["t1", "t2"])

    config_dia = partidos_por_dia.get(str(categoria), {"viernes": 1, "sabado": 2})
    fechas_viernes = config_dia.get("viernes", 1)

    # Convertir "1º Fecha", "2º Fecha" -> número
    def parse_fecha(val):
        s = str(val).strip()
        # Intentar extraer primer dígito
        for ch in s:
            if ch.isdigit():
                return int(ch)
        return 1

    partidos = []
    for i, row in df.iterrows():
        fecha_val = row.get("fecha", 1)
        fecha_num = parse_fecha(fecha_val)
        day = "VIERNES" if fecha_num <= fechas_viernes else "SABADO"

        partidos.append({
            "id": f"{categoria}_{i}",
            "cat": str(categoria),
            "t1": str(row.get("t1", "")).strip(),
            "t2": str(row.get("t2", "")).strip(),
            "group": str(row.get("group", "")).strip(),
            "fecha": f"{fecha_num}º Fecha",
            "day": day,
        })

    return partidos
