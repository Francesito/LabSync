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
    'aprobación pendiente': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '⏳' },
    'aprobacion pendiente': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '⏳' },
    'entrega pendiente':    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: '📦' },
    'entregada':            { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: '✓'  },
    'rechazada':            { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: '✗'  },
    'cancelado':            { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   icon: '❌' },
    'cancelada':            { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   icon: '❌' },
    'eliminación automática por falta de recolección': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '⚠️' },
    'eliminacion automatica por falta de recoleccion': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '⚠️' },
    'pendiente': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' }
  };
  const safe = (estado || '').toLowerCase().trim();
  const { bg, text, border, icon } = config[safe] || config.pendiente;
  return (
    <span className={`${bg} ${text} ${border} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border`}>
      <span className="text-sm">{icon}</span>
      <span className="capitalize">{estado}</span>
    </span>
  );
};

const SkeletonRow = ({ colCount }) => (
  <tr className="animate-pulse">
     {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded w-20" />
      </td>
    ))}
  </tr>
);

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide bg-gray-50">
    {children}
  </th>
);

const Td = ({ children, bold = false }) => (
  <td className="px-4 py-3 border-b border-gray-100">
    <div className={`text-sm ${bold ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
      {children}
    </div>
  </td>
);

const Btn = ({ children, color, onClick, disabled }) => {
  const palette = {
    green:  'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    red:    'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    blue:   'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    gray:   'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
  }[color] || 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500';
  
  return (
    <button
      className={`${palette} text-white text-xs font-medium rounded px-3 py-1.5 
                  transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-opacity-60`}
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{titulo}</h2>
          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border">
            {data?.length || 0} registros
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
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
          <tbody className="bg-white">
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
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors duration-150 ${isOverdue ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                  {columnas.folio && <Td bold>{s.folio}</Td>}

                  {columnas.solicitante && (
                   <Td>{s.isDocenteRequest ? s.profesor : s.nombre_alumno}</Td>
                  )}

                  {columnas.encargado && <Td>{s.profesor || ''}</Td>}

                  {columnas.materiales && (
                    <td className="px-4 py-3 border-b border-gray-100">
                      <div className="space-y-1.5">
                        {(s.items || []).map((m) => (
                          <div key={m.item_id} className="text-sm flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">
                              {m.cantidad} {getUnidad(m.tipo)}
                            </span>
                            <span className="text-gray-700">{m.nombre_material}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  )}

                  {columnas.fecha && (
                   <td className="px-4 py-3 border-b border-gray-100">
                     <div className="text-sm text-gray-700">
                       {dateStr
                         ? new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-MX')
                         : ''}
                     </div>
                     {isOverdue && (
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          Ha pasado la fecha.<br />
                          Se eliminará la solicitud dentro de 1 día por falta de recolección
                        </div>
                      )}
                      {showMsg && (
                        <div className="text-xs text-orange-600 mt-1">
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
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-medium text-gray-900">Solicitudes de Préstamo</h1>
                <p className="text-gray-600 text-sm">Gestiona y supervisa las solicitudes según tu rol</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-4">
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Limpiar filtro
                  </button>
                )}
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
