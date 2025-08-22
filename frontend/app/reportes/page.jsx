// frontend/app/reportes/page.jsx
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

  // Animación de entrada suave
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 1) Residuos (historial)
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

    // 2) Grupos + Adeudos
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

    // 3) Solicitudes Aprobadas
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

    // 4) Inventarios
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

  // Descargas
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

  if (![3, 4].includes(usuario?.rol_id))
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="rounded-2xl bg-white/60 backdrop-blur border border-slate-200 p-8 text-center shadow-md">
          <p className="text-lg font-semibold">Acceso denegado</p>
          <p className="text-slate-500 mt-1">No cuentas con permisos para ver esta sección.</p>
        </div>
      </div>
    );

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const term = filtro.toLowerCase();
    return s.grupo.toLowerCase().includes(term) || s.docente.toLowerCase().includes(term);
  });

  return (
    <div
      className={[
        'min-h-screen',
        'bg-gradient-to-b from-slate-50 via-white to-slate-50',
        'px-4 sm:px-6 lg:px-8 py-8',
        'transition-all duration-500',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      {/* Encabezado */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Reportes</h1>
            <p className="text-slate-500 mt-1">
              Consulta rápida de historial, adeudos por grupo y consumos de inventario.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur px-3 py-2 text-sm text-slate-600 border border-slate-200 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Panel activo
            </span>
          </div>
        </div>
      </header>

      {/* Primer fila: tres tarjetas */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Historial de Residuos */}
        <Card>
          <SectionHeader
            title="Historial de Residuos"
            subtitle="Descarga en CSV o PDF"
            actions={
              historial.length > 5 ? (
                <Button subtle onClick={() => setShowHistorialModal(true)}>Mostrar más</Button>
              ) : null
            }
          />
          {historial.length === 0 ? (
            <EmptyState text="No hay registros." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 font-medium">Nombre</th>
                    <th className="py-2 font-medium">Grupo</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {historial.slice(0, 5).map((h, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="py-2">{h.nombre}</td>
                      <td className="py-2">{h.grupo}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button size="xs" variant="primary" onClick={() => downloadHistorialCSV(h.registros, h.nombre)}>
                            CSV
                          </Button>
                          <Button size="xs" variant="success" onClick={() => downloadHistorialPDF(h.registros, h.nombre)}>
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Grupos con adeudos */}
        <Card>
          <SectionHeader
            title="Grupos con adeudos"
            subtitle="Toca un grupo para ver detalle"
            actions={
              grupos.length > 5 ? (
                <Button subtle onClick={() => setShowGruposModal(true)}>Mostrar más</Button>
              ) : null
            }
          />
          {grupos.length === 0 ? (
            <EmptyState text="No hay grupos." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {grupos.slice(0, 5).map((g, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-slate-100 cursor-pointer hover:bg-slate-50/60 transition"
                      onClick={() => setGrupoDetalle(g)}
                    >
                      <td className="py-2">{g.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Solicitudes Aprobadas */}
        <Card>
          <SectionHeader
            title="Solicitudes Aprobadas"
            subtitle="Resumen de últimos registros"
            actions={
              solicitudes.length > 5 ? (
                <Button subtle onClick={() => setShowSolicitudesModal(true)}>Mostrar más</Button>
              ) : null
            }
          />
          {solicitudes.length === 0 ? (
            <EmptyState text="No hay solicitudes." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 font-medium">Materiales</th>
                    <th className="py-2 font-medium">Docente</th>
                    <th className="py-2 font-medium">Grupo</th>
                    <th className="py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.slice(0, 5).map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="py-2 whitespace-pre-line">
                        {s.materiales.map((m) => `${m.cantidad} ${m.unidad} ${m.nombre}`).join('\n')}
                      </td>
                      <td className="py-2">{s.docente}</td>
                      <td className="py-2">{s.grupo}</td>
                      <td className="py-2">{s.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Inventario: Líquidos */}
      <Card className="mt-6">
        <SectionHeader
          title="Inventario Reactivos Líquidos"
          subtitle="Consumos por mes"
          actions={
            inventarioLiquidos.datos.length > 5 ? (
              <Button subtle onClick={() => setShowLiquidosModal(true)}>Mostrar más</Button>
            ) : null
          }
        />
        {inventarioLiquidos.datos.length === 0 ? (
          <EmptyState text="No hay registros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Reactivo</th>
                  <th className="py-2 font-medium">Cantidad</th>
                  {inventarioLiquidos.meses.map((m) => (
                    <th key={m} className="py-2 font-medium capitalize">
                      {m}
                    </th>
                  ))}
                  <th className="py-2 font-medium">Existencia Final</th>
                  <th className="py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioLiquidos.datos.slice(0, 5).map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-2 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioLiquidos.meses.map((m) => (
                      <td key={m} className="py-2">{r.consumos[m] || 0}</td>
                    ))}
                    <td className="py-2">{r.existencia_final} {r.unidad}</td>
                    <td className="py-2">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inventario: Sólidos */}
      <Card className="mt-6">
        <SectionHeader
          title="Inventario Reactivos Sólidos"
          subtitle="Consumos por mes"
          actions={
            inventarioSolidos.datos.length > 5 ? (
              <Button subtle onClick={() => setShowSolidosModal(true)}>Mostrar más</Button>
            ) : null
          }
        />
        {inventarioSolidos.datos.length === 0 ? (
          <EmptyState text="No hay registros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Reactivo</th>
                  <th className="py-2 font-medium">Cantidad</th>
                  {inventarioSolidos.meses.map((m) => (
                    <th key={m} className="py-2 font-medium capitalize">
                      {m}
                    </th>
                  ))}
                  <th className="py-2 font-medium">Existencia Final</th>
                  <th className="py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioSolidos.datos.slice(0, 5).map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-2 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioSolidos.meses.map((m) => (
                      <td key={m} className="py-2">{r.consumos[m] || 0}</td>
                    ))}
                    <td className="py-2">{r.existencia_final} {r.unidad}</td>
                    <td className="py-2">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modales */}
      {showHistorialModal && (
        <Modal onClose={() => setShowHistorialModal(false)} title="Historial de Residuos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Nombre</th>
                  <th className="py-2 font-medium">Grupo</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-2">{h.nombre}</td>
                    <td className="py-2">{h.grupo}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button size="xs" variant="primary" onClick={() => downloadHistorialCSV(h.registros, h.nombre)}>
                          CSV
                        </Button>
                        <Button size="xs" variant="success" onClick={() => downloadHistorialPDF(h.registros, h.nombre)}>
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {showGruposModal && (
        <Modal onClose={() => setShowGruposModal(false)} title="Grupos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {grupos.map((g, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-slate-100 cursor-pointer hover:bg-slate-50/60 transition"
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
        </Modal>
      )}

      {grupoDetalle && (
        <Modal onClose={() => setGrupoDetalle(null)} title={grupoDetalle.nombre}>
          <div className="space-y-1">
            {grupoDetalle.adeudos.length === 0 ? (
              <p className="text-slate-500">Sin adeudos</p>
            ) : (
              grupoDetalle.adeudos.map((a, idx) => (
                <div key={idx} className="border-b border-slate-100 py-2">
                  {`${a.cantidad} ${a.unidad} ${a.material}`}
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <Button variant="primary" onClick={() => downloadGrupoPDF(grupoDetalle)}>Descargar PDF</Button>
          </div>
        </Modal>
      )}

      {showSolicitudesModal && (
        <Modal onClose={() => setShowSolicitudesModal(false)} title="Solicitudes Aprobadas" stickyHeader>
          <div className="flex items-center gap-2 pb-3">
            <Input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Filtrar por grupo o docente…"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Materiales</th>
                  <th className="py-2 font-medium">Docente</th>
                  <th className="py-2 font-medium">Grupo</th>
                  <th className="py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-2 whitespace-pre-line">
                      {s.materiales.map((m) => `${m.cantidad} ${m.unidad} ${m.nombre}`).join('\n')}
                    </td>
                    <td className="py-2">{s.docente}</td>
                    <td className="py-2">{s.grupo}</td>
                    <td className="py-2">{s.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {showLiquidosModal && (
        <Modal onClose={() => setShowLiquidosModal(false)} title="Inventario Reactivos Líquidos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Reactivo</th>
                  <th className="py-2 font-medium">Cantidad</th>
                  {inventarioLiquidos.meses.map((m) => (
                    <th key={m} className="py-2 font-medium capitalize">
                      {m}
                    </th>
                  ))}
                  <th className="py-2 font-medium">Existencia Final</th>
                  <th className="py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioLiquidos.datos.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-2 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioLiquidos.meses.map((m) => (
                      <td key={m} className="py-2">{r.consumos[m] || 0}</td>
                    ))}
                    <td className="py-2">{r.existencia_final} {r.unidad}</td>
                    <td className="py-2">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {showSolidosModal && (
        <Modal onClose={() => setShowSolidosModal(false)} title="Inventario Reactivos Sólidos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Reactivo</th>
                  <th className="py-2 font-medium">Cantidad</th>
                  {inventarioSolidos.meses.map((m) => (
                    <th key={m} className="py-2 font-medium capitalize">
                      {m}
                    </th>
                  ))}
                  <th className="py-2 font-medium">Existencia Final</th>
                  <th className="py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {inventarioSolidos.datos.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-2 capitalize">{r.nombre.replace(/_/g, ' ')}</td>
                    <td className="py-2">{r.cantidad_inicial} {r.unidad}</td>
                    {inventarioSolidos.meses.map((m) => (
                      <td key={m} className="py-2">{r.consumos[m] || 0}</td>
                    ))}
                    <td className="py-2">{r.existencia_final} {r.unidad}</td>
                    <td className="py-2">{r.total_consumido} {r.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Estilos locales para animaciones ligeras */}
      <style jsx>{`
        :global(.modal-enter) { opacity: 0; transform: translateY(6px) scale(0.98); }
        :global(.modal-enter-active) { opacity: 1; transform: translateY(0) scale(1); transition: all 160ms ease; }
        :global(.modal-exit) { opacity: 1; transform: translateY(0) scale(1); }
        :global(.modal-exit-active) { opacity: 0; transform: translateY(6px) scale(0.98); transition: all 140ms ease; }
      `}</style>
    </div>
  );
}

/* ----------------------- Componentes UI internos ----------------------- */

function Card({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded-2xl border border-slate-200 bg-white/80 backdrop-blur',
        'shadow-sm hover:shadow-md transition-shadow',
        'p-4 sm:p-5',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-slate-500">
      <span className="text-lg">🗂️</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = 'ghost',
  size = 'sm',
  subtle = false,
  className = '',
  type = 'button',
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl transition-all active:scale-[0.98]';
  const sizing = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
  }[size];

  const palette = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-400/50',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-400/50',
    ghost:
      'bg-white/70 text-slate-700 hover:bg-white shadow-sm hover:shadow border border-slate-200',
  }[variant];

  const subtleClasses = subtle ? 'bg-white/60 hover:bg-white' : '';

  return (
    <button type={type} onClick={onClick} className={[base, sizing, palette, subtleClasses, className].join(' ')}>
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={[
        'w-full sm:w-80 rounded-xl border border-slate-200 bg-white/80',
        'px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/40',
        props.className || '',
      ].join(' ')}
    />
  );
}

function Modal({ title, children, onClose, stickyHeader = false }) {
  // Montaje animado simple con clases CSS globales (enter/exit)
  const [phase, setPhase] = useState('modal-enter');
  useEffect(() => {
    const t = requestAnimationFrame(() => setPhase('modal-enter-active'));
    return () => cancelAnimationFrame(t);
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full max-w-4xl ${phase}`}>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div
            className={[
              'flex items-center justify-between gap-3',
              stickyHeader ? 'sticky top-0 bg-white/90 backdrop-blur border-b' : '',
              'px-4 sm:px-5 py-3',
            ].join(' ')}
          >
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{title}</h3>
            </div>
            <Button onClick={onClose} className="shrink-0">Cerrar</Button>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
