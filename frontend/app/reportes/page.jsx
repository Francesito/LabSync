'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import {
  obtenerResiduos,
  obtenerAdeudosGlobal,
  obtenerGrupos,
  obtenerSolicitudesAprobadas,
  obtenerInventarioLiquidos,
  obtenerInventarioSolidos,
} from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

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

  const [inventarioLiquidos, setInventarioLiquidos] = useState({ meses: [], datos: [] });
  const [showLiquidosModal, setShowLiquidosModal] = useState(false);
  
  const [inventarioSolidos, setInventarioSolidos] = useState({ meses: [], datos: [] });
  const [showSolidosModal, setShowSolidosModal] = useState(false);

  useEffect(() => {
    obtenerResiduos()
      .then((data) => {
        const grouped = {};
        (Array.isArray(data) ? data : []).forEach((e) => {
          const fecha = e.fecha ? new Date(e.fecha).toISOString().split('T')[0] : '';
          const key = `${e.nombre || ''}-${e.grupo || ''}`;
          if (!grouped[key]) {
            grouped[key] = { nombre: e.nombre || '', grupo: e.grupo || '', registros: [] };
          }
          grouped[key].registros.push({ ...e, fecha });
        });
        setHistorial(Object.values(grouped));
      })
      .catch(() => setHistorial([]));

      Promise.all([obtenerGrupos(), obtenerAdeudosGlobal()])
      .then(([listaGrupos, adeudos]) => {
        const grouped = {};
        (Array.isArray(adeudos) ? adeudos : []).forEach((a) => {
          const g = a.grupo || 'Sin grupo';
          if (!grouped[g]) grouped[g] = [];
          grouped[g].push({
            material: a.nombre_material,
            cantidad: a.cantidad,
            unidad: a.unidad,
          });
        });
        const all = (Array.isArray(listaGrupos) ? listaGrupos : []).map((g) => ({
          nombre: g.nombre,
          adeudos: grouped[g.nombre] || [],
        }));
        Object.keys(grouped).forEach((g) => {
          if (!all.some((gr) => gr.nombre === g)) {
            all.push({ nombre: g, adeudos: grouped[g] });
          }
        });
        setGrupos(all);
      })
      .catch(() => setGrupos([]));

    obtenerSolicitudesAprobadas()
      .then((data) => {
        const grouped = {};
        (Array.isArray(data) ? data : []).forEach((s) => {
          const id = s.solicitud_id;
          if (!grouped[id]) {
            grouped[id] = {
              id,
              materiales: [],
              docente: s.profesor || '',
              grupo: s.grupo_nombre || '',
              fecha: s.fecha_solicitud ? s.fecha_solicitud.split('T')[0] : '',
            };
          }
          const unidad = s.tipo === 'liquido' ? 'ml' : s.tipo === 'solido' ? 'g' : 'u';
          grouped[id].materiales.push({
            nombre: s.nombre_material,
            cantidad: s.cantidad,
            unidad,
          });
        });
        setSolicitudes(Object.values(grouped));
      })
      .catch(() => setSolicitudes([]));

    obtenerInventarioLiquidos()
      .then((data) => {
        setInventarioLiquidos({
          meses: data.meses || [],
          datos: Array.isArray(data.datos) ? data.datos : [],
        });
      })
    .catch(() => setInventarioLiquidos({ meses: [], datos: [] }));

     obtenerInventarioSolidos()
      .then((data) => {
        setInventarioSolidos({
          meses: data.meses || [],
          datos: Array.isArray(data.datos) ? data.datos : [],
        });
      })
       .catch(() => setInventarioSolidos({ meses: [], datos: [] }));
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
  <div className="container py-4 bg-light rounded shadow-sm">
    <h1 className="display-5 fw-bold mb-4 text-center text-primary"><i className="bi bi-bar-chart-line me-2"></i>Reportes</h1>

    {/* Secciones separadas, cada una abarcando todo el ancho */}
    {/* Sección 1: Historial de residuos */}
    <div className="mb-4">
      <div className="card p-3 shadow-sm animate-fade-in">
        <h2 className="card-title h5"><i className="bi bi-trash me-2 text-danger"></i>Historial de Residuos</h2>
        {historial.length === 0 ? (
          <p>No hay registros.</p>
        ) : (
          <>
             <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                   <th className="text-start">Nombre</th>
                  <th className="text-start">Grupo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
             {historial.slice(0, 5).map((h, idx) => (
                  <tr key={idx}>
                    <td className="py-1">{h.nombre}</td>
                    <td className="py-1">{h.grupo}</td>
                    <td className="py-1">
                      <button
                        onClick={() => downloadHistorialCSV(h.registros, h.nombre)}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        <i className="bi bi-file-earmark-arrow-down me-1"></i>CSV
                      </button>
                      <button
                        onClick={() => downloadHistorialPDF(h.registros, h.nombre)}
                        className="btn btn-sm btn-outline-success"
                      >
                        <i className="bi bi-file-earmark-pdf me-1"></i>PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        {historial.length > 5 && (
              <button
                className="btn btn-link p-0 text-decoration-underline"
                onClick={() => setShowHistorialModal(true)}
              >
                Mostrar más
              </button>
            )}
          </>
        )}
      </div>
    </div>

    {/* Sección 2: Grupos con adeudos */}
    <div className="mb-4">
      <div className="card p-3 shadow-sm animate-fade-in">
        <h2 className="card-title h5"><i className="bi bi-people me-2 text-warning"></i>Grupos con adeudos</h2>
        {grupos.length === 0 ? (
          <p>No hay grupos.</p>
        ) : (
          <>
            <table className="table table-sm table-hover">
              <tbody>
                {grupos.slice(0, 5).map((g, idx) => (
                  <tr
                    key={idx}
                    className="border-top cursor-pointer"
                    onClick={() => setGrupoDetalle(g)}
                  >
                    <td className="py-1">{g.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {grupos.length > 5 && (
              <button
                className="btn btn-link p-0 text-decoration-underline"
                onClick={() => setShowGruposModal(true)}
              >
                Mostrar más
              </button>
            )}
          </>
        )}
      </div>
    </div>

    {/* Sección 3: Solicitudes aprobadas */}
    <div className="mb-4">
      <div className="card p-3 shadow-sm animate-fade-in">
        <h2 className="card-title h5"><i className="bi bi-check-circle me-2 text-success"></i>Solicitudes Aprobadas</h2>
        {solicitudes.length === 0 ? (
          <p>No hay solicitudes.</p>
        ) : (
          <>
           <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                 <th>Materiales</th>
                  <th>Docente</th>
                  <th>Grupo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
             {solicitudes.slice(0, 5).map((s) => (
                  <tr key={s.id}>
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
              <button
                className="btn btn-link p-0 text-decoration-underline"
                onClick={() => setShowSolicitudesModal(true)}
              >
                Mostrar más
              </button>
            )}
          </>
        )}
      </div>
    </div>

    {/* Sección 4: Reactivos líquidos */}
    <div className="mb-4">
      <div className="card p-3 shadow-sm animate-fade-in">
        <h2 className="card-title h5"><i className="bi bi-droplet me-2 text-info"></i>Inventario Reactivos Líquidos</h2>
        {inventarioLiquidos.datos.length === 0 ? (
          <p>No hay registros.</p>
        ) : (
          <>
            <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>Reactivo</th>
                  <th>Cantidad</th>
                  {inventarioLiquidos.meses.map((m) => (
                    <th key={m} className="text-capitalize">
                      {m}
                    </th>
                  ))}
                  <th>Existencia Final</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioLiquidos.datos.slice(0, 5).map((r, idx) => (
                  <tr key={idx}>
                    <td className="py-1 text-capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-1">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioLiquidos.meses.map((m) => (
                      <td key={m} className="py-1">
                        {r.consumos[m] || 0}
                      </td>
                    ))}
                    <td className="py-1">{r.existencia_final} {r.unidad}</td>
                    <td className="py-1">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventarioLiquidos.datos.length > 5 && (
              <button
                className="btn btn-link p-0 text-decoration-underline"
                onClick={() => setShowLiquidosModal(true)}
              >
                Mostrar más
              </button>
            )}
          </>
        )}
      </div>
    </div>

    {/* Sección 5: Reactivos sólidos */}
    <div className="mb-4">
      <div className="card p-3 shadow-sm animate-fade-in">
        <h2 className="card-title h5"><i className="bi bi-cube me-2 text-secondary"></i>Inventario Reactivos Sólidos</h2>
        {inventarioSolidos.datos.length === 0 ? (
          <p>No hay registros.</p>
        ) : (
          <>
            <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>Reactivo</th>
                  <th>Cantidad</th>
                  {inventarioSolidos.meses.map((m) => (
                    <th key={m} className="text-capitalize">
                      {m}
                    </th>
                  ))}
                  <th>Existencia Final</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioSolidos.datos.slice(0, 5).map((r, idx) => (
                  <tr key={idx}>
                    <td className="py-1 text-capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-1">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioSolidos.meses.map((m) => (
                      <td key={m} className="py-1">
                        {r.consumos[m] || 0}
                      </td>
                    ))}
                    <td className="py-1">{r.existencia_final} {r.unidad}</td>
                    <td className="py-1">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventarioSolidos.datos.length > 5 && (
              <button
                className="btn btn-link p-0 text-decoration-underline"
                onClick={() => setShowSolidosModal(true)}
              >
                Mostrar más
              </button>
            )}
          </>
        )}
      </div>
    </div>

       
      {/* Modales */}
      {showHistorialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white max-h-[80vh] w-full max-w-2xl p-4 overflow-y-auto rounded shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold"><i className="bi bi-trash me-2 text-danger"></i>Historial de Residuos</h3>
             <button onClick={() => setShowHistorialModal(false)} className="btn btn-secondary btn-sm">Cerrar</button>
            </div>
           <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Grupo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, idx) => (
                 <tr key={idx} className="border-top">
                    <td className="py-1">{h.nombre}</td>
                    <td className="py-1">{h.grupo}</td>
                    <td className="py-1">
                      <button
                        onClick={() => downloadHistorialCSV(h.registros, h.nombre)}
                       className="btn btn-sm btn-outline-primary me-2"
                      >
                        <i className="bi bi-file-earmark-arrow-down me-1"></i>CSV
                      </button>
                      <button
                        onClick={() => downloadHistorialPDF(h.registros, h.nombre)}
                         className="btn btn-sm btn-outline-success"
                      >
                        <i className="bi bi-file-earmark-pdf me-1"></i>PDF
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white max-h-[80vh] w-full max-w-md p-4 overflow-y-auto rounded shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold"><i className="bi bi-people me-2 text-warning"></i>Grupos</h3>
             <button onClick={() => setShowGruposModal(false)} className="btn btn-secondary btn-sm">Cerrar</button>
            </div>
           <table className="table table-sm table-hover">
              <tbody>
                {grupos.map((g, idx) => (
                  <tr
                    key={idx}
                    className="border-top cursor-pointer"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white max-h-[80vh] w-full max-w-md p-4 overflow-y-auto rounded shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold"><i className="bi bi-people me-2 text-warning"></i>{grupoDetalle.nombre}</h3>
             <button onClick={() => setGrupoDetalle(null)} className="btn btn-secondary btn-sm">Cerrar</button>
            </div>
            <div className="space-y-1">
              {grupoDetalle.adeudos.length === 0 ? (
                <p>Sin adeudos</p>
              ) : (
                grupoDetalle.adeudos.map((a, idx) => (
                  <div key={idx} className="border-b py-1">
                    {`${a.cantidad} ${a.unidad} ${a.material}`}
                  </div>
                ))
              )}
            </div>
            <button
               className="btn btn-link p-0 mt-2 text-decoration-underline"
              onClick={() => downloadGrupoPDF(grupoDetalle)}
            >
              <i className="bi bi-file-earmark-pdf me-1"></i>Descargar PDF
            </button>
          </div>
        </div>
      )}

      {showSolicitudesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white w-full max-w-3xl p-4 max-h-[80vh] overflow-y-auto rounded shadow-lg">
            <div className="sticky top-0 bg-white pb-2 mb-2 flex items-center justify-between">
              <h3 className="font-semibold"><i className="bi bi-check-circle me-2 text-success"></i>Solicitudes Aprobadas</h3>
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar grupo o docente"
              className="form-control form-control-sm mx-2"
              />
              <button onClick={() => setShowSolicitudesModal(false)} className="btn btn-secondary btn-sm">Cerrar</button>
            </div>
             <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>Materiales</th>
                  <th>Docente</th>
                  <th>Grupo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((s) => (
                  <tr key={s.id} className="border-top">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white w-full max-w-4xl p-4 max-h-[80vh] overflow-y-auto rounded shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold"><i className="bi bi-droplet me-2 text-info"></i>Inventario Reactivos Líquidos</h3>
            <button onClick={() => setShowLiquidosModal(false)} className="btn btn-secondary btn-sm">Cerrar</button>
            </div>
             <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>Reactivo</th>
                  <th>Cantidad</th>
                 {inventarioLiquidos.meses.map((m) => (
                    <th key={m} className="capitalize">
                      {m}
                    </th>
                  ))}
                  <th>Existencia Final</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
              {inventarioLiquidos.datos.map((r, idx) => (
                  <tr key={idx} className="border-top">
                    <td className="py-1 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                 <td className="py-1">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioLiquidos.meses.map((m) => (
                      <td key={m} className="py-1">
                        {r.consumos[m] || 0}
                      </td>
                    ))}
                    <td className="py-1">{r.existencia_final} {r.unidad}</td>
                    <td className="py-1">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSolidosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white w-full max-w-4xl p-4 max-h-[80vh] overflow-y-auto rounded shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold"><i className="bi bi-cube me-2 text-secondary"></i>Inventario Reactivos Sólidos</h3>
                <button onClick={() => setShowSolidosModal(false)} className="btn btn-secondary btn-sm">Cerrar</button>
            </div>
            <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>Reactivo</th>
                    <th>Cantidad</th>
                  {inventarioSolidos.meses.map((m) => (
                    <th key={m} className="capitalize">
                      {m}
                    </th>
                  ))}
                  <th>Existencia Final</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                 {inventarioSolidos.datos.map((r, idx) => (
                <tr key={idx} className="border-top">
                    <td className="py-1 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-1">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioSolidos.meses.map((m) => (
                      <td key={m} className="py-1">
                        {r.consumos[m] || 0}
                      </td>
                    ))}
                    <td className="py-1">{r.existencia_final} {r.unidad}</td>
                    <td className="py-1">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    <style jsx global>{`
      .animate-fade-in {
        animation: fadeIn 0.5s ease-in-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .table-hover tbody tr:hover {
        background-color: #f8f9fa;
      }
      .cursor-pointer {
        cursor: pointer;
      }
    `}</style>
  </div>
);
}
