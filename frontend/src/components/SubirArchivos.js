import React, { useRef } from 'react';

const s = {
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    marginBottom: 20,
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#1565c0' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  catCard: {
    border: '2px dashed #ccc',
    borderRadius: 8,
    padding: '14px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  catCardOk: { borderColor: '#43a047', borderStyle: 'solid', background: '#f1f8e9' },
  catName: { fontWeight: 700, fontSize: 15, marginBottom: 6 },
  fileName: { fontSize: 12, color: '#555', marginTop: 4, wordBreak: 'break-all' },
  removeBtn: {
    background: '#ffebee', color: '#c62828',
    padding: '3px 8px', fontSize: 11, borderRadius: 4, marginTop: 6,
  },
};

const CAT_COLORS = {
  '2012': '#C8E6C9',
  '2013': '#B3E5FC',
  '2014': '#FFF9C4',
  '2015': '#F8BBD0',
};

export default function SubirArchivos({ categorias, archivos, onArchivos }) {
  const inputRefs = useRef({});

  const handleFile = (cat, file) => {
    if (!file) return;
    // Renombrar el archivo para incluir la categoría si no la tiene
    const nombre = file.name.includes(cat)
      ? file.name
      : `fixture_${cat}_${file.name}`;
    const renamedFile = new File([file], nombre, { type: file.type });
    onArchivos({ ...archivos, [cat]: renamedFile });
  };

  const handleDrop = (cat, e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(cat, file);
  };

  return (
    <div style={s.card}>
      <div style={s.title}>Subir fixtures por categoría</div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        Subí un Excel por cada categoría. El archivo debe tener las columnas:
        <strong> Número, Equipo 1, Equipo 2, Zona, Fecha</strong> (las demás pueden estar vacías).
      </p>

      <div style={s.catGrid}>
        {categorias.map(cat => {
          const archivo = archivos[cat];
          const color = CAT_COLORS[cat] || '#e0e0e0';
          return (
            <div
              key={cat}
              style={{
                ...s.catCard,
                ...(archivo ? s.catCardOk : {}),
                background: archivo ? '#f1f8e9' : color + '55',
                borderColor: archivo ? '#43a047' : '#aaa',
              }}
              onClick={() => inputRefs.current[cat]?.click()}
              onDrop={e => handleDrop(cat, e)}
              onDragOver={e => e.preventDefault()}
            >
              <div style={s.catName}>Categoría {cat}</div>
              {archivo ? (
                <>
                  <div style={{ fontSize: 22 }}>✅</div>
                  <div style={s.fileName}>{archivo.name}</div>
                  <button
                    style={s.removeBtn}
                    onClick={e => {
                      e.stopPropagation();
                      const updated = { ...archivos };
                      delete updated[cat];
                      onArchivos(updated);
                    }}
                  >
                    Quitar
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, color: '#aaa' }}>📁</div>
                  <div style={{ fontSize: 12, color: '#888' }}>Click o arrastrá acá</div>
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={el => (inputRefs.current[cat] = el)}
                style={{ display: 'none' }}
                onChange={e => handleFile(cat, e.target.files[0])}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
