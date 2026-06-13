# Torneos - Programador de Fixture

## Requisitos
- Python 3.11+
- Node.js 18+

## Instalación y arranque

### Backend (Python/FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

La app queda en http://localhost:3000 y el backend en http://localhost:8000.

## Uso
1. En la pestaña **Restricciones** configurá turnos, canchas, gaps y categorías.
2. En la pestaña **Archivos** subí los Excel de fixture por categoría.
   - El archivo debe tener columnas: `Número`, `Equipo 1`, `Equipo 2`, `Zona`, `Fecha`.
   - El nombre del archivo debe incluir el año de la categoría (ej: `fixture_2012.xlsx`).
3. Hacé click en **Descargar Programación** o **Descargar Grilla por Categoría**.
