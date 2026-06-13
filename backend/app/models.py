from pydantic import BaseModel
from typing import Optional


class Restricciones(BaseModel):
    # Horarios de turnos
    horarios: list[str] = [
        "08:40", "09:40", "10:40", "11:40", "12:40",
        "14:00", "15:00", "16:00", "17:00"
    ]
    horarios_extra: list[str] = ["18:00", "19:00"]

    # Canchas
    total_canchas: int = 8
    cancha_extra: int = 5  # única cancha que puede usar horarios extra

    # Gap entre partidos del mismo equipo (en diferencia de turnos)
    gap_min: int = 3  # mínimo de diferencia de turno (2 turnos de descanso)
    gap_max: int = 4  # máximo de diferencia de turno (3 turnos de descanso)

    # Días por categoría
    # formato: { "2012": {"viernes": 1, "sabado": 2}, ... }
    partidos_por_dia: dict[str, dict[str, int]] = {
        "2012": {"viernes": 1, "sabado": 2},
        "2013": {"viernes": 1, "sabado": 2},
        "2014": {"viernes": 2, "sabado": 1},
        "2015": {"viernes": 2, "sabado": 1},
    }

    # Máximo de veces que puede aparecer el mismo nombre base de equipo en un turno
    max_repeticion_nombre: int = 3

    # Evitar que equipos con mismo nombre base jueguen en el mismo turno
    evitar_mismo_nombre_turno: bool = True
