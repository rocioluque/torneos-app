import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .models import Restricciones
from .excel_reader import leer_fixture_excel
from .scheduler import schedule
from .excel_writer import generar_programacion_excel, generar_grilla_categoria_excel

app = FastAPI(title="Torneos Scheduler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "Torneos Scheduler API"}


@app.post("/generar")
async def generar(
    restricciones: str = Form(...),
    archivos: list[UploadFile] = File(...),
):
    try:
        r_dict = json.loads(restricciones)
        r = Restricciones(**r_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Restricciones inválidas: {e}")

    todos_los_partidos = []
    for archivo in archivos:
        contenido = await archivo.read()
        # El nombre del archivo debe incluir la categoría: ej. fixture_2012.xlsx
        nombre = archivo.filename or ""
        cat = None
        for c in r.partidos_por_dia.keys():
            if c in nombre:
                cat = c
                break
        if not cat:
            raise HTTPException(status_code=400, detail=f"No se pudo detectar la categoría en el archivo '{nombre}'. Incluí el año en el nombre (ej. fixture_2012.xlsx).")

        partidos = leer_fixture_excel(contenido, cat, r.partidos_por_dia)
        todos_los_partidos.extend(partidos)

    resultado = schedule(todos_los_partidos, r)

    failed_count = len(resultado.get("failed", []))
    total = len(todos_los_partidos)
    scheduled_count = total - failed_count

    return {
        "ok": True,
        "total": total,
        "programados": scheduled_count,
        "fallidos": failed_count,
        "resultado": resultado,
    }


@app.post("/generar/excel-programacion")
async def generar_excel_programacion(
    restricciones: str = Form(...),
    archivos: list[UploadFile] = File(...),
):
    try:
        r_dict = json.loads(restricciones)
        r = Restricciones(**r_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Restricciones inválidas: {e}")

    todos_los_partidos = []
    for archivo in archivos:
        contenido = await archivo.read()
        nombre = archivo.filename or ""
        cat = None
        for c in r.partidos_por_dia.keys():
            if c in nombre:
                cat = c
                break
        if not cat:
            raise HTTPException(status_code=400, detail=f"No se pudo detectar la categoría en '{nombre}'.")
        partidos = leer_fixture_excel(contenido, cat, r.partidos_por_dia)
        todos_los_partidos.extend(partidos)

    resultado = schedule(todos_los_partidos, r)
    xlsx = generar_programacion_excel(resultado, r.horarios, r.horarios_extra, r.total_canchas)

    return Response(
        content=xlsx,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Torneo_Programacion.xlsx"},
    )


@app.post("/generar/excel-categorias")
async def generar_excel_categorias(
    restricciones: str = Form(...),
    archivos: list[UploadFile] = File(...),
):
    try:
        r_dict = json.loads(restricciones)
        r = Restricciones(**r_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Restricciones inválidas: {e}")

    todos_los_partidos = []
    for archivo in archivos:
        contenido = await archivo.read()
        nombre = archivo.filename or ""
        cat = None
        for c in r.partidos_por_dia.keys():
            if c in nombre:
                cat = c
                break
        if not cat:
            raise HTTPException(status_code=400, detail=f"No se pudo detectar la categoría en '{nombre}'.")
        partidos = leer_fixture_excel(contenido, cat, r.partidos_por_dia)
        todos_los_partidos.extend(partidos)

    resultado = schedule(todos_los_partidos, r)
    xlsx = generar_grilla_categoria_excel(resultado)

    return Response(
        content=xlsx,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Grilla_Por_Categoria.xlsx"},
    )
