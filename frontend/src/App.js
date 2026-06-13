import React, { useState } from 'react';
import Restricciones from './components/Restricciones';
import SubirArchivos from './components/SubirArchivos';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DEFAULT_RESTRICCIONES = {
  horarios: ['08:40', '09:40', '10:40', '11:40', '12:40', '14:00', '15:00', '16:00', '17:00'],
  horarios_extra: ['18:00', '19:00'],
  total_canchas: 8,
  cancha_extra: 5,
  gap_min: 3,
  gap_max: 4,
  partidos_por_dia: {
    '2012': { viernes: 1, sabado: 2 },
    '2013': { viernes: 1, sabado: 2 },
    '2014': { viernes: 2, sabado: 1 },
    '2015': { viernes: 2, sabado: 1 },
  },
  max_repeticion_nombre: 3,
  evitar_mismo_nombre_turno: true,
};

const s = {
  app: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  header: {
    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
    color: '#fff',
    borderRadius: 12,
    padding: '20px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  headerTitle: { fontSize: 24, fontWeight: 800, marginBottom: 4 },
  headerSub: { fontSize: 14, opacity: 0.85 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20 },
  tab: {
    padding: '9px 20px', borderRadius: '8px 8px 0 0',
    fontSize: 14, fontWeight: 600,
    background: '#dce8f8', color: '#1565c0',
    border: 'none', cursor: 'pointer',
  },
  tabActive: { background: '#1565c0', color: '#fff' },
  actions: {
    display: 'flex', gap: 12, flexWrap: 'wrap',
    background: '#fff', borderRadius: 10,
    padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    marginBottom: 20,
  },
  btnPrimary: { background: '#1565c0', color: '#fff', padding: '11px 24px', fontSize: 15 },
  btnSecondary: { background: '#43a047', color: '#fff' },
  btnOutline: { background: '#fff', color: '#1565c0', border: '2px solid #1565c0' },
  status: {
    borderRadius: 8, padding: '12px 16px',
    fontSize: 14, marginBottom: 16,
  },
  statusOk: { background: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7' },
  statusErr: { background: '#ffebee', color: '#b71c1c', border: '1px solid #ef9a9a' },
  statusLoad: { background: '#e3f2fd', color: '#0d47a1', border: '1px solid #90caf9' },
  preview: {
    background: '#fff', borderRadius: 10,
    padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  previewTitle: { fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#333' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 },
  stat: {
    textAlign: 'center', padding: '12px',
    background: '#f5f5f5', borderRadius: 8,
  },
  statNum: { fontSize: 26, fontWeight: 800, color: '#1565c0' },
  statLabel: { fontSize: 12, color: '#666' },
};

export default function App() {
  const [tab, setTab] = useState('restricciones');
  const [restricciones, setRestricciones] = useState(DEFAULT_RESTRICCIONES);
  const [archivos, setArchivos] = useState({});
  const [estado, setEstado] = useState(null); // null | {loading} | {ok, data} | {error}

  const categorias = Object.keys(restricciones.partidos_por_dia);
  const todosSubidos = categorias.length > 0 && categorias.every(c => archivos[c]);

  const enviar = async (endpoint, filename) => {
    setEstado({ loading: true, msg: 'Generando programación...' });
    try {
      const form = new FormData();
      form.append('restricciones', JSON.stringify(restricciones));
      Object.values(archivos).forEach(f => form.append('archivos', f));

      const res = await fetch(`${API}${endpoint}`, { method: 'POST', body: form });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
        setEstado({ error: err.detail || 'Error del servidor' });
        return;
      }

      if (endpoint === '/generar') {
        const data = await res.json();
        setEstado({ ok: true, data });
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setEstado({ ok: true, msg: `✅ Archivo descargado: ${filename}` });
      }
    } catch (e) {
      setEstado({ error: `No se pudo conectar al servidor (${API}). ¿Está corriendo el backend?` });
    }
  };

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.headerTitle}>⚽ Programador de Torneos</div>
        <div style={s.headerSub}>Configurá las restricciones, subí los fixtures y generá la grilla automáticamente</div>
      </div>

      <div style={s.tabs}>
        {[['restricciones', '⚙️ Restricciones'], ['archivos', '📁 Archivos']].map(([key, label]) => (
          <button key={key} style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
            onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'restricciones' && (
        <Restricciones data={restricciones} onChange={setRestricciones} />
      )}

      {tab === 'archivos' && (
        <SubirArchivos
          categorias={categorias}
          archivos={archivos}
          onArchivos={setArchivos}
        />
      )}

      {estado && (
        <div style={{
          ...s.status,
          ...(estado.loading ? s.statusLoad : estado.error ? s.statusErr : s.statusOk)
        }}>
          {estado.loading && '⏳ ' + estado.msg}
          {estado.error && '❌ ' + estado.error}
          {estado.ok && estado.msg}
          {estado.ok && estado.data && (
            <div style={s.statsGrid}>
              <div style={s.stat}>
                <div style={s.statNum}>{estado.data.total}</div>
                <div style={s.statLabel}>Partidos totales</div>
              </div>
              <div style={s.stat}>
                <div style={{ ...s.statNum, color: '#2e7d32' }}>{estado.data.programados}</div>
                <div style={s.statLabel}>Programados ✅</div>
              </div>
              <div style={s.stat}>
                <div style={{ ...s.statNum, color: estado.data.fallidos > 0 ? '#c62828' : '#2e7d32' }}>
                  {estado.data.fallidos}
                </div>
                <div style={s.statLabel}>Sin asignar {estado.data.fallidos > 0 ? '⚠️' : '✅'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={s.actions}>
        <button
          style={{ ...s.btnPrimary, ...((!todosSubidos || estado?.loading) ? { opacity: 0.5 } : {}) }}
          disabled={!todosSubidos || estado?.loading}
          onClick={() => enviar('/generar/excel-programacion', 'Torneo_Programacion.xlsx')}
        >
          📥 Descargar Programación
        </button>

        <button
          style={{ ...s.btnSecondary, ...((!todosSubidos || estado?.loading) ? { opacity: 0.5 } : {}) }}
          disabled={!todosSubidos || estado?.loading}
          onClick={() => enviar('/generar/excel-categorias', 'Grilla_Por_Categoria.xlsx')}
        >
          📊 Descargar Grilla por Categoría
        </button>

        <button
          style={{ ...s.btnOutline, ...((!todosSubidos || estado?.loading) ? { opacity: 0.5 } : {}) }}
          disabled={!todosSubidos || estado?.loading}
          onClick={() => enviar('/generar', null)}
        >
          🔍 Solo validar
        </button>

        {!todosSubidos && (
          <span style={{ fontSize: 13, color: '#888', alignSelf: 'center' }}>
            Falta subir: {categorias.filter(c => !archivos[c]).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
