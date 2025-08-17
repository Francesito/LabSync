{/* Notice para almacén */}
        {usuario?.rol === 'almacen' && notice && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-100 border-l-4 border-blue-500 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-blue-800 font-semibold text-lg">{notice}</p>
            </div>
          </div>
        )}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../lib/auth';

const logoUT = '/logoUtsjr.png';
const encabezadoUT = '/universidad.png';

/** Badge de estado */
const EstadoBadge = ({ estado }) => {
  const config = {
    'aprobación pendiente': { bg: 'bg-gradient-to-r from-orange-50 to-orange-100', text: 'text-orange-800', border: 'border-orange-300', shadow: 'shadow-orange-100', icon: '⏳' },
    'aprobacion pendiente': { bg: 'bg-gradient-to-r from-orange-50 to-orange-100', text: 'text-orange-800', border: 'border-orange-300', shadow: 'shadow-orange-100', icon: '⏳' },
    'entrega pendiente':    { bg: 'bg-gradient-to-r from-blue-50 to-blue-100',     text: 'text-blue-800',   border: 'border-blue-300',   shadow: 'shadow-blue-100',   icon: '📦' },
    'entregada':            { bg: 'bg-gradient-to-r from-green-50 to-green-100',   text: 'text-green-800',  border: 'border-green-300',  shadow: 'shadow-green-100',  icon: '✅' },
    'rechazada':            { bg: 'bg-gradient-to-r from-red-50 to-red-100',       text: 'text-red-800',    border: 'border-red-300',    shadow: 'shadow-red-100',    icon: '❌' },
    'cancelado':            { bg: 'bg-gradient-to-r from-gray-50 to-gray-100',     text: 'text-gray-700',   border: 'border-gray-300',   shadow: 'shadow-gray-100',   icon: '⭕' },
    'cancelada':            { bg: 'bg-gradient-to-r from-gray-50 to-gray-100',     text: 'text-gray-700',   border: 'border-gray-300',   shadow: 'shadow-gray-100',   icon: '⭕' },
    'eliminación automática por falta de recolección': { bg: 'bg-gradient-to-r from-red-50 to-red-100', text: 'text-red-800', border: 'border-red-300', shadow: 'shadow-red-100', icon: '⚠️' },
    'eliminacion automatica por falta de recoleccion': { bg: 'bg-gradient-to-r from-red-50 to-red-100', text: 'text-red-800', border: 'border-red-300', shadow: 'shadow-red-100', icon: '⚠️' },
    'pendiente': { bg: 'bg-gradient-to-r from-yellow-50 to-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', shadow: 'shadow-yellow-100', icon: '⏳' }
  };
  const safe = (estado || '').toLowerCase().trim();
  const { bg, text, border, shadow, icon } = config[safe] || config.pendiente;
  return (
    <span className={`${bg} ${text} ${border} ${shadow} inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border shadow-sm transition-all duration-200 hover:shadow-md`}>
      <span className="text-base">{icon}</span>
      <span className="capitalize tracking-wide">{estado}</span>
    </span>
  );
};

const SkeletonRow = ({ colCount }) => (
  <tr className="animate-pulse">
     {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-28 shadow-sm" />
      </td>
    ))}
  </tr>
);

const Th = ({ children }) => (
  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-blue-200">
    {children}
  </th>
);

const Td = ({ children, bold = false }) => (
  <td className="px-6 py-4 border-b border-gray-200">
    <div className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
      {children}
    </div>
  </td>
);

const Btn = ({ children, color, onClick, disabled }) => {
  const palette = {
    green:  'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-green-200',
    red:    'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-red-200',
    blue:   'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-blue-200',
    gray:   'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 focus:ring-gray-400 shadow-gray-200',
    purple: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:ring-purple-500 shadow-purple-200'
  }[color] || 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 shadow-slate-200';
  
  return (
    <button
      className={`${palette} text-white text-sm font-medium rounded-lg px-4 py-2 
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                  shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-md`}
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
    <div className="bg-white rounded-xl border border-gray-300 overflow-hidden mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            {titulo}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm font-medium">
              {data?.length || 0} registros
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
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
                <td className="px-6 py-12 text-center text-gray-500" colSpan={colCount}>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No hay solicitudes para mostrar</span>
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
                <tr key={s.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${isOverdue ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 shadow-md' : ''}`}>
                  {columnas.folio && <Td bold>{s.folio}</Td>}

                  {columnas.solicitante && (
                   <Td>{s.isDocenteRequest ? s.profesor : s.nombre_alumno}</Td>
                  )}

                  {columnas.encargado && <Td>{s.profesor || ''}</Td>}

                  {columnas.materiales && (
                    <td className="px-6 py-4 border-b border-gray-200">
                      <div className="space-y-2">
                        {(s.items || []).map((m) => (
                          <div key={m.item_id} className="text-sm flex items-center gap-3">
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                              {m.cantidad} {getUnidad(m.tipo)}
                            </span>
                            <span className="text-gray-800 font-medium">{m.nombre_material}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  )}

                  {columnas.fecha && (
                   <td className="px-6 py-4 border-b border-gray-200">
                     <div className="text-sm text-gray-800 font-medium">
                       {dateStr
                         ? new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-MX')
                         : ''}
                     </div>
                     {isOverdue && (
                        <div className="text-xs text-red-700 mt-2 font-semibold bg-red-100 px-2 py-1 rounded-md border border-red-200">
                          Ha pasado la fecha.<br />
                          Se eliminará la solicitud dentro de 1 día por falta de recolección
                        </div>
                      )}
                      {showMsg && (
                        <div className="text-xs text-orange-700 mt-2 bg-orange-100 px-2 py-1 rounded-md border border-orange-200 font-medium">
                          {recoDateStr === tomorrowStr
                            ? 'Entrega para mañana'
                            : 'Entrega para otro día'}
                        </div>
                      )}
                    </td>
                  )}

                  {columnas.grupo && <Td>{s.grupo || ''}</Td>}

                  {columnas.estado && (
                    <td className="px-4 py-3 border-b border-gray-100">
                     <EstadoBadge estado={isOverdue ? 'cancelada' : s.estado} />
                    </td>
                  )}

                  {columnas.acciones && (
                    <td className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-1.5">
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
                          (s.fecha_recoleccion || '').split('T')[0] === todayStr && (
                            <Btn
                              color="blue"
                              onClick={() => onAccion(s.id, 'entregar', 'entregada')}
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
  const actualizarEstado = async (id, accion, nuevoEstadoUI) => {
    if (procesando) return;
    setProcesando(id);
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/materials/solicitud/${id}/${accion}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Helpers para in-place update
      const apply = (arrSetter) => arrSetter(prev => prev.map(s => {
        if (s.id !== id) return s;
        const ui = nuevoEstadoUI;
        const raw = uiToRaw(ui);
        return { ...s, estado: ui, rawEstado: raw };
      }));

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
  
  /** PDF */
  const descargarPDF = async (vale) => {
    const doc = new jsPDF();
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
    const margin = 15;
    const marginLeft = margin;
    const primary = [0, 102, 51];
    const secondary = [100, 100, 100];

    // Fondo + marco
    doc.setFillColor(245, 245, 245);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'F');
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Encabezado
    doc.addImage(logoImg, 'PNG', marginLeft, 12, 30, 30);
    doc.addImage(encabezadoImg, 'PNG', marginLeft + 35, 12, pageWidth - 75, 25);
    doc.setFontSize(18);
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.text('VALE DE ALMACÉN', pageWidth / 2, 50, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 55, pageWidth - marginLeft, 55);

    // Datos
    let yPos = 65;
    const put = (label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`${label}`, marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${value || ''}`, marginLeft + 45, yPos);
      yPos += 9;
    };

    const fechaBonita = new Date(vale.fecha_solicitud).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    put('Folio:', vale.folio);
    put('Fecha:', fechaBonita);
    if (vale.isDocenteRequest) {
      put('Solicitante:', `${vale.profesor} (Docente)`);
    } else {
      put('Solicitante:', vale.nombre_alumno);
      put('Encargado:', vale.profesor);
      put('Grupo:', vale.grupo || '');
    }

    // Tabla de materiales
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPos + 4, pageWidth - marginLeft, yPos + 4);

    const rows = (vale.items || []).map(m => [
      `${m.cantidad} ${getUnidad(m.tipo)}`,
      m.nombre_material
    ]);

    autoTable(doc, {
      startY: yPos + 10,
      theme: 'grid',
      head: [['Cantidad', 'Descripción']],
      body: rows,
      headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, cellPadding: 4, textColor: [0, 0, 0] },
      margin: { left: margin, right: margin }
    });

    // Pie
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento es válido para el retiro de materiales del almacén.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 10, { align: 'right' });

    const nombrePDF = vale.isDocenteRequest
      ? `Vale_${vale.folio}_${(vale.profesor || '').replace(/\s+/g, '')}.pdf`
      : `Vale_${vale.folio}_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(nombrePDF);
  };

  // --- RENDER POR ROL ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full shadow-md"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Solicitudes de Préstamo</h1>
                <p className="text-gray-600 text-lg mt-1">Gestiona y supervisa las solicitudes según tu rol</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 transition-colors duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Notice para almacén */}
        {usuario?.rol === 'almacen' && notice && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-blue-700 text-sm font-medium">{notice}</p>
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
            <TablaSolicitudes
              titulo="Solicitudes de alumnos para aprobar"
              data={docAprobar}
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
            <TablaSolicitudes
              titulo="Mis solicitudes como docente"
              data={docMias}
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
          </>
        )}

        {/* ALMACÉN */}
        {usuario?.rol === 'almacen' && (
          <>
            <div className="mb-8 bg-white rounded-xl border border-gray-300 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <label className="text-lg font-semibold text-gray-800">Filtrar por fecha:</label>
                </div>
                <div className="flex items-center gap-4">
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
                    className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate('')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 transition-all duration-200"
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>
              </div>
            </div>

            <TablaSolicitudes
              titulo="Solicitudes de alumnos"
              data={filteredAlmAlumnos}
              loading={loading}
              showSolicitante
              showEncargado
              showGrupo
              columnasFijas={{ folio: true, materiales: true, fecha: true, estado: true, acciones: true }}
              usuario={usuario}
              onAccion={actualizarEstado}
              onPDF={descargarPDF}
              procesandoId={procesando}
            />

            <TablaSolicitudes
              titulo="Solicitudes de docentes"
              data={filteredAlmDocentes}
              loading={loading}
              showSolicitante
              showEncargado={false}
              showGrupo={false}
              columnasFijas={{ folio: true, materiales: true, fecha: true, estado: true, acciones: true }}
              usuario={usuario}
              onAccion={actualizarEstado}
              onPDF={descargarPDF}
              procesandoId={procesando}
            />
          </>
        )}
      </div>
    </div>
  );
}
