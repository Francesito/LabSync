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
    <span className={`${bg} ${text} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md border border-transparent`}>
      <span className="animate-pulse text-base">{icon}</span>
      <span className="capitalize">{estado}</span>
    </span>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-[380px] animate-pulse flex flex-col overflow-hidden">
    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-32 mb-4" />
    <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-40 mb-6" />
    <div className="space-y-3 flex-1 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full" />
      ))}
    </div>
    <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" />
  </div>
);

const Btn = ({ children, color, onClick, disabled, icon, className = '' }) => {
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
      className={`${palette} text-white text-sm rounded-lg px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed 
        transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1
        shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 min-w-[100px] ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="text-base">{icon}</span>}
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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-10 transition-all duration-300 hover:shadow-2xl hover:border-blue-300">
      <div className="px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-[#003579] to-[#0056b3] text-white flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl animate-spin-slow">📋</span>
          {titulo}
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMostrarRecientes(!mostrarRecientes)}
            className="text-base bg-white/20 px-5 py-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all duration-200 font-medium"
          >
            {mostrarRecientes ? 'Recientes primero' : 'Antiguas primero'}
          </button>
          <span className="text-base bg-white/20 px-5 py-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all duration-200 font-medium">
            {sortedData?.length || 0} solicitudes
          </span>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : sortedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
            <span className="text-6xl opacity-50 animate-bounce mb-6">📭</span>
            <span className="text-xl font-semibold">No hay solicitudes para mostrar en este momento.</span>
            <p className="text-gray-400 mt-2">Intenta ajustar los filtros o revisa más tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {sortedData.map((s) => {
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
              const isToday = recoDateStr === todayStr;
              const isFuture = recoDateStr > todayStr;
              const canDeliver =
                usuario?.rol === 'almacen' &&
                s.estado === 'entrega pendiente' &&
                (isToday || isFuture);
              const visibleItems = s.items.slice(0, 3);
              const hasMoreItems = s.items.length > 3;
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-[380px] flex flex-col cursor-pointer hover:shadow-2xl hover:border-blue-300 transition-all duration-300 overflow-hidden group ${
                    isOverdue ? 'border-2 border-red-500 bg-red-50/50' : ''
                  }`}
                  onClick={() => onDetail && onDetail(s)}
                >
                  {/* Header: Folio y Estado */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                    <div className="font-bold text-xl text-gray-900 truncate pr-2">{s.folio}</div>
                    <EstadoBadge estado={isOverdue ? 'cancelada' : s.estado} />
                  </div>

                  {/* Información básica - Más espaciada */}
                  <div className="space-y-3 mb-6 flex-1 min-h-0">
                    {columnas.solicitante && (
                      <div className="text-base text-gray-700 flex items-center gap-3 py-1">
                        <span className="text-gray-400 text-xl min-w-[20px]">👤</span>
                        <span className="truncate font-semibold text-gray-900 flex-1">{s.isDocenteRequest ? s.profesor : s.nombre_alumno}</span>
                      </div>
                    )}
                    {columnas.encargado && (
                      <div className="text-base text-gray-700 flex items-center gap-3 py-1">
                        <span className="text-gray-400 text-xl min-w-[20px]">👨‍🏫</span>
                        <span className="truncate text-gray-900">{s.profesor || 'N/A'}</span>
                      </div>
                    )}
                    {columnas.grupo && (
                      <div className="text-base text-gray-700 flex items-center gap-3 py-1">
                        <span className="text-gray-400 text-xl min-w-[20px]">👥</span>
                        <span className="truncate text-gray-900">{s.grupo || 'N/A'}</span>
                      </div>
                    )}
                    {columnas.fecha && (
                      <div className="text-base text-gray-700 flex items-center gap-3 py-1">
                        <span className="text-gray-400 text-xl min-w-[20px]">📅</span>
                        <span className="font-semibold text-gray-900">{dateStr ? formatFechaStr(dateStr) : 'N/A'}</span>
                      </div>
                    )}
                    {showMsg && recoDateStr === tomorrowStr && (
                      <div className="text-sm text-orange-600 bg-orange-100 px-3 py-2 rounded-xl flex items-center gap-2 border-l-4 border-orange-400">
                        <span className="text-lg">🕒</span> <span>Entrega programada para mañana</span>
                      </div>
                    )}
                  </div>

                  {/* Materiales: Más espacio y mejor visibilidad */}
                  <div className="mb-6 flex-1 min-h-0">
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="text-xl">📦</span> Materiales solicitados
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
                      {visibleItems.map((m, idx) => (
                        <div key={m.item_id} className={`text-sm flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all duration-200 ${idx < visibleItems.length - 1 ? 'mb-1' : ''}`}>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold min-w-[60px] text-center">
                            {m.cantidad} {getUnidad(m.tipo)}
                          </span>
                          <span className="truncate flex-1 font-medium text-gray-900">{m.nombre_material}</span>
                        </div>
                      ))}
                      {hasMoreItems && (
                        <div className="text-sm text-gray-500 italic text-center py-2 bg-blue-50 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors duration-200">
                          +{s.items.length - 3} materiales adicionales...
                        </div>
                      )}
                      {!hasMoreItems && visibleItems.length === 0 && (
                        <div className="text-sm text-gray-400 italic text-center py-2">
                          Sin materiales listados
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones - Mejor distribución */}
                  {columnas.acciones && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                      <div className="flex flex-1 gap-2 min-w-0">
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
                        <div className="flex-1 min-w-[140px]">
                          <div className="flex rounded-xl overflow-hidden shadow-sm">
                            <div
                              className={`${
                                isToday
                                  ? 'bg-green-500'
                                  : 'bg-orange-500'
                              } text-white px-3 py-2 rounded-l-xl flex items-center justify-center text-sm font-medium`}
                              title={isToday ? 'Entrega hoy' : 'Entrega futura'}
                            >
                              <span className="text-lg">🕒</span>
                            </div>
                            <Btn
                              color="blue"
                              icon="🚚"
                              onClick={(e) => { e.stopPropagation(); onEntregar ? onEntregar(s) : onAccion(s.id, 'entregar', 'entregada'); }}
                              disabled={procesandoId === s.id}
                              className="rounded-none rounded-r-xl flex-1 px-3"
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
                            className="flex-1 min-w-[100px]"
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
                            className="flex-1 min-w-[100px]"
                          >
                            Cancelar
                          </Btn>
                        )}
                      <Btn
                        color="purple"
                        icon="📄"
                        onClick={(e) => { e.stopPropagation(); onPDF(s); }}
                        disabled={procesandoId === s.id}
                        className="min-w-[80px]"
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn overflow-y-auto p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 transform animate-slideUp border border-gray-200 mx-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-8 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl animate-spin-slow">📋</span>
              <div>
                <h3 className="text-3xl font-bold text-gray-800">Detalle de Solicitud</h3>
                <p className="text-lg text-gray-600">Folio: <span className="font-mono text-blue-600">{solicitud.folio}</span></p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all duration-200 text-3xl font-bold p-2 rounded-full hover:bg-gray-100">
              ×
            </button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <EstadoBadge estado={isOverdue ? 'cancelada' : solicitud.estado} />
            {isOverdue && (
              <div className="text-base text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-200 flex items-center gap-2">
                <span className="text-xl">⚠️</span> <span>Fecha de recolección vencida</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8 space-y-8">
          {/* Información básica */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
            <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
              <span className="text-2xl">ℹ️</span> Información General
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {solicitud.isDocenteRequest ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Solicitante</label>
                    <p className="text-lg font-bold text-gray-900">{solicitud.profesor}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Nivel de Riesgo</label>
                    <p className="text-lg text-gray-700">{solicitud.riesgo || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Solicitante</label>
                    <p className="text-lg font-bold text-gray-900">{solicitud.nombre_alumno}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Grupo</label>
                    <p className="text-lg text-gray-700">{solicitud.grupo || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Encargado</label>
                    <p className="text-lg text-gray-700">{solicitud.profesor || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Materia</label>
                    <p className="text-lg text-gray-700">
                      {solicitud.materia === 'Otras' ? solicitud.materia_otro : solicitud.materia || 'N/A'}
                    </p>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fecha de Solicitud</label>
                <p className="text-lg text-gray-700">{formatFechaStr(solicitud.fecha_solicitud)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fecha de Recolección</label>
                <p className="text-lg font-bold text-blue-600">{formatFechaStr(solicitud.fecha_recoleccion)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fecha de Devolución</label>
                <p className="text-lg text-gray-700">{formatFechaStr(solicitud.fecha_devolucion)}</p>
              </div>
            </div>
          </div>

          {/* Materiales completos */}
          <div className="space-y-5">
            <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-2xl">📦</span> Lista Completa de Materiales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {solicitud.items.map((m, idx) => (
                <div key={m.item_id} className={`p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 ${idx % 2 === 0 ? 'hover:border-blue-200' : 'hover:border-green-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                      {m.cantidad} {getUnidad(m.tipo)}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-gray-900 leading-relaxed">{m.nombre_material}</p>
                </div>
              ))}
              {solicitud.items.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <span className="text-6xl mb-4">📦</span>
                  <p className="text-xl">No hay materiales en esta solicitud</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones en footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 sm:p-8 flex flex-wrap items-center justify-end gap-4 bg-gradient-to-r from-gray-50 to-white">
          {usuario?.rol === 'docente' &&
            !solicitud.isDocenteRequest &&
            (solicitud.estado === 'aprobación pendiente') && (
              <>
                <Btn
                  color="green"
                  icon="✅"
                  onClick={() => onAccion(solicitud.id, 'aprobar', 'entrega pendiente')}
                  disabled={procesandoId === solicitud.id}
                  className="min-w-[140px] text-lg py-3"
                >
                  Aprobar Solicitud
                </Btn>
                <Btn
                  color="red"
                  icon="❌"
                  onClick={() => onAccion(solicitud.id, 'rechazar', 'rechazada')}
                  disabled={procesandoId === solicitud.id}
                  className="min-w-[140px] text-lg py-3"
                >
                  Rechazar Solicitud
                </Btn>
              </>
            )}
          {canDeliver && (
            <div className="flex rounded-xl overflow-hidden shadow-lg min-w-[160px]">
              <div
                className={`${
                  isToday
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white px-4 py-3 rounded-l-xl flex items-center justify-center font-medium transition-colors duration-200`}
                title={isToday ? 'Entrega para hoy' : 'Entrega programada'}
              >
                <span className="text-xl">🕒</span>
              </div>
              <Btn
                color="blue"
                icon="🚚"
                onClick={() => onEntregar ? onEntregar(solicitud) : onAccion(solicitud.id, 'entregar', 'entregada')}
                disabled={procesandoId === solicitud.id}
                className="rounded-none rounded-r-xl min-w-[120px] px-4 text-lg py-3"
              >
                Confirmar Entrega
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
                className="min-w-[140px] text-lg py-3"
              >
                Cancelar Solicitud
              </Btn>
            )}
          {usuario?.rol === 'alumno' &&
            (solicitud.estado === 'aprobación pendiente') && (
              <Btn
                color="gray"
                icon="🚫"
                onClick={() => onAccion(solicitud.id, 'cancelar', 'cancelado')}
                disabled={procesandoId === solicitud.id}
                className="min-w-[140px] text-lg py-3"
              >
                Cancelar Solicitud
              </Btn>
            )}
          <Btn
            color="purple"
            icon="📄"
            onClick={() => onPDF(solicitud)}
            disabled={procesandoId === solicitud.id}
            className="min-w-[120px] text-lg py-3"
          >
            Generar PDF
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
            msg = `Tienes ${pendientes.length} solicitudes pendientes: ${hoyCount} para hoy y ${mañanaCount} para mañana. ¡No olvides entregar!`;
          } else if (hoyCount > 0) {
            msg = `Tienes ${hoyCount} solicitudes para entregar hoy. ¡Priorízalas!`;
          } else if (mañanaCount > 0) {
            msg = `Tienes ${mañanaCount} solicitudes programadas para mañana. Prepárate.`;
          }
          if (msg) {
            setNotice(msg);
          }
        }

        setError('');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Error al cargar las solicitudes. Intenta recargar la página.');
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
      setError(err.response?.data?.error || `Error al ${accion} la solicitud. Verifica tu conexión.`);
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
      const margin = 15;
      const marginLeft = margin;
      const primary = [0, 0, 0];
      const secondary = [100, 100, 100];

      const maxHeaderWidth = (pageWidth - margin * 2) * 0.5;
      const maxHeaderHeight = 45;
      const originalRatio = 3.5;

      let headerWidth, headerHeight;
      if (maxHeaderWidth / originalRatio <= maxHeaderHeight) {
        headerWidth = maxHeaderWidth;
        headerHeight = maxHeaderWidth / originalRatio;
      } else {
        headerHeight = maxHeaderHeight;
        headerWidth = maxHeaderHeight * originalRatio;
      }

      const scale = 0.6;
      headerWidth *= scale;
      headerHeight *= scale;

      const imageX = (pageWidth - headerWidth) / 2;
      const imageY = 15;

      doc.addImage(encabezadoImg, 'JPG', imageX, imageY, headerWidth, headerHeight);

      const titleY = imageY + headerHeight + 10;
      doc.setFontSize(20);
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
        startY: titleY + 6,
        theme: 'grid',
        head: headInfo,
        body: bodyInfo,
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { fontSize: 11, cellPadding: 3 },
        styles: { lineColor: primary, lineWidth: 0.3 },
        margin: { top: 0, bottom: 0, left: margin, right: margin },
        tableWidth: pageWidth - margin * 2
      });

      const startY = doc.lastAutoTable.finalY + 5;
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
        bodyStyles: { fontSize: 10, cellPadding: 3 },
        styles: { lineColor: primary, lineWidth: 0.3 },
        margin: { top: 0, bottom: 0, left: margin, right: margin },
        tableWidth: pageWidth - margin * 2
      });

      const afterTableY = doc.lastAutoTable.finalY + 6;
      const profesor = vale.profesor || '';
      const materiaVal =
        vale.materia === 'Otras'
          ? vale.materia_otro || ''
          : vale.materia || '';

      doc.setFontSize(10);
      doc.setTextColor(...primary);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha recolección:', marginLeft, afterTableY);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaReco, marginLeft + 40, afterTableY);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha devolución:', pageWidth / 2, afterTableY);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaDevolucion, pageWidth / 2 + 40, afterTableY);

      let noteY = afterTableY;

      if (!vale.isDocenteRequest) {
        const infoY = afterTableY + 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Profesor:', marginLeft, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(profesor, marginLeft + 25, infoY);

        doc.setFont('helvetica', 'bold');
        doc.text('Materia:', pageWidth / 2, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(materiaVal, pageWidth / 2 + 25, infoY);

        noteY = infoY;
      }

      doc.setFontSize(9);
      doc.setTextColor(...secondary);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'NOTA: LA FIRMA DEL PROFESOR AMPARA CUALQUIER EVENTO DURANTE EL TIEMPO QUE DURE LA PRÁCTICA, FAVOR DE RESPETAR LOS HORARIOS',
        pageWidth / 2,
        noteY + 8,
        { align: 'center', maxWidth: pageWidth - margin * 2 }
      );

      const nombrePDF = vale.isDocenteRequest
        ? `Vale_${vale.folio}_${(vale.profesor || '').replace(/\s+/g, '')}.pdf`
        : `Vale_${vale.folio}_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(nombrePDF);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF. Intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl shadow-xl animate-shake hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl text-red-800 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span> Error en la carga
                </h3>
                <p className="text-red-700 text-base mt-1">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError('')} 
              className="text-red-500 hover:text-red-700 transition-all duration-200 hover:scale-110 transform p-2 rounded-full hover:bg-red-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {usuario?.rol === 'alumno' && (
        <FichasSolicitudes
          titulo="Mis Solicitudes de Materiales"
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
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl">🐺</span>
            <h2 className="text-3xl font-bold text-gray-800">Panel de Solicitudes de Préstamo</h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-6 mb-10">
            <div className="relative flex rounded-2xl shadow-xl border border-gray-200 w-full lg:w-auto gap-4 bg-white p-2">
              <div className="relative flex-1">
                {pendientesDocAlumnos > 0 && (
                  <span className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-full px-3 py-1.5 shadow-lg animate-bounce z-20 font-bold">
                    {pendientesDocAlumnos} Pendientes
                  </span>
                )}
                <button
                  className={`w-full px-6 py-4 transition-all duration-200 font-semibold text-lg flex items-center justify-center ${
                    activeTab === 'alumnos'
                      ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white shadow-xl transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-xl`}
                  onClick={() => setActiveTab('alumnos')}
                >
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-2xl">🎓</span>
                    <span className="whitespace-nowrap">Solicitudes de Alumnos</span>
                  </div>
                </button>
              </div>
              <div className="relative flex-1">
                <button
                  className={`w-full px-6 py-4 transition-all duration-200 font-semibold text-lg flex items-center justify-center ${
                    activeTab === 'mias'
                      ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white shadow-xl transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-xl`}
                  onClick={() => setActiveTab('mias')}
                >
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-2xl">👨‍🏫</span>
                    <span className="whitespace-nowrap">Mis Solicitudes</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="relative flex-1 w-full lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-gray-400 text-2xl animate-pulse">🔍</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === 'alumnos' ? 'Buscar por nombre del alumno, folio o grupo...' : 'Buscar por folio o nombre...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-16 pr-5 py-4 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-white shadow-lg hover:shadow-xl"
              />
            </div>
          </div>

          {activeTab === 'alumnos' ? (
            <FichasSolicitudes
              titulo="Solicitudes Pendientes de Aprobación"
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
              titulo="Mis Solicitudes Personales"
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
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl">🐺</span>
            <h2 className="text-3xl font-bold text-gray-800">Centro de Entregas - Solicitudes</h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-6 mb-10">
            <div className="relative flex rounded-2xl shadow-xl border border-gray-200 w-full lg:w-auto gap-4 bg-white p-2">
              <div className="relative flex-1">
                {pendientesAlmAlumnos > 0 && (
                  <span className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-full px-3 py-1.5 shadow-lg animate-bounce z-20 font-bold">
                    {pendientesAlmAlumnos} Pendientes
                  </span>
                )}
                <button
                  className={`w-full px-6 py-4 transition-all duration-200 font-semibold text-lg flex items-center justify-center ${
                    activeTab === 'alumnos'
                      ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white shadow-xl transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-xl`}
                  onClick={() => setActiveTab('alumnos')}
                >
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-2xl">🎓</span>
                    <span className="whitespace-nowrap">Solicitudes de Alumnos</span>
                  </div>
                </button>
              </div>
              <div className="relative flex-1">
                {pendientesAlmDocentes > 0 && (
                  <span className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-full px-3 py-1.5 shadow-lg animate-bounce z-20 font-bold">
                    {pendientesAlmDocentes} Pendientes
                  </span>
                )}
                <button
                  className={`w-full px-6 py-4 transition-all duration-200 font-semibold text-lg flex items-center justify-center ${
                    activeTab === 'docentes'
                      ? 'bg-gradient-to-r from-[#003579] to-[#0056b3] text-white shadow-xl transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-xl`}
                  onClick={() => setActiveTab('docentes')}
                >
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-2xl">👨‍🏫</span>
                    <span className="whitespace-nowrap">Solicitudes de Docentes</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="relative flex-1 w-full lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-gray-400 text-2xl animate-pulse">🔍</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === 'alumnos' ? 'Buscar por nombre, folio o grupo...' : 'Buscar por nombre o folio...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-16 pr-5 py-4 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-white shadow-lg hover:shadow-xl"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl p-5 border border-gray-200 shadow-xl w-full lg:w-auto">
              <label className="text-lg font-semibold text-gray-700 flex items-center gap-3">
                <span className="text-2xl">📅</span>
                Filtrar por fecha de recolección:
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
                className="border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 hover:shadow-sm flex-1"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-lg text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <span className="text-xl">✖️</span>
                  Limpiar filtro
                </button>
              )}
            </div>
            {notice && (
              <div className="w-full lg:ml-auto">
                <div className="px-6 py-4 text-lg bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 text-yellow-800 rounded-2xl shadow-xl animate-pulse hover:shadow-2xl transition-shadow duration-200 flex items-center gap-3">
                  <span className="text-2xl">🔔</span>
                  <span className="font-semibold">{notice}</span>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'alumnos' ? (
            <FichasSolicitudes
              titulo="Solicitudes de Alumnos Listas para Entrega"
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
              titulo="Solicitudes Directas de Docentes"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn overflow-y-auto p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 my-8 transform animate-slideUp border border-gray-200 hover:shadow-3xl transition-shadow duration-300">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl animate-spin-slow">🚚</span>
              <h3 className="text-2xl font-bold text-gray-800">Confirmar Entrega de Materiales</h3>
            </div>
            <div className="space-y-4 mb-8 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 pr-2">
              {modalEntrega.items.map(item => (
                <label key={item.item_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.item_id)}
                    onChange={() => toggleItem(item.item_id)}
                    className="w-6 h-6 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 hover:scale-110 transition-transform duration-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                        {item.cantidad} {getUnidad(item.tipo)}
                      </span>
                      <span className="font-semibold text-gray-800 text-lg truncate hover:text-blue-600 transition-colors duration-200">{item.nombre_material}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center mb-8 py-4 border-t border-gray-200">
              <button 
                onClick={seleccionarTodos} 
                className="text-lg text-blue-600 hover:text-blue-800 font-semibold transition-all duration-200 flex items-center gap-2 hover:underline"
              >
                <span className="text-xl">✅</span>
                Seleccionar todos los materiales
              </button>
              <span className="text-lg text-gray-600 font-semibold">
                {selectedItems.length} / {modalEntrega.items.length} seleccionados
              </span>
            </div>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setModalEntrega(null)} 
                className="px-8 py-3 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold shadow-md hover:shadow-lg text-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEntrega} 
                disabled={selectedItems.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg hover:scale-105 transform"
              >
                <span className="text-xl">🚚</span>
                Confirmar Entrega ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media (max-width: 640px) {
          .grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
        @media (min-width: 640px) {
          .sm\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (min-width: 1280px) {
          .xl\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (min-width: 1536px) {
          .2xl\\:grid-cols-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
