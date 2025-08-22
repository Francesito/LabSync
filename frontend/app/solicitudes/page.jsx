'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../lib/auth';

const encabezadoUT = '/universidad.jpg';

/** Badge de estado */
const EstadoBadge = ({ estado }) => {
  const config = {
    'aprobación pendiente': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
    'aprobacion pendiente': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
    'entrega pendiente':    { bg: 'bg-blue-100',  text: 'text-blue-800',  icon: '📦' },
    'entregada':            { bg: 'bg-green-100', text: 'text-green-800', icon: '✓'  },
    'rechazada':            { bg: 'bg-red-100',   text: 'text-red-800',   icon: '✗'  },
    'cancelado':            { bg: 'bg-gray-100',  text: 'text-gray-800',  icon: '❌' },
    'cancelada':            { bg: 'bg-gray-100',  text: 'text-gray-800',  icon: '❌' },
    'eliminación automática por falta de recolección': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' },
    'eliminacion automatica por falta de recoleccion': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' },
    'pendiente':            { bg: 'bg-yellow-100',text: 'text-yellow-800',icon: '⏳' }
  };
  const safe = (estado || '').toLowerCase().trim();
  const { bg, text, icon } = config[safe] || config.pendiente;
  return (
    <span className={`${bg} ${text} inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-sm transition-colors duration-200 hover:bg-opacity-80`}>
      <span>{icon}</span>
      <span className="capitalize">{estado}</span>
    </span>
  );
};

const SkeletonRow = ({ colCount }) => (
  <tr>
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="h-4 bg-gray-200 rounded w-20 sm:w-24" />
      </td>
    ))}
  </tr>
);

const Th = ({ children, icon }) => (
  <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-[#003579] first:rounded-tl-lg last:rounded-tr-lg transition-colors duration-200 hover:bg-[#0056b3]">
    <div className="flex items-center gap-2">
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </div>
  </th>
);

const Td = ({ children, bold = false }) => (
  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 transition-colors duration-200 hover:bg-gray-50">
    <div className={`${bold ? 'font-semibold' : ''} transition-colors duration-200`}>
      {children}
    </div>
  </td>
);

const Btn = ({ children, color, onClick, disabled, icon }) => {
  const palette = {
    green:  'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    red:    'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    blue:   'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    gray:   'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
  }[color] || 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500';
  
  return (
    <button
      type="button"
      className={`${palette} text-white text-xs sm:text-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm hover:shadow-md flex items-center gap-2`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </button>
  );
};

function getUnidad(tipo) {
  return { liquido: 'ml', solido: 'g' }[tipo] || 'u';
}

function toLocalDateStr(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .split('T')[0];
}

/** Tabla genérica configurable por columnas */
function TablaSolicitudes({
  titulo,
  data,
  loading,
  showSolicitante = true,
  showEncargado = false,
  showGrupo = false,
  columnasFijas = {},
  usuario,
  onAccion,
  onEntregar,
  onPDF,
  procesandoId
}) {
  const columnas = {
    folio: columnasFijas.folio ?? true,
    solicitante: showSolicitante,
    encargado: showEncargado,
    materiales: columnasFijas.materiales ?? true,
    fecha: columnasFijas.fecha ?? true,
    grupo: showGrupo,
    estado: columnasFijas.estado ?? true,
    acciones: columnasFijas.acciones ?? true,
  };
  const colCount = Object.values(columnas).filter(Boolean).length;
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6 sm:mb-8 transition-colors duration-200 hover:border-blue-300">
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-[#003579] to-[#0056b3] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <span className="text-lg sm:text-xl">📋</span>
          {titulo}
        </h2>
        <span className="text-xs sm:text-sm bg-white/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm mt-2 sm:mt-0">
          {data?.length || 0} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-[#003579] to-[#0056b3]">
            <tr>
              {columnas.folio && <Th icon="🏷️">Folio</Th>}
              {columnas.solicitante && <Th icon="👤">Solicitante</Th>}
              {columnas.encargado && <Th icon="👨‍🏫">Encargado</Th>}
              {columnas.materiales && <Th icon="📦">Materiales</Th>}
              {columnas.fecha && <Th icon="📅">Fecha</Th>}
              {columnas.grupo && <Th icon="👥">Grupo</Th>}
              {columnas.estado && <Th icon="📊">Estado</Th>}
              {columnas.acciones && <Th icon="⚡">Acciones</Th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} colCount={colCount} />)
            ) : data.length === 0 ? (
              <tr>
                <td className="px-4 py-8 sm:px-6 sm:py-10 text-center text-gray-500" colSpan={colCount}>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl sm:text-4xl opacity-50">📭</span>
                    <span>No hay solicitudes para mostrar.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((s) => {
                const createDateStr = (s.fecha_solicitud || '').split('T')[0];
                const recoDateStr   = (s.fecha_recoleccion || '').split('T')[0];
                const dateStr = usuario?.rol === 'almacen' ? recoDateStr : createDateStr;
                const isOverdue =
                  recoDateStr && recoDateStr < todayStr && s.estado === 'entrega pendiente';
                const showMsg =
                  usuario?.rol !== 'almacen' &&
                  recoDateStr &&
                  recoDateStr > todayStr &&
                  recoDateStr !== todayStr;
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 transition-colors duration-200 ${isOverdue ? 'border-2 border-red-500 bg-red-50' : ''}`}>
                    {columnas.folio && <Td bold>{s.folio}</Td>}

                    {columnas.solicitante && (
                      <Td>{s.isDocenteRequest ? s.profesor : s.nombre_alumno}</Td>
                    )}

                    {columnas.encargado && <Td>{s.profesor || ''}</Td>}

                    {columnas.materiales && (
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="space-y-2">
                          {(s.items || []).map((m) => (
                            <div key={m.item_id} className="text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-gray-50 rounded-lg transition-colors duration-200 hover:bg-gray-100">
                              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                                {m.cantidad} {getUnidad(m.tipo)}
                              </span>
                              <span className="flex-1">{m.nombre_material}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    )}

                    {columnas.fecha && (
                      <Td>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span className="text-sm">📅</span>
                          <span>
                            {dateStr
                              ? new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-MX')
                              : ''}
                          </span>
                        </div>
                        {isOverdue && (
                          <div className="text-xs text-red-600 mt-1 p-2 bg-red-100 rounded-lg border-l-4 border-red-500 shadow-sm">
                            ⚠️ Ha pasado la fecha.<br />
                            Se eliminará la solicitud dentro de 1 día por falta de recolección
                          </div>
                        )}
                        {showMsg && (
                          <div className="text-xs text-orange-600 mt-1 p-2 bg-orange-100 rounded-lg border-l-4 border-orange-500 shadow-sm">
                            🕒 {recoDateStr === tomorrowStr
                              ? 'Entrega para mañana'
                              : 'Entrega para otro día'}
                          </div>
                        )}
                      </Td>
                    )}

                    {columnas.grupo && <Td>{s.grupo || ''}</Td>}

                    {columnas.estado && (
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <EstadoBadge estado={isOverdue ? 'cancelada' : s.estado} />
                      </td>
                    )}

                    {columnas.acciones && (
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-2">
                          {usuario?.rol === 'docente' &&
                            !s.isDocenteRequest &&
                            (s.estado === 'aprobación pendiente') && (
                              <>
                                <Btn
                                  color="green"
                                  icon="✅"
                                  onClick={() => onAccion(s.id, 'aprobar', 'entrega pendiente')}
                                  disabled={procesandoId === s.id}
                                >
                                  Aprobar
                                </Btn>
                                <Btn
                                  color="red"
                                  icon="❌"
                                  onClick={() => onAccion(s.id, 'rechazar', 'rechazada')}
                                  disabled={procesandoId === s.id}
                                >
                                  Rechazar
                                </Btn>
                              </>
                            )}

                          {usuario?.rol === 'almacen' &&
                            s.estado === 'entrega pendiente' &&
                            (s.fecha_recoleccion || '').split('T')[0] === toLocalDateStr(new Date()) && (
                              <Btn
                                color="blue"
                                icon="🚚"
                                onClick={() =>
                                  onEntregar ? onEntregar(s) : onAccion(s.id, 'entregar', 'entregada')
                                }
                                disabled={procesandoId === s.id}
                              >
                                Entregar
                              </Btn>
                            )}

                          {usuario?.rol === 'alumno' &&
                            (s.estado === 'aprobación pendiente') && (
                              <Btn
                                color="gray"
                                icon="🚫"
                                onClick={() => onAccion(s.id, 'cancelar', 'cancelado')}
                                disabled={procesandoId === s.id}
                              >
                                Cancelar
                              </Btn>
                            )}

                          <Btn
                            color="purple"
                            icon="📄"
                            onClick={() => onPDF(s)}
                            disabled={procesandoId === s.id}
                          >
                            PDF
                          </Btn>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SolicitudesPage() {
  const { usuario } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grupos, setGrupos] = useState({});
  const [alumnoData, setAlumnoData] = useState([]);
  const [docAprobar, setDocAprobar] = useState([]);
  const [docMias, setDocMias] = useState([]);
  const [almAlumnos, setAlmAlumnos] = useState([]);
  const [almDocentes, setAlmDocentes] = useState([]);
  const [procesando, setProcesando] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [minFilterDate, setMinFilterDate] = useState('');
  const [maxFilterDate, setMaxFilterDate] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('alumnos');
  const [search, setSearch] = useState('');
  const [modalEntrega, setModalEntrega] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 10000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const today = new Date();
    let day = today.getDay();
    if (day === 0) { today.setDate(today.getDate() + 1); day = 1; }
    else if (day === 6) { today.setDate(today.getDate() + 2); day = 1; }
    const friday = new Date(today);
    friday.setDate(today.getDate() + (5 - day));
    setMinFilterDate(toLocalDateStr(today));
    setMaxFilterDate(toLocalDateStr(friday));
  }, []);

  useEffect(() => {
    if (usuario === null) return;
    if (!usuario) {
      setError('Inicia sesión para ver solicitudes');
      router.push('/login');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Inicia sesión para ver solicitudes');
      router.push('/login');
      return;
    }

    const fetchAll = async () => {
      try {
        setLoading(true);

        try {
          const g = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/grupos`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const map = g.data.reduce((acc, it) => { acc[it.id] = it.nombre; return acc; }, {});
          setGrupos(map);
        } catch (_) {}

        let alumnoArr = [];
        let docAprobarArr = [];
        let docMiasArr = [];
        let almAlumnosArr = [];
        let almDocentesArr = [];
        
        if (usuario.rol === 'alumno') {
          const { data } = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/materials/usuario/solicitudes`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alumnoArr = agrupar(data, 'alumno', grupos);
          setAlumnoData(alumnoArr);
        }

        if (usuario.rol === 'docente') {
          const [aprobarRes, miasRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/solicitudes/docente/aprobar`,
              { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/solicitudes/docente/mias`,
              { headers: { Authorization: `Bearer ${token}` } })
          ]);
          docAprobarArr = agrupar(aprobarRes.data, 'docente', grupos);
          docMiasArr = agrupar(miasRes.data, 'docente', grupos);
          setDocAprobar(docAprobarArr);
          setDocMias(docMiasArr);
        }

        if (usuario.rol === 'almacen') {
          const { data } = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/materials/solicitudes/almacen`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const grouped = agrupar(data, 'almacen', grupos);
          almAlumnosArr = grouped.filter(s => !s.isDocenteRequest);
          almDocentesArr = grouped.filter(s => s.isDocenteRequest);
          setAlmAlumnos(almAlumnosArr);
          setAlmDocentes(almDocentesArr);
        }

        const todayStr = toLocalDateStr(new Date());
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        const mañanaStr = toLocalDateStr(mañana);

        let all = [];
        if (usuario.rol === 'alumno') all = alumnoArr;
        if (usuario.rol === 'docente') all = [...docAprobarArr, ...docMiasArr];
        if (usuario.rol === 'almacen') all = [...almAlumnosArr, ...almDocentesArr];
        const pendientes = all.filter(s => s.estado === 'entrega pendiente');
        const hoyCount = pendientes.filter(s => (s.fecha_recoleccion || '').split('T')[0] === todayStr).length;
        const mañanaCount = pendientes.filter(s => (s.fecha_recoleccion || '').split('T')[0] === mañanaStr).length;
        if (usuario.rol === 'almacen' && pendientes.length > 0) {
          let msg = '';
          if (hoyCount > 0 && mañanaCount > 0) {
            msg = `Tienes ${pendientes.length} solicitudes: ${hoyCount} para entregar hoy y ${mañanaCount} para entregar mañana`;
          } else if (hoyCount > 0) {
            msg = `Tienes ${hoyCount} solicitudes para entregar hoy`;
          } else if (mañanaCount > 0) {
            msg = `Tienes ${mañanaCount} solicitudes para entregar mañana`;
          } else {
            msg = `Tienes ${pendientes.length} solicitudes pendientes`;
          }
          setNotice(msg);
        }
        
        setError('');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Error al cargar solicitudes');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  function agrupar(rows, rolVista, gruposMap) {
    const by = {};
    for (const item of rows) {
      const key = item.solicitud_id ?? item.id;
      if (!key) continue;

      const isDocenteReq = !item.nombre_alumno;

      if (!by[key]) {
        const rawEstado = String(item.estado || '').toLowerCase().trim();
        const estadoUI = mapEstadoPorRol(rawEstado, isDocenteReq, rolVista);

        by[key] = {
          id: key,
          folio: item.folio || Math.random().toString(36).slice(2, 6).toUpperCase(),
          nombre_alumno: item.nombre_alumno || '',
          profesor: item.profesor || '',
          fecha_solicitud: item.fecha_solicitud,
          fecha_recoleccion: item.fecha_recoleccion,
          estado: estadoUI,
          rawEstado,
          isDocenteRequest: isDocenteReq,
          grupo: isDocenteReq
            ? ''
            : (item.grupo_nombre || (item.grupo_id && gruposMap[item.grupo_id]) || ''),
          items: []
        };
      }

      const nombreMaterialRaw =
        item?.nombre_material ??
        item?.nombreMaterial ??
        item?.material_nombre ??
        item?.materialNombre ??
        item?.material ??
        item?.nombre ??
        '';

      if (!nombreMaterialRaw) {
        console.debug('Fila sin nombre_material:', item);
      }

      const nombreMaterial = String(nombreMaterialRaw).replace(/_/g, ' ').trim();

      by[key].items.push({
        item_id: item.item_id ?? item.solicitud_item_id ?? `${key}-itm-${by[key].items.length + 1}`,
        nombre_material: nombreMaterial || '(Sin nombre)',
        cantidad: item.cantidad ?? item.cantidad_pedida ?? 0,
        tipo: item.tipo
      });
    }
    return Object.values(by).sort(
      (a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud)
    );
  }

  function mapEstadoPorRol(estadoSQL, isDocenteReq, rolVista) {
    const e = (estadoSQL || '').toLowerCase().trim();

    if (rolVista === 'almacen') {
      if (e === 'entregado') return 'entregada';
      if (e === 'rechazada') return 'rechazada';
      if (e === 'cancelado') return 'cancelado';
      if (e === 'sin recoleccion') return 'eliminación automática por falta de recolección';
      return 'entrega pendiente';
    }

    switch (e) {
      case 'pendiente':
        return isDocenteReq ? 'pendiente' : 'aprobación pendiente';
      case 'aprobada':
        return 'entrega pendiente';
      case 'entregado':
        return 'entregada';
      case 'rechazada':
        return 'rechazada';
      case 'cancelado':
        return 'cancelado';
      case 'sin recoleccion':
        return 'eliminación automática por falta de recolección';
      default:
        return 'pendiente';
    }
  }

  const actualizarEstado = async (id, accion, nuevoEstadoUI, items = []) => {
    if (procesando) return;
    setProcesando(id);
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/materials/solicitud/${id}/${accion}`,
        accion === 'entregar' ? { items_entregados: items } : {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const apply = (arrSetter) =>
        arrSetter(prev =>
          prev.map(s => {
            if (s.id !== id) return s;
            const ui = nuevoEstadoUI;
            const raw = uiToRaw(ui);
            const updated = { ...s, estado: ui, rawEstado: raw };
            if (accion === 'entregar') {
              const idsEntregados = items.map(i => i.item_id);
              updated.items = (s.items || [])
                .filter(it => idsEntregados.includes(it.item_id))
                .map(it => {
                  const entregado = items.find(i => i.item_id === it.item_id);
                  return {
                    ...it,
                    cantidad: entregado ? entregado.cantidad_entregada : it.cantidad
                  };
                });
            }
            return updated;
          })
        );

      const drop = (arrSetter) => arrSetter(prev => prev.filter(s => s.id !== id));

      if (accion === 'cancelar' || accion === 'rechazar') {
        drop(setAlumnoData);
        drop(setDocAprobar);
        drop(setDocMias);
        drop(setAlmAlumnos);
        drop(setAlmDocentes);
      } else {
        apply(setAlumnoData);
        apply(setDocAprobar);
        apply(setDocMias);
        apply(setAlmAlumnos);
        apply(setAlmDocentes);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || `Error al ${accion} la solicitud`);
    } finally {
      setProcesando(null);
    }
  };

  function uiToRaw(estadoUI) {
    const e = (estadoUI || '').toLowerCase().trim();
    if (e === 'entrega pendiente')        return 'aprobada';
    if (e === 'aprobación pendiente' || e === 'aprobacion pendiente') return 'pendiente';
    if (e === 'entregada')                return 'entregado';
    if (e === 'rechazada')                return 'rechazada';
    if (e === 'cancelado')                return 'cancelado';
    if (e === 'eliminación automática por falta de recolección' || e === 'eliminacion automatica por falta de recoleccion') return 'sin recoleccion';
    return e;
  }

  const filterByDate = (arr) =>
    filterDate
      ? arr.filter(s => (s.fecha_recoleccion || '').split('T')[0] === filterDate)
      : arr;

  const filteredAlmAlumnos = filterByDate(almAlumnos);
  const filteredAlmDocentes = filterByDate(almDocentes);

  const applySearch = (arr, includeGrupo = false) => {
    const term = search.toLowerCase();
    if (!term) return arr;
    return arr.filter(s =>
      s.folio.toLowerCase().includes(term) ||
      (s.nombre_alumno || '').toLowerCase().includes(term) ||
      (s.profesor || '').toLowerCase().includes(term) ||
      (includeGrupo && (s.grupo || '').toLowerCase().includes(term))
    );
  };

  const filteredDocAprobar = applySearch(docAprobar, true);
  const filteredDocMias = applySearch(docMias);
  const searchedAlmAlumnos = applySearch(filteredAlmAlumnos, true);
  const searchedAlmDocentes = applySearch(filteredAlmDocentes);

  const pendientesDocAlumnos = docAprobar.filter(
    s => ['aprobación pendiente', 'aprobacion pendiente'].includes((s.estado || '').toLowerCase())
  ).length;
  const pendientesAlmAlumnos = almAlumnos.filter(s => s.estado === 'entrega pendiente').length;
  const pendientesAlmDocentes = almDocentes.filter(s => s.estado === 'entrega pendiente').length;

  const abrirEntrega = (sol) => {
    setModalEntrega(sol);
    setSelectedItems([]);
  };

  const toggleItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const seleccionarTodos = () => {
    if (!modalEntrega) return;
    setSelectedItems(modalEntrega.items.map(i => i.item_id));
  };

  const confirmarEntrega = async () => {
    if (!modalEntrega) return;
    const items = modalEntrega.items
      .filter(i => selectedItems.includes(i.item_id))
      .map(i => ({ item_id: i.item_id, cantidad_entregada: i.cantidad }));
    await actualizarEstado(modalEntrega.id, 'entregar', 'entregada', items);
    setModalEntrega(null);
  };
  
  const descargarPDF = async (vale) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 167]
      });

      const toBase64 = async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('No se pudo cargar la imagen');
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const encabezadoImg = await toBase64(encabezadoUT);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const marginLeft = margin;
      const primary = [0, 0, 0];
      const secondary = [100, 100, 100];

      doc.setDrawColor(...primary);
      doc.setLineWidth(0.5);
      doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

      const maxHeaderWidth = (pageWidth - margin * 2) * 0.4;
      const maxHeaderHeight = 40;
      const originalRatio = 3.5;
      
      let headerWidth, headerHeight;
      
      if (maxHeaderWidth / originalRatio <= maxHeaderHeight) {
        headerWidth = maxHeaderWidth;
        headerHeight = maxHeaderWidth / originalRatio;
      } else {
        headerHeight = maxHeaderHeight;
        headerWidth = maxHeaderHeight * originalRatio;
      }

      headerHeight /= 2;
      
      const imageX = (pageWidth - headerWidth) / 2;
      const imageY = 18;
      
      doc.addImage(encabezadoImg, 'JPG', imageX, imageY, headerWidth, headerHeight);
      
      const titleY = imageY + headerHeight + 8;
      doc.setFontSize(18);
      doc.setTextColor(...primary);
      doc.setFont('helvetica', 'bold');
      doc.text('VALE DE ALMACÉN', pageWidth / 2, titleY, { align: 'center' });
      
      const lineY = titleY + 3;
      doc.setLineWidth(0.3);
      doc.line(marginLeft, lineY, pageWidth - marginLeft, lineY);
       
      const nombre = vale.isDocenteRequest ? vale.profesor : vale.nombre_alumno;
      const grupo = vale.isDocenteRequest ? 'No aplica' : (vale.grupo || '');
      const fechaReco = vale.fecha_recoleccion
        ? new Date(vale.fecha_recoleccion).toLocaleDateString('es-MX')
        : '';

      autoTable(doc, {
        startY: lineY + 5,
        theme: 'grid',
        head: [['Nombre', 'Grupo', 'Fecha de recolección']],
        body: [[nombre, grupo, fechaReco]],
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { fontSize: 11, cellPadding: 2 },
        styles: { lineColor: primary, lineWidth: 0.2 },
        margin: { top: 0, bottom: 0, left: margin, right: margin },
        tableWidth: pageWidth - margin * 2
      });

      const startY = doc.lastAutoTable.finalY;
      const items = vale.items || [];
      const rows = [];
      for (let i = 0; i < 10; i++) {
        const left = items[i];
        const right = items[i + 10];
        rows.push([
          left ? `${left.cantidad} ${getUnidad(left.tipo)}` : '',
          left ? left.nombre_material : '',
          right ? `${right.cantidad} ${getUnidad(right.tipo)}` : '',
          right ? right.nombre_material : ''
        ]);
      }

      autoTable(doc, {
        startY,
        theme: 'grid',
        head: [['Cantidad', 'Descripción', 'Cantidad', 'Descripción']],
        body: rows,
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { fontSize: 10, cellPadding: 2 },
        styles: { lineColor: primary, lineWidth: 0.2 },
        margin: { top: 0, bottom: 0, left: margin, right: margin },
        tableWidth: pageWidth - margin * 2
      });

      const afterTableY = doc.lastAutoTable.finalY + 4;
      const fechaDev = vale.fecha_devolucion || vale.fecha_recoleccion;
      const fechaDevolucion = fechaDev
        ? new Date(fechaDev).toLocaleDateString('es-MX')
        : '';
      const profesor = vale.profesor || '';

      doc.setFontSize(10);
      doc.setTextColor(...primary);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha devolución:', marginLeft, afterTableY);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaDevolucion, marginLeft + 40, afterTableY);

      doc.setFont('helvetica', 'bold');
      doc.text('Profesor:', pageWidth / 2, afterTableY);
      doc.setFont('helvetica', 'normal');
      doc.text(profesor, pageWidth / 2 + 25, afterTableY);
      doc.setFontSize(8);
      doc.setTextColor(...secondary);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'NOTA: LA FIRMA DEL PROFESOR AMPARA CUALQUIER EVENTO DURANTE EL TIEMPO QUE DURE LA PRÁCTICA, FAVOR DE RESPETAR LOS HORARIOS',
        pageWidth / 2,
        afterTableY + 6,
        { align: 'center', maxWidth: pageWidth - margin * 2 }
      );

      const nombrePDF = vale.isDocenteRequest
        ? `Vale_${vale.folio}_${(vale.profesor || '').replace(/\s+/g, '')}.pdf`
        : `Vale_${vale.folio}_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(nombrePDF);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-white rounded-xl shadow-md px-6 py-4 border border-gray-200">
            <div className="text-4xl sm:text-5xl">🐺</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Solicitudes de Préstamos</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">Gestiona tus solicitudes de materiales</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {usuario?.rol !== 'almacen' && notice && (
          <div className="mb-4 flex justify-end">
            <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl shadow-sm text-xs sm:text-sm flex items-center gap-2">
              <span>🔔</span>
              {notice}
            </div>
          </div>
        )}

        {usuario?.rol === 'alumno' && (
          <TablaSolicitudes
            titulo="Mis solicitudes"
            data={alumnoData}
            loading={loading}
            showSolicitante
            showEncargado={false}
            showGrupo={false}
            columnasFijas={{ folio: true, materiales: true, fecha: false, estado: true, acciones: true }}
            usuario={usuario}
            onAccion={actualizarEstado}
            onPDF={descargarPDF}
            procesandoId={procesando}
          />
        )}

        {usuario?.rol === 'docente' && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white rounded-xl p-4 shadow-md border border-gray-200">
              <div className="flex rounded-lg overflow-hidden shadow-sm">
                <div className="relative">
                  {pendientesDocAlumnos > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 shadow-md">
                      {pendientesDocAlumnos}
                    </span>
                  )}
                  <button
                    className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'alumnos'
                        ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } border-r border-gray-300`}
                    onClick={() => setActiveTab('alumnos')}
                  >
                    <div className="flex items-center gap-2">
                      <span>🎓</span>
                      Solicitudes de Alumnos
                    </div>
                  </button>
                </div>
                <div className="relative">
                  <button
                    className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'mias'
                        ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveTab('mias')}
                  >
                    <div className="flex items-center gap-2">
                      <span>👨‍🏫</span>
                      Mis Solicitudes como Docente
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex-1 relative mt-3 sm:mt-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder={activeTab === 'alumnos' ? 'Buscar por nombre, folio o grupo...' : 'Buscar por nombre o folio...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
            </div>
            
            {activeTab === 'alumnos' ? (
              <TablaSolicitudes
                titulo="Solicitudes de alumnos para aprobar"
                data={filteredDocAprobar}
                loading={loading}
                showSolicitante
                showEncargado={false}
                showGrupo
                columnasFijas={{ folio: true, materiales: true, fecha: true, estado: true, acciones: true }}
                usuario={usuario}
                onAccion={actualizarEstado}
                onPDF={descargarPDF}
                procesandoId={procesando}
              />
            ) : (
              <TablaSolicitudes
                titulo="Mis solicitudes como docente"
                data={filteredDocMias}
                loading={loading}
                showSolicitante={false}
                showEncargado={false}
                showGrupo={false}
                columnasFijas={{ folio: true, materiales: true, fecha: false, estado: true, acciones: true }}
                usuario={usuario}
                onAccion={actualizarEstado}
                onPDF={descargarPDF}
                procesandoId={procesando}
              />
            )}
          </>
        )}

        {usuario?.rol === 'almacen' && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 bg-white rounded-xl p-4 shadow-md border border-gray-200">
              <div className="flex rounded-lg overflow-hidden shadow-sm">
                <div className="relative">
                  {pendientesAlmAlumnos > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 shadow-md">
                      {pendientesAlmAlumnos}
                    </span>
                  )}
                  <button
                   className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'alumnos'
                        ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } border-r border-gray-300`}
                    onClick={() => setActiveTab('alumnos')}
                  >
                    <div className="flex items-center gap-2">
                      <span>🎓</span>
                      Solicitudes de Alumnos
                    </div>
                  </button>
                </div>
                <div className="relative">
                  {pendientesAlmDocentes > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 shadow-md">
                      {pendientesAlmDocentes}
                    </span>
                  )}
                  <button
                    className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'docentes'
                        ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveTab('docentes')}
                  >
                    <div className="flex items-center gap-2">
                      <span>👨‍🏫</span>
                      Solicitudes de Docentes
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative min-w-[200px] mt-3 sm:mt-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder={activeTab === 'alumnos' ? 'Buscar por nombre, folio o grupo...' : 'Buscar por nombre o folio...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 mt-3 sm:mt-0">
                <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>📅</span>
                  Filtrar por fecha:
                </label>
                <input
                  type="date"
                  value={filterDate}
                  min={minFilterDate}
                  max={maxFilterDate}
                  onChange={e => {
                    const v = e.target.value;
                    if (!v) { setFilterDate(''); return; }
                    const d = new Date(v);
                    const day = d.getDay();
                    if (day === 0 || day === 6) return;
                    if (v >= minFilterDate && v <= maxFilterDate) {
                      setFilterDate(v);
                    }
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-1"
                  >
                    <span>✖️</span>
                    Limpiar
                  </button>
                )}
              </div>
              
              {notice && (
                <div className="ml-auto mt-3 sm:mt-0">
                  <div className="px-4 py-2 text-xs sm:text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl shadow-sm flex items-center gap-2">
                    <span>🔔</span>
                    {notice}
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'alumnos' ? (
              <TablaSolicitudes
                titulo="Solicitudes de alumnos"
                data={searchedAlmAlumnos}
                loading={loading}
                showSolicitante
                showEncargado
                showGrupo
                columnasFijas={{ folio: true, materiales: true, fecha: true, estado: true, acciones: true }}
                usuario={usuario}
                onAccion={actualizarEstado}
                onEntregar={abrirEntrega}
                onPDF={descargarPDF}
                procesandoId={procesando}
              />
            ) : (
              <TablaSolicitudes
                titulo="Solicitudes de docentes"
                data={searchedAlmDocentes}
                loading={loading}
                showSolicitante
                showEncargado={false}
                showGrupo={false}
                columnasFijas={{ folio: true, materiales: true, fecha: true, estado: true, acciones: true }}
                usuario={usuario}
                onAccion={actualizarEstado}
                onEntregar={abrirEntrega}
                onPDF={descargarPDF}
                procesandoId={procesando}
              />
            )}
          </>
        )}

        {modalEntrega && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl sm:text-2xl">🚚</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Entregar materiales</h3>
              </div>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {modalEntrega.items.map(item => (
                  <label key={item.item_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.item_id)}
                      onChange={() => toggleItem(item.item_id)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {item.cantidad} {getUnidad(item.tipo)}
                        </span>
                        <span className="font-medium text-gray-800 text-xs sm:text-sm">{item.nombre_material}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="flex justify-between mb-6">
                <button
                  onClick={seleccionarTodos}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-1"
                >
                  <span>✅</span>
                  Seleccionar todo
                </button>
                <span className="text-xs sm:text-sm text-gray-500">
                  {selectedItems.length} de {modalEntrega.items.length} seleccionados
                </span>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalEntrega(null)}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEntrega}
                  disabled={selectedItems.length === 0}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors duration-200 font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>🚚</span>
                  Entregar ({selectedItems.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .min-h-screen {
          min-height: 100vh;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thumb-blue-500 {
          scrollbar-color: #3b82f6 #e5e7eb;
        }
        .scrollbar-track-gray-200 {
          scrollbar-color: #3b82f6 #e5e7eb;
        }
      `}</style>
    </div>
  );
}
