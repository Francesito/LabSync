// frontend/app/reportes/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { obtenerResiduos } from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportesPage() {
  const { usuario } = useAuth();

   const [historial, setHistorial] = useState([]);
  const [showHistorialModal, setShowHistorialModal] = useState(false);

  const [grupos, setGrupos] = useState([]);
  const [showGruposModal, setShowGruposModal] = useState(false);
  const [grupoDetalle, setGrupoDetalle] = useState(null);

  const [solicitudes, setSolicitudes] = useState([]);
  const [showSolicitudesModal, setShowSolicitudesModal] = useState(false);
  const [filtro, setFiltro] = useState('');

  const [inventarioLiquidos, setInventarioLiquidos] = useState([]);
  const [showLiquidosModal, setShowLiquidosModal] = useState(false);

  const [inventarioSolidos, setInventarioSolidos] = useState([]);
  const [showSolidosModal, setShowSolidosModal] = useState(false);

  useEffect(() => {
    obtenerResiduos()
      .then((data) => {
        const grouped = {};
        (Array.isArray(data) ? data : []).forEach((e) => {
          const key = `${e.nombre || ''}-${e.grupo || ''}`;
          if (!grouped[key]) {
            grouped[key] = { nombre: e.nombre || '', grupo: e.grupo || '', registros: [] };
          }
          grouped[key].registros.push(e);
        });
        setHistorial(Object.values(grouped));
      })
      .catch(() => setHistorial([]));

    // Datos de ejemplo para las demás tablas
    setGrupos([
      {
        nombre: '1A',
        adeudos: [
          { material: 'Bureta', cantidad: 1, unidad: 'u' },
          { material: 'Agua destilada', cantidad: 100, unidad: 'ml' },
        ],
      },
      {
        nombre: '2B',
        adeudos: [{ material: 'Probeta', cantidad: 2, unidad: 'u' }],
      },
      {
        nombre: '3C',
        adeudos: [{ material: 'Sosa cáustica', cantidad: 50, unidad: 'g' }],
      },
      {
        nombre: '4D',
        adeudos: [{ material: 'Matraz', cantidad: 1, unidad: 'u' }],
      },
      {
        nombre: '5E',
        adeudos: [{ material: 'Pipeta', cantidad: 3, unidad: 'u' }],
      },
      {
        nombre: '6F',
        adeudos: [{ material: 'Vaso de precipitados', cantidad: 2, unidad: 'u' }],
      },
    ]);

    setSolicitudes([
      {
        id: 1,
        materiales: [
          { nombre: 'acido citrico', cantidad: 50, unidad: 'ml' },
          { nombre: 'sosa', cantidad: 100, unidad: 'g' },
        ],
        docente: 'Dr. López',
        grupo: '1A',
        fecha: '2024-09-01',
      },
      {
        id: 2,
        materiales: [{ nombre: 'pipeta', cantidad: 1, unidad: 'u' }],
        docente: 'Mtra. Pérez',
        grupo: '2B',
        fecha: '2024-09-05',
      },
      {
        id: 3,
        materiales: [{ nombre: 'termometro', cantidad: 1, unidad: 'u' }],
        docente: 'Dr. Hernández',
        grupo: '3C',
        fecha: '2024-09-10',
      },
      {
        id: 4,
        materiales: [{ nombre: 'cinta', cantidad: 2, unidad: 'u' }],
        docente: 'Mtra. Ruiz',
        grupo: '4D',
        fecha: '2024-09-15',
      },
      {
        id: 5,
        materiales: [{ nombre: 'microscopio', cantidad: 1, unidad: 'u' }],
        docente: 'Dr. Díaz',
        grupo: '5E',
        fecha: '2024-09-20',
      },
      {
        id: 6,
        materiales: [{ nombre: 'balanza', cantidad: 1, unidad: 'u' }],
        docente: 'Mtra. León',
        grupo: '6F',
        fecha: '2024-09-25',
      },
    ]);

    setInventarioLiquidos([
      {
        nombre: 'acido citrico',
        stock: 500,
        consumo: { sept: 50, oct: 30, nov: 20, dec: 10 },
        existencia: 390,
      },
      {
        nombre: 'agua destilada',
        stock: 1000,
        consumo: { sept: 100, oct: 120, nov: 80, dec: 70 },
        existencia: 630,
      },
      {
        nombre: 'etanol',
        stock: 800,
        consumo: { sept: 60, oct: 40, nov: 30, dec: 20 },
        existencia: 650,
      },
      {
        nombre: 'acetona',
        stock: 400,
        consumo: { sept: 20, oct: 25, nov: 15, dec: 10 },
        existencia: 330,
      },
      {
        nombre: 'acido sulfurico',
        stock: 300,
        consumo: { sept: 10, oct: 15, nov: 10, dec: 5 },
        existencia: 260,
      },
      {
        nombre: 'acido clorhidrico',
        stock: 350,
        consumo: { sept: 15, oct: 10, nov: 20, dec: 10 },
        existencia: 295,
      },
    ]);

    setInventarioSolidos([
      {
        nombre: 'cloruro de sodio',
        stock: 2000,
        consumo: { sept: 200, oct: 150, nov: 100, dec: 50 },
        existencia: 1500,
      },
      {
        nombre: 'azucar',
        stock: 800,
        consumo: { sept: 60, oct: 50, nov: 40, dec: 30 },
        existencia: 620,
      },
      {
        nombre: 'bicarbonato de sodio',
        stock: 600,
        consumo: { sept: 40, oct: 35, nov: 25, dec: 20 },
        existencia: 480,
      },
      {
        nombre: 'sulfato de cobre',
        stock: 500,
        consumo: { sept: 20, oct: 30, nov: 25, dec: 15 },
        existencia: 410,
      },
      {
        nombre: 'carbonato de calcio',
        stock: 700,
        consumo: { sept: 35, oct: 30, nov: 25, dec: 20 },
        existencia: 590,
      },
      {
        nombre: 'nitrato de plata',
        stock: 300,
        consumo: { sept: 15, oct: 10, nov: 5, dec: 5 },
        existencia: 265,
      },
    ]);
  }, []);

  const downloadHistorialCSV = (registros, nombre) => {
    const headers = ['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad'];
    const rows = registros.map((r) => [r.fecha, r.laboratorio, r.reactivo, r.tipo, r.cantidad, r.unidad]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${nombre}_residuos.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadHistorialPDF = (registros, nombre) => {
    const doc = new jsPDF();
    const rows = registros.map((r) => [r.fecha, r.laboratorio, r.reactivo, r.tipo, r.cantidad, r.unidad]);
    autoTable(doc, { head: [['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad']], body: rows });
    doc.save(`${nombre}_residuos.pdf`);
  };

  const downloadGrupoPDF = (grupo) => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Cantidad', 'Material']],
      body: grupo.adeudos.map((a) => [`${a.cantidad} ${a.unidad}`, a.material]),
    });
    doc.save(`${grupo.nombre}_adeudos.pdf`);
  };

 if (![3, 4].includes(usuario?.rol_id)) return <p>Acceso denegado</p>;

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const term = filtro.toLowerCase();
    return (
      s.grupo.toLowerCase().includes(term) ||
      s.docente.toLowerCase().includes(term)
    );
  });
  
  return (
     <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Reportes</h1>

      {/* Primer fila: tres tablas */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Tabla 1: Historial de residuos */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Historial de Residuos</h2>
          {historial.length === 0 ? (
            <p>No hay registros.</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Nombre</th>
                    <th className="text-left">Grupo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {historial.slice(0, 5).map((h, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-1">{h.nombre}</td>
                      <td className="py-1">{h.grupo}</td>
                      <td className="py-1">
                        <button onClick={() => downloadHistorialCSV(h.registros, h.nombre)} className="mr-2 text-blue-600">CSV</button>
                        <button onClick={() => downloadHistorialPDF(h.registros, h.nombre)} className="text-green-600">PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historial.length > 5 && (
                <button className="mt-2 text-blue-600" onClick={() => setShowHistorialModal(true)}>
                  Mostrar más
                </button>
              )}
            </>
          )}
        </div>

        {/* Tabla 2: Grupos con adeudos */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Grupos con adeudos</h2>
          {grupos.length === 0 ? (
            <p>No hay grupos.</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <tbody>
                  {grupos.slice(0, 5).map((g, idx) => (
                    <tr
                      key={idx}
                      className="border-t cursor-pointer"
                      onClick={() => setGrupoDetalle(g)}
                    >
                      <td className="py-1">{g.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {grupos.length > 5 && (
                <button className="mt-2 text-blue-600" onClick={() => setShowGruposModal(true)}>
                  Mostrar más
                </button>
              )}
            </>
          )}
        </div>

        {/* Tabla 3: Solicitudes aprobadas */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Solicitudes Aprobadas</h2>
          {solicitudes.length === 0 ? (
            <p>No hay solicitudes.</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Materiales</th>
                    <th>Docente</th>
                    <th>Grupo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.slice(0, 5).map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-1 whitespace-pre-line">
                        {s.materiales
                          .map((m) => `${m.cantidad} ${m.unidad} ${m.nombre}`)
                          .join('\n')}
                      </td>
                      <td className="py-1">{s.docente}</td>
                      <td className="py-1">{s.grupo}</td>
                      <td className="py-1">{s.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {solicitudes.length > 5 && (
                <button className="mt-2 text-blue-600" onClick={() => setShowSolicitudesModal(true)}>
                  Mostrar más
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabla 4: Reactivos líquidos */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Inventario Reactivos Líquidos</h2>
        {inventarioLiquidos.length === 0 ? (
          <p>No hay registros.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Reactivo</th>
                  <th>Stock</th>
                  <th>Sept</th>
                  <th>Oct</th>
                  <th>Nov</th>
                  <th>Dic</th>
                  <th>Existencia Final</th>
                  <th>Consumo Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioLiquidos.slice(0, 5).map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-1 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-1">{r.stock}</td>
                    <td className="py-1">{r.consumo.sept}</td>
                    <td className="py-1">{r.consumo.oct}</td>
                    <td className="py-1">{r.consumo.nov}</td>
                    <td className="py-1">{r.consumo.dec}</td>
                    <td className="py-1">{r.existencia}</td>
                    <td className="py-1">
                      {r.consumo.sept + r.consumo.oct + r.consumo.nov + r.consumo.dec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventarioLiquidos.length > 5 && (
              <button className="mt-2 text-blue-600" onClick={() => setShowLiquidosModal(true)}>
                Mostrar más
              </button>
            )}
          </>
        )}
      </div>

      {/* Tabla 5: Reactivos sólidos */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Inventario Reactivos Sólidos</h2>
        {inventarioSolidos.length === 0 ? (
          <p>No hay registros.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Reactivo</th>
                  <th>Stock</th>
                  <th>Sept</th>
                  <th>Oct</th>
                  <th>Nov</th>
                  <th>Dic</th>
                  <th>Existencia Final</th>
                  <th>Consumo Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioSolidos.slice(0, 5).map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-1 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-1">{r.stock}</td>
                    <td className="py-1">{r.consumo.sept}</td>
                    <td className="py-1">{r.consumo.oct}</td>
                    <td className="py-1">{r.consumo.nov}</td>
                    <td className="py-1">{r.consumo.dec}</td>
                    <td className="py-1">{r.existencia}</td>
                    <td className="py-1">
                      {r.consumo.sept + r.consumo.oct + r.consumo.nov + r.consumo.dec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventarioSolidos.length > 5 && (
              <button className="mt-2 text-blue-600" onClick={() => setShowSolidosModal(true)}>
                Mostrar más
              </button>
            )}
          </>
        )}
      </div>

       
      {/* Modales */}
      {showHistorialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white max-h-[80vh] w-full max-w-2xl p-4 overflow-y-auto">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Historial de Residuos</h3>
              <button onClick={() => setShowHistorialModal(false)}>Cerrar</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Grupo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-1">{h.nombre}</td>
                    <td className="py-1">{h.grupo}</td>
                    <td className="py-1">
                      <button
                        onClick={() => downloadHistorialCSV(h.registros, h.nombre)}
                        className="mr-2 text-blue-600"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => downloadHistorialPDF(h.registros, h.nombre)}
                        className="text-green-600"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showGruposModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white max-h-[80vh] w-full max-w-md p-4 overflow-y-auto">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Grupos</h3>
              <button onClick={() => setShowGruposModal(false)}>Cerrar</button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {grupos.map((g, idx) => (
                  <tr
                    key={idx}
                    className="border-t cursor-pointer"
                    onClick={() => {
                      setGrupoDetalle(g);
                      setShowGruposModal(false);
                    }}
                  >
                    <td className="py-1">{g.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {grupoDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white max-h-[80vh] w-full max-w-md p-4 overflow-y-auto">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">{grupoDetalle.nombre}</h3>
              <button onClick={() => setGrupoDetalle(null)}>Cerrar</button>
            </div>
            <div className="space-y-1">
              {grupoDetalle.adeudos.map((a, idx) => (
                <div key={idx} className="border-b py-1">
                  {`${a.cantidad} ${a.unidad} ${a.material}`}
                </div>
              ))}
            </div>
            <button
              className="mt-2 text-blue-600"
              onClick={() => downloadGrupoPDF(grupoDetalle)}
            >
              Descargar PDF
            </button>
          </div>
        </div>
      )}

      {showSolicitudesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-3xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pb-2 mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Solicitudes Aprobadas</h3>
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar grupo o docente"
                className="border px-2 py-1"
              />
              <button onClick={() => setShowSolicitudesModal(false)}>Cerrar</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Materiales</th>
                  <th>Docente</th>
                  <th>Grupo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-1 whitespace-pre-line">
                      {s.materiales
                        .map((m) => `${m.cantidad} ${m.unidad} ${m.nombre}`)
                        .join('\n')}
                    </td>
                    <td className="py-1">{s.docente}</td>
                    <td className="py-1">{s.grupo}</td>
                    <td className="py-1">{s.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showLiquidosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Inventario Reactivos Líquidos</h3>
              <button onClick={() => setShowLiquidosModal(false)}>Cerrar</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Reactivo</th>
                  <th>Stock</th>
                  <th>Sept</th>
                  <th>Oct</th>
                  <th>Nov</th>
                  <th>Dic</th>
                  <th>Existencia Final</th>
                  <th>Consumo Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioLiquidos.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-1 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-1">{r.stock}</td>
                    <td className="py-1">{r.consumo.sept}</td>
                    <td className="py-1">{r.consumo.oct}</td>
                    <td className="py-1">{r.consumo.nov}</td>
                    <td className="py-1">{r.consumo.dec}</td>
                    <td className="py-1">{r.existencia}</td>
                    <td className="py-1">
                      {r.consumo.sept + r.consumo.oct + r.consumo.nov + r.consumo.dec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSolidosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Inventario Reactivos Sólidos</h3>
              <button onClick={() => setShowSolidosModal(false)}>Cerrar</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Reactivo</th>
                  <th>Stock</th>
                  <th>Sept</th>
                  <th>Oct</th>
                  <th>Nov</th>
                  <th>Dic</th>
                  <th>Existencia Final</th>
                  <th>Consumo Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioSolidos.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-1 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-1">{r.stock}</td>
                    <td className="py-1">{r.consumo.sept}</td>
                    <td className="py-1">{r.consumo.oct}</td>
                    <td className="py-1">{r.consumo.nov}</td>
                    <td className="py-1">{r.consumo.dec}</td>
                    <td className="py-1">{r.existencia}</td>
                    <td className="py-1">
                      {r.consumo.sept + r.consumo.oct + r.consumo.nov + r.consumo.dec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
