'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import {
  obtenerResiduos,
  obtenerAdeudosGlobal,
  obtenerGrupos,
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
    const [showGrupoAdeudosModal, setShowGrupoAdeudosModal] = useState(false);
  
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

        Promise.allSettled([obtenerGrupos(), obtenerAdeudosGlobal()])
      .then(([grRes, adeRes]) => {
        const listaGrupos = grRes.status === 'fulfilled' ? grRes.value : [];
        const adeudos = adeRes.status === 'fulfilled' ? adeRes.value : [];
        const grouped = {};
        (Array.isArray(adeudos) ? adeudos : []).forEach((a) => {
          const g = a.grupo || 'Sin grupo';
          if (!grouped[g]) grouped[g] = [];
          grouped[g].push({
           nombre_material: a.nombre_material || a.material || '',
            cantidad: a.cantidad,
            unidad: a.unidad,
             solicitante: a.solicitante,
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
       });

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

  if (![3, 4].includes(usuario?.rol_id)) return (
    <div className="container py-4 bg-danger text-white rounded text-center">
      <p className="fs-4"><i className="bi bi-exclamation-triangle me-2"></i>Acceso denegado</p>
    </div>
  );

  return (
    <div className="container-fluid py-5 bg-gradient">
      <h1 className="display-4 fw-bold mb-5 text-center text-dark animate-slide-in">
        <i className="bi bi-bar-chart-line-fill me-3 text-primary"></i>Reportes
      </h1>

       {/* Primera fila: Historial de Residuos y Grupos con Adeudos */}
      <div className="row g-4 mb-5">
        {/* Historial de Residuos */}
        <div className="col-md-4 col-12">
          <div className="card p-4 shadow-lg animate-card border-0 bg-white bg-opacity-95 h-100">
            <h2 className="card-title h5 mb-3 text-primary">
              <i className="bi bi-trash-fill me-2 text-primary"></i>Historial de Residuos
            </h2>
            {historial.length === 0 ? (
              <p className="text-muted"><i className="bi bi-info-circle me-2"></i>No hay registros.</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-sm table-hover table-bordered align-top">
                    <thead className="table-primary">
                      <tr>
                        <th className="text-start">Nombre</th>
                        <th className="text-start">Grupo</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.slice(0, 5).map((h, idx) => (
                        <tr key={idx} className="animate-row">
                          <td className="py-2 align-top">{h.nombre}</td>
                          <td className="py-2 align-top">{h.grupo}</td>
                          <td className="py-2 text-center align-top">
                            <button
                              onClick={() => downloadHistorialCSV(h.registros, h.nombre)}
                              className="btn btn-sm btn-outline-primary me-2 animate-button"
                            >
                              <i className="bi bi-file-earmark-arrow-down-fill me-1"></i>CSV
                            </button>
                            <button
                              onClick={() => downloadHistorialPDF(h.registros, h.nombre)}
                              className="btn btn-sm btn-outline-success animate-button"
                            >
                              <i className="bi bi-file-earmark-pdf-fill me-1"></i>PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historial.length > 5 && (
                  <button
                    className="btn btn-link text-decoration-underline text-primary mt-2 animate-button"
                    onClick={() => setShowHistorialModal(true)}
                  >
                    <i className="bi bi-chevron-double-down me-1"></i>Mostrar más
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Grupos con Adeudos */}
       <div className="col-md-8 col-12">
          <div className="card p-4 shadow-lg animate-card border-0 bg-white bg-opacity-95 h-100">
            <h2 className="card-title h5 mb-3 text-teal">
              <i className="bi bi-people-fill me-2 text-teal"></i>Grupos con Adeudos
            </h2>
            {grupos.length === 0 ? (
              <p className="text-muted"><i className="bi bi-info-circle me-2"></i>No hay grupos.</p>
            ) : (
              <div className="row h-100">
               <div className="col-12 col-md-auto border-end mb-3 mb-md-0">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover table-bordered w-auto">
                      <thead className="table-teal">
                        <tr>
                          <th className="text-start">Nombre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupos.slice(0, 5).map((g, idx) => (
                          <tr
                            key={idx}
                            className="animate-row cursor-pointer"
                            onClick={() => setGrupoDetalle(g)}
                          >
                            <td className="py-2">{g.nombre}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {grupos.length > 5 && (
                    <button
                      className="btn btn-link text-decoration-underline text-primary mt-2 animate-button"
                      onClick={() => setShowGruposModal(true)}
                    >
                      <i className="bi bi-chevron-double-down me-1"></i>Mostrar más
                    </button>
                  )}
                </div>
                <div className="col-12 col-md">
                  {grupoDetalle ? (
                    <>
                      {grupoDetalle.adeudos.length === 0 ? (
                        <p className="text-muted"><i className="bi bi-info-circle me-2"></i>Sin adeudos</p>
                      ) : (
                        <>
                          <div className="table-responsive">
                            <table className="table table-sm table-hover table-bordered">
                              <thead className="table-teal">
                                <tr>
                                  <th>Cantidad</th>
                                  <th>Material</th>
                                  <th>Solicitante</th>
                                </tr>
                              </thead>
                              <tbody>
                                {grupoDetalle.adeudos.slice(0, 5).map((a, idx) => (
                                  <tr key={idx} className="animate-row">
                                    <td className="py-2">{a.cantidad} {a.unidad}</td>
                                  <td className="py-2">{a.nombre_material}</td>
                                    <td className="py-2">{a.solicitante}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {grupoDetalle.adeudos.length > 5 && (
                            <button
                              className="btn btn-link text-decoration-underline text-primary mt-2 animate-button"
                              onClick={() => setShowGrupoAdeudosModal(true)}
                            >
                              <i className="bi bi-chevron-double-down me-1"></i>Ver más
                            </button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-muted"><i className="bi bi-info-circle me-2"></i>Selecciona un grupo para ver los adeudos que se tienen</p>
                  )}
                </div>
             </div>
            )}
          </div>
        </div>
      </div>

      {/* Segunda fila: Inventario Reactivos Líquidos */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card p-4 shadow-lg animate-card border-0 bg-white bg-opacity-95">
            <h2 className="card-title h5 mb-3 text-info">
              <i className="bi bi-droplet-fill me-2 text-info"></i>Inventario Reactivos Líquidos
            </h2>
            {inventarioLiquidos.datos.length === 0 ? (
              <p className="text-muted"><i className="bi bi-info-circle me-2"></i>No hay registros.</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-sm table-hover table-bordered">
                    <thead className="table-info">
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
                        <tr key={idx} className="animate-row">
                          <td className="py-2 text-capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                          <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                          {inventarioLiquidos.meses.map((m) => (
                            <td key={m} className="py-2">
                              {r.consumos[m] || 0}
                            </td>
                          ))}
                          <td className="py-2">{r.existencia_final} {r.unidad}</td>
                          <td className="py-2">{r.total_consumido} {r.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {inventarioLiquidos.datos.length > 5 && (
                  <button
                    className="btn btn-link text-decoration-underline text-primary mt-2 animate-button"
                    onClick={() => setShowLiquidosModal(true)}
                  >
                    <i className="bi bi-chevron-double-down me-1"></i>Mostrar más
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tercera fila: Inventario Reactivos Sólidos */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card p-4 shadow-lg animate-card border-0 bg-white bg-opacity-95">
            <h2 className="card-title h5 mb-3 text-purple">
              <i className="bi bi-cube-fill me-2 text-purple"></i>Inventario Reactivos Sólidos
            </h2>
            {inventarioSolidos.datos.length === 0 ? (
              <p className="text-muted"><i className="bi bi-info-circle me-2"></i>No hay registros.</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-sm table-hover table-bordered">
                    <thead className="table-purple">
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
                        <tr key={idx} className="animate-row">
                          <td className="py-2 text-capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                          <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                          {inventarioSolidos.meses.map((m) => (
                            <td key={m} className="py-2">
                              {r.consumos[m] || 0}
                            </td>
                          ))}
                          <td className="py-2">{r.existencia_final} {r.unidad}</td>
                          <td className="py-2">{r.total_consumido} {r.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {inventarioSolidos.datos.length > 5 && (
                  <button
                    className="btn btn-link text-decoration-underline text-primary mt-2 animate-button"
                    onClick={() => setShowSolidosModal(true)}
                  >
                    <i className="bi bi-chevron-double-down me-1"></i>Mostrar más
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      {showHistorialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center animate-slide-in">
          <div className="bg-white max-h-[80vh] w-full max-w-2xl p-5 overflow-y-auto rounded-lg shadow-2xl bg-opacity-95">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg text-primary">
                <i className="bi bi-trash-fill me-2 text-primary"></i>Historial de Residuos
              </h3>
              <button onClick={() => setShowHistorialModal(false)} className="btn btn-outline-danger btn-sm animate-button">
                <i className="bi bi-x-lg"></i> Cerrar
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover table-bordered align-top">
                <thead className="table-primary">
                  <tr>
                    <th>Nombre</th>
                    <th>Grupo</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h, idx) => (
                    <tr key={idx} className="animate-row">
                      <td className="py-2 align-top">{h.nombre}</td>
                      <td className="py-2 align-top">{h.grupo}</td>
                      <td className="py-2 text-center align-top">
                        <button
                          onClick={() => downloadHistorialCSV(h.registros, h.nombre)}
                          className="btn btn-sm btn-outline-primary me-2 animate-button"
                        >
                          <i className="bi bi-file-earmark-arrow-down-fill me-1"></i>CSV
                        </button>
                        <button
                          onClick={() => downloadHistorialPDF(h.registros, h.nombre)}
                          className="btn btn-sm btn-outline-success animate-button"
                        >
                          <i className="bi bi-file-earmark-pdf-fill me-1"></i>PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showGruposModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center animate-slide-in">
          <div className="bg-white max-h-[80vh] w-full max-w-md p-5 overflow-y-auto rounded-lg shadow-2xl bg-opacity-95">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg text-teal">
                <i className="bi bi-people-fill me-2 text-teal"></i>Grupos
              </h3>
              <button onClick={() => setShowGruposModal(false)} className="btn btn-outline-danger btn-sm animate-button">
                <i className="bi bi-x-lg"></i> Cerrar
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover table-bordered">
                <thead className="table-teal">
                  <tr>
                    <th>Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((g, idx) => (
                    <tr
                      key={idx}
                      className="animate-row cursor-pointer"
                      onClick={() => {
                        setGrupoDetalle(g);
                        setShowGruposModal(false);
                      }}
                    >
                      <td className="py-2">{g.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showGrupoAdeudosModal && grupoDetalle && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center animate-slide-in">
    <div className="bg-white max-h-[80vh] w-full max-w-md p-5 overflow-y-auto rounded-lg shadow-2xl bg-opacity-95">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-lg text-teal">
          <i className="bi bi-people-fill me-2 text-teal"></i>{grupoDetalle.nombre}
        </h3>
        <button
          onClick={() => setShowGrupoAdeudosModal(false)}
          className="btn btn-outline-danger btn-sm animate-button"
        >
          <i className="bi bi-x-lg"></i> Cerrar
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover table-bordered">
          <thead className="table-teal">
            <tr>
              <th>Cantidad</th>
              <th>Material</th>
              <th>Solicitante</th>
            </tr>
          </thead>
          <tbody>
            {grupoDetalle.adeudos.map((a, idx) => (
              <tr key={idx} className="animate-row">
                <td className="py-2">{a.cantidad} {a.unidad}</td>
             <td className="py-2">{a.nombre_material}</td>
                <td className="py-2">{a.solicitante}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}


      {showLiquidosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center animate-slide-in">
          <div className="bg-white w-full max-w-5xl p-5 max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl bg-opacity-95">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg text-info">
                <i className="bi bi-droplet-fill me-2 text-info"></i>Inventario Reactivos Líquidos
              </h3>
              <button onClick={() => setShowLiquidosModal(false)} className="btn btn-outline-danger btn-sm animate-button">
                <i className="bi bi-x-lg"></i> Cerrar
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover table-bordered">
                <thead className="table-info">
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
                    <tr key={idx} className="animate-row">
                      <td className="py-2 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                      <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                      {inventarioLiquidos.meses.map((m) => (
                        <td key={m} className="py-2">
                          {r.consumos[m] || 0}
                        </td>
                      ))}
                      <td className="py-2">{r.existencia_final} {r.unidad}</td>
                      <td className="py-2">{r.total_consumido} {r.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showSolidosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center animate-slide-in">
          <div className="bg-white w-full max-w-5xl p-5 max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl bg-opacity-95">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg text-purple">
                <i className="bi bi-cube-fill me-2 text-purple"></i>Inventario Reactivos Sólidos
              </h3>
              <button onClick={() => setShowSolidosModal(false)} className="btn btn-outline-danger btn-sm animate-button">
                <i className="bi bi-x-lg"></i> Cerrar
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover table-bordered">
                <thead className="table-purple">
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
                    <tr key={idx} className="animate-row">
                      <td className="py-2 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                      <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                      {inventarioSolidos.meses.map((m) => (
                        <td key={m} className="py-2">
                          {r.consumos[m] || 0}
                        </td>
                      ))}
                      <td className="py-2">{r.existencia_final} {r.unidad}</td>
                      <td className="py-2">{r.total_consumido} {r.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        body {
          background: url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed;
          background-size: cover;
          min-height: 100vh;
          color: #333;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .bg-gradient {
          background: transparent;
        }
        .card {
          border-radius: 15px;
          transition: transform 0.4s ease, box-shadow 0.4s ease, background-color 0.3s ease;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3) !important;
          background-color: rgba(255, 255, 255, 0.98);
        }
        .animate-card {
          animation: slideIn 0.6s ease-in-out;
        }
        .animate-row {
          animation: fadeIn 0.6s ease-in-out;
        }
        .animate-slide-in {
          animation: slideIn 0.6s ease-in-out;
        }
        .animate-button {
          transition: all 0.3s ease;
          border-radius: 8px;
        }
        .animate-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .animate-input {
          transition: all 0.3s ease;
          border-radius: 8px;
        }
        .animate-input:focus {
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.7);
          border-color: #3b82f6;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .table {
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.9);
        }
        .table th, .table td {
          vertical-align: top;
          padding: 12px;
        }
        .table-hover tbody tr:hover {
          background-color: rgba(59, 130, 246, 0.15);
          transition: background-color 0.3s ease;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .btn-outline-primary {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        .btn-outline-primary:hover {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .btn-outline-success {
          border-color: #22c55e;
          color: #22c55e;
        }
        .btn-outline-success:hover {
          background-color: #22c55e;
          color: white;
          border-color: #22c55e;
        }
        .btn-outline-danger {
          border-color: #ef4444;
          color: #ef4444;
        }
        .btn-outline-danger:hover {
          background-color: #ef4444;
          color: white;
          border-color: #ef4444;
        }
        .form-control {
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.9);
        }
        .text-primary {
          color: #3b82f6 !important;
        }
        .table-primary {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        .text-teal {
          color: #14b8a6 !important;
        }
        .table-teal {
          background-color: #14b8a6 !important;
          color: white !important;
        }
        .text-success {
          color: #22c55e !important;
        }
        .table-success {
          background-color: #22c55e !important;
          color: white !important;
        }
        .text-info {
          color: #06b6d4 !important;
        }
        .table-info {
          background-color: #06b6d4 !important;
          color: white !important;
        }
        .text-purple {
          color: #8b5cf6 !important;
        }
        .table-purple {
          background-color: #8b5cf6 !important;
          color: white !important;
        }
        .h-100 {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .h-100 .table {
          flex-grow: 1;
        }
        @media (max-width: 768px) {
          .display-4 {
            font-size: 2.5rem;
          }
          .card {
            padding: 1rem;
          }
          .table th, .table td {
            padding: 0.5rem;
          }
        }
        @media (max-width: 576px) {
          .display-4 {
            font-size: 2rem;
          }
          .btn-sm {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
