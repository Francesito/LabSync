
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
    'entrega pendiente': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📦' },
    'entregada': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
    'rechazada': { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
    'cancelado': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❌' },
    'cancelada': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❌' },
    'eliminación automática por falta de recolección': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' },
    'eliminacion automatica por falta de recoleccion': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' },
    'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' }
  };
  const safe = (estado || '').toLowerCase().trim();
  const { bg, text, icon } = config[safe] || config.pendiente;
  return (
    <span className={`${bg} ${text} inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm transition-all duration-150 hover:scale-105 border border-transparent`}>
      <span className="text-sm">{icon}</span>
      <span className="capitalize">{estado}</span>
    </span>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 h-[300px] animate-pulse flex flex-col overflow-hidden">
    <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-28 mb-3" />
    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-36 mb-4" />
    <div className="space-y-2 flex-1 mb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full" />
      ))}
    </div>
    <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" />
  </div>
);

const Btn = ({ children, color, onClick, disabled, icon, className = '' }) => {
  const palette = {
    green: 'bg-green-500 hover:bg-green-600 focus:ring-green-400',
    red: 'bg-red-500 hover:bg-red-600 focus:ring-red-400',
    blue: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400',
    gray: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400',
    purple: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400'
  }[color] || 'bg-slate-500 hover:bg-slate-600 focus:ring-slate-400';
  
  return (
    <button
      type="button"
      className={`${palette} text-white text-xs rounded-md px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed 
        transition-all duration-150 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1
        shadow-sm hover:shadow-md flex items-center justify-center gap-1 min-w-[80px] ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="text-sm">{icon}</span>}
      <span className="font-medium">{children}</span>
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

function formatFechaStr(fecha) {
  if (!fecha) return '';
  try {
    const datePart = String(fecha).split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '';
  }
}

/** Lista de fichas genérica configurable */
function FichasSolicitudes({
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
  procesandoId,
  onDetail
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
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);
  const [mostrarRecientes, setMostrarRecientes] = useState(true);
  const sortedData = [...data].sort((a, b) =>
    mostrarRecientes
      ? new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud)
      : new Date(a.fecha_solicitud) - new Date(b.fecha_solicitud)
  );

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6 transition-all duration-200 hover:shadow-lg">
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#003579] to-[#0056b3] text-white flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl animate-spin-slow">📋</span>
          {titulo}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarRecientes(!mostrarRecientes)}
            className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all duration-150 font-medium"
          >
            {mostrarRecientes ? 'Recientes' : 'Antiguas'}
          </button>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm font-medium">
            {sortedData?.length || 0} solicitudes
          </span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : sortedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <span className="text-4xl opacity-50 mb-3">📭</span>
            <span className="text-base font-medium">No hay solicitudes para mostrar.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedData.map((s) => {
              const createDateStr = (s.fecha_solicitud || '').split('T')[0];
              const recoDateStr = (s.fecha_recoleccion || '').split('T')[0];
              const dateStr = usuario?.rol === 'almacen' ? recoDateStr : createDateStr;
              const isOverdue =
                recoDateStr && recoDateStr < todayStr && s.estado === 'entrega pendiente';
              const showMsg =
                usuario?.rol !== 'almacen' &&
                recoDateStr &&
                recoDateStr > todayStr &&
                recoDateStr !== todayStr;
              const isToday = recoDateStr === todayStr;
              const isFuture = recoDateStr > todayStr;
              const canDeliver =
                usuario?.rol === 'almacen' &&
                s.estado === 'entrega pendiente' &&
                (isToday || isFuture);
              const visibleItems = s.items.slice(0, 2);
              const hasMoreItems = s.items.length > 2;
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 h-[300px] flex flex-col cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-200 group ${
                    isOverdue ? 'border-red-400 bg-red-50/50' : ''
                  }`}
                  onClick={() => onDetail && onDetail(s)}
                >
                  {/* Header: Folio y Estado */}
                  <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-100">
                    <div className="font-semibold text-base text-gray-900 truncate pr-2">{s.folio}</div>
                    <EstadoBadge estado={isOverdue ? 'cancelada' : s.estado} />
                  </div>

                  {/* Información básica */}
                  <div className="space-y-2 mb-4 flex-1 min-h-0">
                    {columnas.solicitante && (
                      <div className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-gray-400 text-base">👤</span>
                        <span className="truncate font-medium text-gray-900">{s.isDocenteRequest ? s.profesor : s.nombre_alumno}</span>
                      </div>
                    )}
                    {columnas.encargado && (
                      <div className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-gray-400 text-base">👨‍🏫</span>
                        <span className="truncate text-gray-900">{s.profesor || 'N/A'}</span>
                      </div>
                    )}
                    {columnas.grupo && (
                      <div className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-gray-400 text-base">👥</span>
                        <span className="truncate text-gray-900">{s.grupo || 'N/A'}</span>
                      </div>
                    )}
                    {columnas.fecha && (
                      <div className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-gray-400 text-base">📅</span>
                        <span className="font-medium text-gray-900">{dateStr ? formatFechaStr(dateStr) : 'N/A'}</span>
                      </div>
                    )}
                    {showMsg && recoDateStr === tomorrowStr && (
                      <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <span className="text-sm">🕒</span> <span>Entrega mañana</span>
                      </div>
                    )}
                  </div>

                  {/* Materiales */}
                  <div className="mb-4 flex-1 min-h-0">
                    <div className="text-xs font-medium text-gray-600 uppercase mb-2 flex items-center gap-1">
                      <span className="text-base">📦</span> Materiales
                    </div>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin pr-1">
                      {visibleItems.map((m, idx) => (
                        <div key={m.item_id} className="text-xs flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                            {m.cantidad} {getUnidad(m.tipo)}
                          </span>
                          <span className="truncate font-medium text-gray-900">{m.nombre_material}</span>
                        </div>
                      ))}
                      {hasMoreItems && (
                        <div className="text-xs text-gray-500 italic text-center py-1 bg-blue-50 rounded-md">
                          +{s.items.length - 2} más...
                        </div>
                      )}
                      {!hasMoreItems && visibleItems.length === 0 && (
                        <div className="text-xs text-gray-400 italic text-center py-1">
                          Sin materiales
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  {columnas.acciones && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <div className="flex flex-1 gap-1.5 min-w-0">
                        {usuario?.rol === 'docente' &&
                          !s.isDocenteRequest &&
                          (s.estado === 'aprobación pendiente') && (
                            <>
                              <Btn
                                color="green"
                                icon="✅"
                                onClick={(e) => { e.stopPropagation(); onAccion(s.id, 'aprobar', 'entrega pendiente'); }}
                                disabled={procesandoId === s.id}
                                className="flex-1"
                              >
                                Aprobar
                              </Btn>
                              <Btn
                                color="red"
                                icon="❌"
                                onClick={(e) => { e.stopPropagation(); onAccion(s.id, 'rechazar', 'rechazada'); }}
                                disabled={procesandoId === s.id}
                                className="flex-1"
                              >
                                Rechazar
                              </Btn>
                            </>
                          )}
                      </div>
                      {canDeliver && (
                        <div className="flex-1 min-w-[100px]">
                          <div className="flex rounded-md overflow-hidden shadow-sm">
                            <div
                              className={`${
                                isToday ? 'bg-green-400' : 'bg-orange-400'
                              } text-white px-2 py-1 flex items-center text-xs font-medium`}
                            >
                              <span className="text-sm">🕒</span>
                            </div>
                            <Btn
                              color="blue"
                              icon="🚚"
                              onClick={(e) => { e.stopPropagation(); onEntregar ? onEntregar(s) : onAccion(s.id, 'entregar', 'entregada'); }}
                              disabled={procesandoId === s.id}
                              className="rounded-none rounded-r-md flex-1 px-2"
                            >
                              Entregar
                            </Btn>
                          </div>
                        </div>
                      )}
                      {usuario?.rol === 'almacen' &&
                        !['entregada', 'cancelado', 'rechazada'].includes((s.estado || '').toLowerCase()) && (
                          <Btn
                            color="gray"
                            icon="🗑️"
                            onClick={(e) => { e.stopPropagation(); onAccion(s.id, 'cancelar', 'cancelado'); }}
                            disabled={procesandoId === s.id}
                            className="flex-1 min-w-[80px]"
                          >
                            Cancelar
                          </Btn>
                        )}
                      {usuario?.rol === 'alumno' &&
                        (s.estado === 'aprobación pendiente') && (
                          <Btn
                            color="gray"
                            icon="🚫"
                            onClick={(e) => { e.stopPropagation(); onAccion(s.id, 'cancelar', 'cancelado'); }}
                            disabled={procesandoId === s.id}
                            className="flex-1 min-w-[80px]"
                          >
                            Cancelar
                          </Btn>
                        )}
                      <Btn
                        color="purple"
                        icon="📄"
                        onClick={(e) => { e.stopPropagation(); onPDF(s); }}
                        disabled={procesandoId === s.id}
                        className="min-w-[60px]"
                      >
                        PDF
                      </Btn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Modal de detalle de solicitud */
const ModalDetalle = ({ solicitud, onClose, usuario, onAccion, onEntregar, onPDF, procesandoId }) => {
  if (!solicitud) return null;
  const recoDateStr = (solicitud.fecha_recoleccion || '').split('T')[0];
  const todayStr = toLocalDateStr(new Date());
  const isOverdue = recoDateStr && recoDateStr < todayStr && solicitud.estado === 'entrega pendiente';
  const isToday = recoDateStr === todayStr;
  const isFuture = recoDateStr > todayStr;
  const canDeliver = usuario?.rol === 'almacen' && solicitud.estado === 'entrega pendiente' && (isToday || isFuture);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn overflow-y-auto p-3">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin border border-gray-200 mx-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-spin-slow">📋</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Detalle de Solicitud</h3>
                <p className="text-sm text-gray-600">Folio: <span className="font-mono text-blue-600">{solicitud.folio}</span></p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 rounded-full hover:bg-gray-100">
              ×
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <EstadoBadge estado={isOverdue ? 'cancelada' : solicitud.estado} />
            {isOverdue && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md flex items-center gap-1">
                <span className="text-sm">⚠️</span> <span>Fecha vencida</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Información básica */}
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-lg">ℹ️</span> Información General
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {solicitud.isDocenteRequest ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Solicitante</label>
                    <p className="text-sm font-medium text-gray-900">{solicitud.profesor}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Riesgo</label>
                    <p className="text-sm text-gray-700">{solicitud.riesgo || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Solicitante</label>
                    <p className="text-sm font-medium text-gray-900">{solicitud.nombre_alumno}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Grupo</label>
                    <p className="text-sm text-gray-700">{solicitud.grupo || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Encargado</label>
                    <p className="text-sm text-gray-700">{solicitud.profesor || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Materia</label>
                    <p className="text-sm text-gray-700">
                      {solicitud.materia === 'Otras' ? solicitud.materia_otro : solicitud.materia || 'N/A'}
                    </p>
                  </div>
                </>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</label>
                <p className="text-sm text-gray-700">{formatFechaStr(solicitud.fecha_solicitud)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Fecha Recolección</label>
                <p className="text-sm font-medium text-blue-600">{formatFechaStr(solicitud.fecha_recoleccion)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Fecha Devolución</label>
                <p className="text-sm text-gray-700">{formatFechaStr(solicitud.fecha_devolucion)}</p>
              </div>
            </div>
          </div>

          {/* Materiales completos */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-lg">📦</span> Materiales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {solicitud.items.map((m, idx) => (
                <div key={m.item_id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      {m.cantidad} {getUnidad(m.tipo)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{m.nombre_material}</p>
                </div>
              ))}
              {solicitud.items.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2">📦</span>
                  <p className="text-sm">No hay materiales</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex flex-wrap justify-end gap-2">
          {usuario?.rol === 'docente' &&
            !solicitud.isDocenteRequest &&
            (solicitud.estado === 'aprobación pendiente') && (
              <>
                <Btn
                  color="green"
                  icon="✅"
                  onClick={() => onAccion(solicitud.id, 'aprobar', 'entrega pendiente')}
                  disabled={procesandoId === solicitud.id}
                  className="min-w-[100px] text-sm py-2"
                >
                  Aprobar
                </Btn>
                <Btn
                  color="red"
                  icon="❌"
                  onClick={() => onAccion(solicitud.id, 'rechazar', 'rechazada')}
                  disabled={procesandoId === solicitud.id}
                  className="min-w-[100px] text-sm py-2"
                >
                  Rechazar
                </Btn>
              </>
            )}
          {canDeliver && (
            <div className="flex rounded-md overflow-hidden shadow-sm min-w-[120px]">
              <div
                className={`${
                  isToday ? 'bg-green-400' : 'bg-orange-400'
                } text-white px-2 py-1 text-xs font-medium`}
              >
                <span className="text-sm">🕒</span>
              </div>
              <Btn
                color="blue"
                icon="🚚"
                onClick={() => onEntregar ? onEntregar(solicitud) : onAccion(solicitud.id, 'entregar', 'entregada')}
                disabled={procesandoId === solicitud.id}
                className="rounded-none rounded-r-md min-w-[80px] px-2 text-sm py-2"
              >
                Entregar
              </Btn>
            </div>
          )}
          {usuario?.rol === 'almacen' &&
            !['entregada', 'cancelado', 'rechazada'].includes((solicitud.estado || '').toLowerCase()) && (
              <Btn
                color="gray"
                icon="🗑️"
                onClick={() => onAccion(solicitud.id, 'cancelar', 'cancelado')}
                disabled={procesandoId === solicitud.id}
                className="min-w-[100px] text-sm py-2"
              >
                Cancelar
              </Btn>
            )}
          {usuario?.rol === 'alumno' &&
            (solicitud.estado === 'aprobación pendiente') && (
              <Btn
                color="gray"
                icon="🚫"
                onClick={() => onAccion(solicitud.id, 'cancelar', 'cancelado')}
                disabled={procesandoId === solicitud.id}
                className="min-w-[100px] text-sm py-2"
              >
                Cancelar
              </Btn>
            )}
          <Btn
            color="purple"
            icon="📄"
            onClick={() => onPDF(solicitud)}
            disabled={procesandoId === solicitud.id}
            className="min-w-[80px] text-sm py-2"
          >
            PDF
          </Btn>
        </div>
      </div>
    </div>
  );
};

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
  const [modalDetail, setModalDetail] = useState(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 8000);
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
          if (hoyCount > 0) {
            msg = `Tienes ${hoyCount} solicitudes para entregar hoy.`;
          } else if (mañanaCount > 0) {
            msg = `Tienes ${mañanaCount} solicitudes para mañana.`;
          }
          if (msg) setNotice(msg);
        }

        setError('');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Error al cargar las solicitudes.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
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
          folio: item.folio || '',
          nombre_alumno: item.nombre_alumno || '',
          profesor: item.profesor || '',
          materia: item.materia || '',
          materia_otro: item.materia_otro || '',
          fecha_solicitud: item.fecha_solicitud,
          fecha_recoleccion: item.fecha_recoleccion,
          fecha_devolucion: item.fecha_devolucion,
          riesgo: item.riesgo || '',
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
      case 'pendiente': return isDocenteReq ? 'pendiente' : 'aprobación pendiente';
      case 'aprobada': return 'entrega pendiente';
      case 'entregado': return 'entregada';
      case 'rechazada': return 'rechazada';
      case 'cancelado': return 'cancelado';
      case 'sin recoleccion': return 'eliminación automática por falta de recolección';
      default: return 'pendiente';
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
      setError(err.response?.data?.error || `Error al ${accion} la solicitud.`);
    } finally {
      setProcesando(null);
    }
  };

  function uiToRaw(estadoUI) {
    const e = (estadoUI || '').toLowerCase().trim();
    if (e === 'entrega pendiente') return 'aprobada';
    if (e === 'aprobación pendiente' || e === 'aprobacion pendiente') return 'pendiente';
    if (e === 'entregada') return 'entregado';
    if (e === 'rechazada') return 'rechazada';
    if (e === 'cancelado') return 'cancelado';
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

  const abrirDetalle = (sol) => {
    setModalDetail(sol);
  };

  const descargarPDF = async (vale) => {
    try {
      const token = localStorage.getItem('token');
      if (token && vale?.id) {
        try {
          const { data } = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/solicitudes/detalle/${vale.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          vale = { ...vale, ...(Array.isArray(data) ? data[0] : data) };
        } catch (e) {
          console.error('Error al obtener detalle de solicitud:', e);
        }
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
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
      const margin = 10;
      const primary = [0, 0, 0];
      const secondary = [100, 100, 100];

      const maxHeaderWidth = (pageWidth - margin * 2) * 0.4;
      const maxHeaderHeight = 35;
      const originalRatio = 3.5;

      let headerWidth, headerHeight;
      if (maxHeaderWidth / originalRatio <= maxHeaderHeight) {
        headerWidth = maxHeaderWidth;
        headerHeight = maxHeaderWidth / originalRatio;
      } else {
        headerHeight = maxHeaderHeight;
        headerWidth = maxHeaderHeight * originalRatio;
      }

      const scale = 0.5;
      headerWidth *= scale;
      headerHeight *= scale;

      const imageX = (pageWidth - headerWidth) / 2;
      const imageY = 10;

      doc.addImage(encabezadoImg, 'JPG', imageX, imageY, headerWidth, headerHeight);

      const titleY = imageY + headerHeight + 8;
      doc.setFontSize(16);
      doc.setTextColor(...primary);
      doc.setFont('helvetica', 'bold');
      doc.text('VALE DE ALMACÉN', pageWidth / 2, titleY, { align: 'center' });

      const nombre = vale.isDocenteRequest ? vale.profesor : vale.nombre_alumno;
      const grupo = vale.isDocenteRequest ? '' : (vale.grupo || '');
      const fechaReco = formatFechaStr(vale.fecha_recoleccion);
      const fechaDevolucion = formatFechaStr(vale.fecha_devolucion);

      const headInfo = vale.isDocenteRequest
        ? [['Nombre', 'Folio', 'Riesgo']]
        : [['Nombre', 'Grupo', 'Folio', 'Riesgo']];
      const bodyInfo = vale.isDocenteRequest
        ? [[nombre, vale.folio, vale.riesgo || '']]
        : [[nombre, grupo, vale.folio, vale.riesgo || '']];

      autoTable(doc, {
        startY: titleY + 5,
        theme: 'grid',
        head: headInfo,
        body: bodyInfo,
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { fontSize: 9, cellPadding: 2 },
        styles: { lineColor: primary, lineWidth: 0.2 },
        margin: { top: 0, bottom: 0, left: margin, right: margin },
        tableWidth: pageWidth - margin * 2
      });

      const startY = doc.lastAutoTable.finalY + 4;
      const items = vale.items || [];
      const rows = [];
      for (let i = 0; i < Math.ceil(items.length / 2); i++) {
        const left = items[i];
        const right = items[i + Math.ceil(items.length / 2)];
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
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        styles: { lineColor: primary, lineWidth: 0.2 },
        margin: { top: 0, bottom: 0, left: margin, right: margin },
        tableWidth: pageWidth - margin * 2
      });

      const afterTableY = doc.lastAutoTable.finalY + 4;
      const profesor = vale.profesor || '';
      const materiaVal =
        vale.materia === 'Otras'
          ? vale.materia_otro || ''
          : vale.materia || '';

      doc.setFontSize(8);
      doc.setTextColor(...primary);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha recolección:', margin, afterTableY);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaReco, margin + 30, afterTableY);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha devolución:', pageWidth / 2, afterTableY);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaDevolucion, pageWidth / 2 + 30, afterTableY);

      let noteY = afterTableY;

      if (!vale.isDocenteRequest) {
        const infoY = afterTableY + 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Profesor:', margin, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(profesor, margin + 20, infoY);

        doc.setFont('helvetica', 'bold');
        doc.text('Materia:', pageWidth / 2, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(materiaVal, pageWidth / 2 + 20, infoY);

        noteY = infoY;
      }

      doc.setFontSize(7);
      doc.setTextColor(...secondary);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'NOTA: LA FIRMA DEL PROFESOR AMPARA CUALQUIER EVENTO DURANTE EL TIEMPO QUE DURE LA PRÁCTICA',
        pageWidth / 2,
        noteY + 6,
        { align: 'center', maxWidth: pageWidth - margin * 2 }
      );

      const nombrePDF = vale.isDocenteRequest
        ? `Vale_${vale.folio}_${(vale.profesor || '').replace(/\s+/g, '')}.pdf`
        : `Vale_${vale.folio}_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(nombrePDF);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF.');
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased bg-gray-50 py-4 px-3 sm:px-4 lg:px-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-base text-red-800">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError('')} 
              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {usuario?.rol === 'alumno' && (
        <FichasSolicitudes
          titulo="Mis Solicitudes"
          data={alumnoData}
          loading={loading}
          showSolicitante
          showEncargado={false}
          showGrupo={false}
          columnasFijas={{ folio: true, materiales: true, fecha: false, estado: true, acciones: true }}
          usuario={usuario}
          onAccion={actualizarEstado}
          onPDF={descargarPDF}
          onDetail={abrirDetalle}
          procesandoId={procesando}
        />
      )}

      {usuario?.rol === 'docente' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🐺</span>
            <h2 className="text-xl font-semibold text-gray-800">Panel de Solicitudes</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="flex rounded-md shadow-sm border border-gray-200 w-full sm:w-auto gap-3 bg-white p-1.5">
              <div className="relative flex-1">
                {pendientesDocAlumnos > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 shadow-sm">
                    {pendientesDocAlumnos}
                  </span>
                )}
                <button
                  className={`w-full px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'alumnos'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-md`}
                  onClick={() => setActiveTab('alumnos')}
                >
                  <span className="text-base">🎓</span>
                  Alumnos
                </button>
              </div>
              <div className="relative flex-1">
                <button
                  className={`w-full px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'mias'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-md`}
                  onClick={() => setActiveTab('mias')}
                >
                  <span className="text-base">👨‍🏫</span>
                  Mis Solicitudes
                </button>
              </div>
            </div>
            <div className="relative flex-1 w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-base">🔍</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === 'alumnos' ? 'Buscar por alumno, folio, grupo...' : 'Buscar por folio...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white shadow-sm"
              />
            </div>
          </div>

          {activeTab === 'alumnos' ? (
            <FichasSolicitudes
              titulo="Solicitudes de Alumnos"
              data={filteredDocAprobar}
              loading={loading}
              showSolicitante
              showEncargado={false}
              showGrupo
              columnasFijas={{ folio: true, materiales: true, fecha: true, estado: true, acciones: true }}
              usuario={usuario}
              onAccion={actualizarEstado}
              onPDF={descargarPDF}
              onDetail={abrirDetalle}
              procesandoId={procesando}
            />
          ) : (
            <FichasSolicitudes
              titulo="Mis Solicitudes"
              data={filteredDocMias}
              loading={loading}
              showSolicitante={false}
              showEncargado={false}
              showGrupo={false}
              columnasFijas={{ folio: true, materiales: true, fecha: false, estado: true, acciones: true }}
              usuario={usuario}
              onAccion={actualizarEstado}
              onPDF={descargarPDF}
              onDetail={abrirDetalle}
              procesandoId={procesando}
            />
          )}
        </>
      )}

      {usuario?.rol === 'almacen' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🐺</span>
            <h2 className="text-xl font-semibold text-gray-800">Centro de Entregas</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="flex rounded-md shadow-sm border border-gray-200 w-full sm:w-auto gap-3 bg-white p-1.5">
              <div className="relative flex-1">
                {pendientesAlmAlumnos > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 shadow-sm">
                    {pendientesAlmAlumnos}
                  </span>
                )}
                <button
                  className={`w-full px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'alumnos'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-md`}
                  onClick={() => setActiveTab('alumnos')}
                >
                  <span className="text-base">🎓</span>
                  Alumnos
                </button>
              </div>
              <div className="relative flex-1">
                {pendientesAlmDocentes > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 shadow-sm">
                    {pendientesAlmDocentes}
                  </span>
                )}
                <button
                  className={`w-full px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'docentes'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-md`}
                  onClick={() => setActiveTab('docentes')}
                >
                  <span className="text-base">👨‍🏫</span>
                  Docentes
                </button>
              </div>
            </div>
            <div className="relative flex-1 w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-base">🔍</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === 'alumnos' ? 'Buscar por alumno, folio, grupo...' : 'Buscar por docente, folio...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white shadow-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white rounded-md p-3 border border-gray-200 shadow-sm w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-base">📅</span>
                Fecha:
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
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span className="text-base">✖️</span>
                  Limpiar
                </button>
              )}
            </div>
            {notice && (
              <div className="w-full sm:ml-auto">
                <div className="px-4 py-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md shadow-sm flex items-center gap-2">
                  <span className="text-base">🔔</span>
                  <span>{notice}</span>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'alumnos' ? (
            <FichasSolicitudes
              titulo="Solicitudes de Alumnos"
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
              onDetail={abrirDetalle}
              procesandoId={procesando}
            />
          ) : (
            <FichasSolicitudes
              titulo="Solicitudes de Docentes"
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
              onDetail={abrirDetalle}
              procesandoId={procesando}
            />
          )}
        </>
      )}

      <ModalDetalle
        solicitud={modalDetail}
        onClose={() => setModalDetail(null)}
        usuario={usuario}
        onAccion={actualizarEstado}
        onEntregar={abrirEntrega}
        onPDF={descargarPDF}
        procesandoId={procesando}
      />

      {modalEntrega && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn overflow-y-auto p-3">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-lg w-full my-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl animate-spin-slow">🚚</span>
              <h3 className="text-lg font-semibold text-gray-800">Confirmar Entrega</h3>
            </div>
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {modalEntrega.items.map(item => (
                <label key={item.item_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.item_id)}
                    onChange={() => toggleItem(item.item_id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {item.cantidad} {getUnidad(item.tipo)}
                      </span>
                      <span className="font-medium text-sm text-gray-800 truncate">{item.nombre_material}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center mb-4 py-2 border-t border-gray-200">
              <button 
                onClick={seleccionarTodos} 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span className="text-base">✅</span>
                Todos
              </button>
              <span className="text-sm text-gray-600">
                {selectedItems.length} / {modalEntrega.items.length}
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalEntrega(null)} 
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEntrega} 
                disabled={selectedItems.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm disabled:opacity-50 flex items-center gap-2"
              >
                <span className="text-base">🚚</span>
                Entregar ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html {
          font-size: 16px;
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -moz-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media (max-width: 640px) {
          .grid-cols-1 {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 640px) {
          .sm\\:grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1280px) {
          .xl\\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
