'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../lib/auth';

const logoUT = '/logoUtsjr.png';
const encabezadoUT = '/universidad.png';

/** Badge de estado */
const EstadoBadge = ({ estado }) => {
  const config = {
    'aprobación pendiente': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
    'aprobacion pendiente': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' }, // fallback sin tilde
    'entrega pendiente':    { bg: 'bg-blue-100',  text: 'text-blue-800',  icon: '📦' },
    'entregada':            { bg: 'bg-green-100', text: 'text-green-800', icon: '✓'  },
    'rechazada':            { bg: 'bg-red-100',   text: 'text-red-800',   icon: '✗'  },
    'cancelado':            { bg: 'bg-gray-100',  text: 'text-gray-800',  icon: '❌' },
    'cancelada':            { bg: 'bg-gray-100',  text: 'text-gray-800',  icon: '❌' },
    'eliminación automática por falta de recolección': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' },
    'eliminacion automatica por falta de recoleccion': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' }, // fallback sin tildes
    'pendiente':            { bg: 'bg-yellow-100',text: 'text-yellow-800',icon: '⏳' } // fallback
  };
  const safe = (estado || '').toLowerCase().trim();
  const { bg, text, icon } = config[safe] || config.pendiente;
  return (
    <span className={`${bg} ${text} inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium`}>
      <span>{icon}</span>
      <span className="capitalize">{estado}</span>
    </span>
  );
};

const SkeletonRow = ({ colCount }) => (
  <tr className="animate-pulse">
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
    ))}
  </tr>
);

const Th = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
    {children}
  </th>
);

const Td = ({ children, bold = false }) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
    <div className={`${bold ? 'font-semibold' : ''}`}>
      {children}
    </div>
  </td>
);

const Btn = ({ children, color, onClick, disabled }) => {
  const palette = {
    green:  'bg-green-600 hover:bg-green-700',
    red:    'bg-red-600 hover:bg-red-700',
    blue:   'bg-blue-600 hover:bg-blue-700',
    gray:   'bg-gray-600 hover:bg-gray-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  }[color] || 'bg-slate-600 hover:bg-slate-700';
  return (
    <button
      className={`${palette} text-white text-sm rounded-md px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed`}
      onClick={onClick}
      disabled={disabled}
    >
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-[#003579] text-white flex items-center justify-between">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <span className="text-sm">{data?.length || 0} registros</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-[#003579] text-white">
            <tr>
              {columnas.folio && <Th>Folio</Th>}
              {columnas.solicitante && <Th>Solicitante</Th>}
              {columnas.encargado && <Th>Encargado</Th>}
              {columnas.materiales && <Th>Materiales</Th>}
              {columnas.fecha && <Th>Fecha</Th>}
              {columnas.grupo && <Th>Grupo</Th>}
              {columnas.estado && <Th>Estado</Th>}
              {columnas.acciones && <Th>Acciones</Th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} colCount={colCount} />)
            ) : data.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={colCount}>
                  No hay solicitudes para mostrar.
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
                  <tr key={s.id} className={`hover:bg-gray-50 ${isOverdue ? 'border-2 border-red-500' : ''}`}>
                    {columnas.folio && <Td bold>{s.folio}</Td>}

                    {columnas.solicitante && (
                      <Td>{s.isDocenteRequest ? s.profesor : s.nombre_alumno}</Td>
                    )}

                    {columnas.encargado && <Td>{s.profesor || ''}</Td>}

                    {columnas.materiales && (
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(s.items || []).map((m) => (
                            <div key={m.item_id} className="text-sm flex items-center gap-2">
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                                {m.cantidad} {getUnidad(m.tipo)}
                              </span>
                              <span>{m.nombre_material}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    )}

                    {columnas.fecha && (
                      <Td>
                        {dateStr
                          ? new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-MX')
                          : ''}
                        {isOverdue && (
                          <div className="text-xs text-red-600">
                            Ha pasado la fecha.<br />
                            Se eliminará la solicitud dentro de 1 día por falta de recolección
                          </div>
                        )}
                        {showMsg && (
                          <div className="text-xs text-orange-600">
                            {recoDateStr === tomorrowStr
                              ? 'Entrega para mañana'
                              : 'Entrega para otro día'}
                          </div>
                        )}
                      </Td>
                    )}

                    {columnas.grupo && <Td>{s.grupo || ''}</Td>}

                    {columnas.estado && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EstadoBadge estado={isOverdue ? 'cancelada' : s.estado} />
                      </td>
                    )}

                    {columnas.acciones && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Docente: aprobar / rechazar */}
                          {usuario?.rol === 'docente' &&
                            !s.isDocenteRequest &&
                            (s.estado === 'aprobación pendiente') && (
                              <>
                                <Btn
                                  color="green"
                                  onClick={() => onAccion(s.id, 'aprobar', 'entrega pendiente')}
                                  disabled={procesandoId === s.id}
                                >
                                  Aprobar
                                </Btn>
                                <Btn
                                  color="red"
                                  onClick={() => onAccion(s.id, 'rechazar', 'rechazada')}
                                  disabled={procesandoId === s.id}
                                >
                                  Rechazar
                                </Btn>
                              </>
                            )}

                          {/* Almacén: Entregar cuando UI = entrega pendiente */}
                          {usuario?.rol === 'almacen' &&
                            s.estado === 'entrega pendiente' &&
                            (s.fecha_recoleccion || '').split('T')[0] === toLocalDateStr(new Date()) && (
                              <Btn
                                color="blue"
                           onClick={() =>
                                  onEntregar ? onEntregar(s) : onAccion(s.id, 'entregar', 'entregada')
                                }
                                disabled={procesandoId === s.id}
                              >
                                Entregar
                              </Btn>
                            )}

                          {/* Alumno: cancelar si está en aprobación pendiente */}
                          {usuario?.rol === 'alumno' &&
                            (s.estado === 'aprobación pendiente') && (
                              <Btn
                                color="gray"
                                onClick={() => onAccion(s.id, 'cancelar', 'cancelado')}
                                disabled={procesandoId === s.id}
                              >
                                Cancelar
                              </Btn>
                            )}

                          <Btn
                            color="purple"
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
  const [alumnoData, setAlumnoData] = useState([]); // alumno
  const [docAprobar, setDocAprobar] = useState([]); // docente: tabla 1
  const [docMias, setDocMias] = useState([]);       // docente: tabla 2
  const [almAlumnos, setAlmAlumnos] = useState([]); // almacén: tabla 1
  const [almDocentes, setAlmDocentes] = useState([]); // almacén: tabla 2
  const [procesando, setProcesando] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [minFilterDate, setMinFilterDate] = useState('');
  const [maxFilterDate, setMaxFilterDate] = useState('');
  const [notice, setNotice] = useState('');
   const [activeTab, setActiveTab] = useState('alumnos');
  const [search, setSearch] = useState('');
  const [modalEntrega, setModalEntrega] = useState(null); // {id, items}
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

        // Grupos
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
        
        // Alumno
        if (usuario.rol === 'alumno') {
          const { data } = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/materials/usuario/solicitudes`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alumnoArr = agrupar(data, 'alumno', grupos);
          setAlumnoData(alumnoArr);
        }

        // Docente
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

        // Almacén (sin filtrar en cliente; solo mapeo de estado especial)
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

  /** Agrupa por solicitud y mapea estados UI; para ALMACÉN lo no entregado/rechazado/cancelado = "entrega pendiente". */
  function agrupar(rows, rolVista, gruposMap) {
    const by = {};
    for (const item of rows) {
      const key = item.solicitud_id ?? item.id;
      if (!key) continue;

      const isDocenteReq = !item.nombre_alumno; // solicitudes de docente no traen nombre_alumno

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
        item?.material_nombre ??     // ← alias común en otros endpoints
        item?.materialNombre ??      // ← camelCase
        item?.material ??            // ← a veces solo "material"
        item?.nombre ??              // ← último recurso si el backend lo nombra así
        '';

      if (!nombreMaterialRaw) {
        // Debug temporal para ver qué trae esa fila del endpoint "para aprobar"
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

  /** Mapeo de estados con sensibilidad al rol que visualiza */
  function mapEstadoPorRol(estadoSQL, isDocenteReq, rolVista) {
    const e = (estadoSQL || '').toLowerCase().trim();

    // Vista de ALMACÉN: regla estricta para evitar "aprobación pendiente" allí
    if (rolVista === 'almacen') {
      if (e === 'entregado') return 'entregada';
      if (e === 'rechazada') return 'rechazada';
      if (e === 'cancelado') return 'cancelado';
      if (e === 'sin recoleccion') return 'eliminación automática por falta de recolección';
      // Cualquier otro (incluido 'aprobada' y un posible 'pendiente') se ve como entrega pendiente
      return 'entrega pendiente';
    }

    // Otras vistas (alumno/docente)
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

  /** Acciones aprobar/rechazar/entregar/cancelar */
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

      // Helpers para in-place update
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

  // Mapea estado UI -> estado SQL crudo
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
  
  /** PDF */
/** PDF idéntico al formato original */
const descargarPDF = async (vale) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const toBase64 = async (url) => {
    const blob = await fetch(url).then(r => r.blob());
    return new Promise(res => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const logoImg = await toBase64(logoUT);
  const encabezadoImg = await toBase64(encabezadoUT);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // === ENCABEZADO ===
  // Logo izquierdo
  doc.addImage(logoImg, 'PNG', 15, 10, 25, 25);

  // Texto del encabezado central
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Universidad Tecnológica de San Juan del Río', pageWidth / 2, 20, { align: 'center' });
  doc.text('Vale Almacén R', pageWidth / 2, 28, { align: 'center' });

  // Logo derecho (si tienes el logo del coyote)
  // doc.addImage(coyoteLogo, 'PNG', pageWidth - 40, 10, 25, 25);

  // === SECCIÓN SUPERIOR CON LÍNEAS ===
  const startY = 45;
  
  // Línea superior con NINGUNO, BAJO, MEDIO, ALTO
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // NINGUNO
  doc.text('NINGUNO', 20, startY);
  doc.line(50, startY, 90, startY); // línea después de NINGUNO
  
  // BAJO
  doc.text('BAJO', 100, startY);
  doc.line(120, startY, 160, startY); // línea después de BAJO
  
  // MEDIO
  doc.text('MEDIO', 170, startY);
  doc.line(190, startY, 230, startY); // línea después de MEDIO
  
  // ALTO
  doc.text('ALTO', 240, startY);
  doc.line(260, startY, pageWidth - 20, startY); // línea después de ALTO

  // === TÍTULO VALE ===
  const valeY = startY + 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('<<< V A L E >>>', pageWidth / 2, valeY, { align: 'center' });

  // === INFORMACIÓN DEL ESTUDIANTE/DOCENTE ===
  const infoY = valeY + 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const nombre = vale.isDocenteRequest ? vale.profesor : vale.nombre_alumno;
  const grupo = vale.isDocenteRequest ? 'No aplica' : (vale.grupo || '');
  const fechaReco = vale.fecha_recoleccion
    ? new Date(vale.fecha_recoleccion).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '';

  // NOMBRE
  doc.setFont('helvetica', 'bold');
  doc.text('NOMBRE:', 20, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(nombre, 60, infoY);

  // GRUPO
  doc.setFont('helvetica', 'bold');
  doc.text('GRUPO:', pageWidth / 2, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(grupo, pageWidth / 2 + 35, infoY);

  // FECHA
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', pageWidth - 80, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(fechaReco, pageWidth - 50, infoY);

  // Líneas debajo de cada campo
  doc.line(60, infoY + 2, pageWidth / 2 - 20, infoY + 2); // línea NOMBRE
  doc.line(pageWidth / 2 + 35, infoY + 2, pageWidth - 90, infoY + 2); // línea GRUPO
  doc.line(pageWidth - 50, infoY + 2, pageWidth - 20, infoY + 2); // línea FECHA

  // === TABLA DE MATERIALES ===
  const tableStartY = infoY + 20;
  
  // Encabezados de la tabla
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  
  // Columnas izquierdas
  doc.text('CANTIDAD', 25, tableStartY);
  doc.text('DESCRIPCIÓN', 90, tableStartY);
  
  // Columnas derechas
  doc.text('CANTIDAD', pageWidth / 2 + 25, tableStartY);
  doc.text('DESCRIPCIÓN', pageWidth / 2 + 90, tableStartY);

  // Líneas de encabezado
  doc.line(20, tableStartY + 2, pageWidth / 2 - 10, tableStartY + 2); // línea izquierda
  doc.line(pageWidth / 2 + 20, tableStartY + 2, pageWidth - 20, tableStartY + 2); // línea derecha

  // === FILAS DE LA TABLA ===
  const items = vale.items || [];
  const rowHeight = 12;
  const maxRows = 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Dibujar las filas
  for (let i = 0; i < maxRows; i++) {
    const currentY = tableStartY + 10 + (i * rowHeight);
    
    // Elemento izquierdo
    const leftItem = items[i];
    if (leftItem) {
      doc.text(`${leftItem.cantidad} ${getUnidad(leftItem.tipo)}`, 25, currentY);
      doc.text(leftItem.nombre_material, 90, currentY);
    }
    
    // Elemento derecho
    const rightItem = items[i + maxRows];
    if (rightItem) {
      doc.text(`${rightItem.cantidad} ${getUnidad(rightItem.tipo)}`, pageWidth / 2 + 25, currentY);
      doc.text(rightItem.nombre_material, pageWidth / 2 + 90, currentY);
    }
    
    // Líneas de separación de filas
    doc.line(20, currentY + 3, pageWidth / 2 - 10, currentY + 3); // línea izquierda
    doc.line(pageWidth / 2 + 20, currentY + 3, pageWidth - 20, currentY + 3); // línea derecha
  }

  // === LÍNEAS VERTICALES DE LA TABLA ===
  const tableEndY = tableStartY + 10 + (maxRows * rowHeight);
  
  // Líneas verticales izquierdas
  doc.line(20, tableStartY, 20, tableEndY); // borde izquierdo
  doc.line(80, tableStartY, 80, tableEndY); // separador cantidad/descripción
  doc.line(pageWidth / 2 - 10, tableStartY, pageWidth / 2 - 10, tableEndY); // borde medio-izquierdo
  
  // Líneas verticales derechas
  doc.line(pageWidth / 2 + 20, tableStartY, pageWidth / 2 + 20, tableEndY); // borde medio-derecho
  doc.line(pageWidth / 2 + 80, tableStartY, pageWidth / 2 + 80, tableEndY); // separador cantidad/descripción
  doc.line(pageWidth - 20, tableStartY, pageWidth - 20, tableEndY); // borde derecho

  // === SECCIÓN INFERIOR ===
  const bottomY = tableEndY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  // FIRMA
  doc.text('FIRMA:', 20, bottomY);
  doc.line(50, bottomY, 120, bottomY);

  // N. EXPEDIENTE
  doc.text('N. EXPEDIENTE:', 140, bottomY);
  const expediente = vale.folio || ''; // o usar algún número de expediente si lo tienes
  doc.setFont('helvetica', 'normal');
  doc.text(expediente, 200, bottomY);
  doc.line(200, bottomY + 2, 250, bottomY + 2);

  // MATERIA
  doc.setFont('helvetica', 'bold');
  doc.text('MATERIA:', pageWidth - 100, bottomY);
  const materia = 'Química'; // o extraer de los datos si está disponible
  doc.setFont('helvetica', 'normal');
  doc.text(materia, pageWidth - 65, bottomY);
  doc.line(pageWidth - 65, bottomY + 2, pageWidth - 20, bottomY + 2);

  // HORARIO Y PROFESOR
  const bottomY2 = bottomY + 15;
  doc.setFont('helvetica', 'bold');
  doc.text('HORARIO:', 20, bottomY2);
  const horario = '7:00 AM - 12:00 PM'; // puedes extraer esto de los datos
  doc.setFont('helvetica', 'normal');
  doc.text(horario, 55, bottomY2);
  doc.line(55, bottomY2 + 2, 180, bottomY2 + 2);

  doc.setFont('helvetica', 'bold');
  doc.text('PROFESOR:', 200, bottomY2);
  const profesor = vale.profesor || '';
  doc.setFont('helvetica', 'normal');
  doc.text(profesor, 240, bottomY2);
  doc.line(240, bottomY2 + 2, pageWidth - 20, bottomY2 + 2);

  // === NOTA IMPORTANTE ===
  const notaY = bottomY2 + 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTA: LA FIRMA DEL PROFESOR AMPARA CUALQUIER EVENTO DURANTE EL TIEMPO QUE DURE LA PRÁCTICA, FAVOR DE RESPETAR LOS HORARIOS.', pageWidth / 2, notaY, { align: 'center' });

  // === FIRMA DEL PROFESOR (al final) ===
  const firmaFinalY = notaY + 20;
  doc.line(pageWidth / 2 - 50, firmaFinalY, pageWidth / 2 + 50, firmaFinalY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FIRMA DEL PROFESOR', pageWidth / 2, firmaFinalY + 8, { align: 'center' });

  // === GUARDAR PDF ===
  const nombrePDF = vale.isDocenteRequest
    ? `Vale_${vale.folio}_${(vale.profesor || '').replace(/\s+/g, '')}.pdf`
    : `Vale_${vale.folio}_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(nombrePDF);
};

  // --- RENDER POR ROL ---
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen font-sans">
     <div className="mb-8">
       <Image
  src="/Solicitudes.png"
  alt="Solicitudes de préstamo"
  width={1200}
  height={150}
  className="w-full h-[150px] object-contain rounded bg-white"
  priority
/>
         </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
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
          <div className="px-3 py-1 text-xs bg-yellow-100 border border-yellow-200 text-yellow-800 rounded">
            {notice}
          </div>
        </div>
      )}
  
      {/* ALUMNO */}
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

      {/* DOCENTE */}
      {usuario?.rol === 'docente' && (
        <>
         <div className="mb-4 flex items-center gap-2">
            <div className="relative flex">
              <div className="relative">
                {pendientesDocAlumnos > 0 && (
                  <span className="absolute -top-2 right-0 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                    {pendientesDocAlumnos}
                  </span>
                )}
                <button
               className={`px-4 py-2 rounded-l border ${activeTab === 'alumnos' ? 'bg-[#003579] text-white' : 'bg-white'}`}
                  onClick={() => setActiveTab('alumnos')}
                >
                  Solicitudes de Alumnos
                </button>
              </div>
              <div className="relative -ml-px">
                <button
                  className={`px-4 py-2 rounded-r border ${activeTab === 'mias' ? 'bg-[#003579] text-white' : 'bg-white'}`}
                  onClick={() => setActiveTab('mias')}
                >
                  Mis Solicitudes como Docente
                </button>
              </div>
            </div>
            <input
              type="text"
           placeholder={activeTab === 'alumnos' ? 'Buscar por nombre, folio o grupo' : 'Buscar por nombre o folio'}
              value={search}
              onChange={e => setSearch(e.target.value)}
               className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
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

      {/* ALMACÉN */}
      {usuario?.rol === 'almacen' && (
        <>
    <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex">
              <div className="relative">
                {pendientesAlmAlumnos > 0 && (
                  <span className="absolute -top-2 right-0 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                    {pendientesAlmAlumnos}
                  </span>
                )}
                <button
                 className={`px-4 py-2 rounded-l border ${activeTab === 'alumnos' ? 'bg-[#003579] text-white' : 'bg-white'}`}
                  onClick={() => setActiveTab('alumnos')}
                >
                  Solicitudes de Alumnos
                </button>
              </div>
              <div className="relative -ml-px">
                {pendientesAlmDocentes > 0 && (
                  <span className="absolute -top-2 right-0 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                    {pendientesAlmDocentes}
                  </span>
                )}
                <button
               className={`px-4 py-2 rounded-r border ${activeTab === 'docentes' ? 'bg-[#003579] text-white' : 'bg-white'}`}
                  onClick={() => setActiveTab('docentes')}
                >
                  Solicitudes de Docentes
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder={activeTab === 'alumnos' ? 'Buscar por nombre, folio o grupo' : 'Buscar por nombre o folio'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filtrar por fecha:</label>
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
                  if (day === 0 || day === 6) return; // evitar fines de semana
                  if (v >= minFilterDate && v <= maxFilterDate) {
                    setFilterDate(v);
                  }
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            {notice && (
              <div className="ml-auto">
                <div className="px-4 py-2 text-sm bg-yellow-100 border border-yellow-200 text-yellow-800 rounded">
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
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Entregar materiales</h3>
            <div className="space-y-2 mb-4">
              {modalEntrega.items.map(item => (
                <label key={item.item_id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.item_id)}
                    onChange={() => toggleItem(item.item_id)}
                  />
                  <span>{item.cantidad} {getUnidad(item.tipo)} {item.nombre_material}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between mb-4">
              <button onClick={seleccionarTodos} className="text-sm text-blue-600">
                Seleccionar todo
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalEntrega(null)} className="px-3 py-1 text-sm">
                Cancelar
              </button>
              <button onClick={confirmarEntrega} className="px-3 py-1 bg-blue-600 text-white rounded">
                Entregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
