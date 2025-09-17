'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import {
  obtenerPrestamosEntregados,
  obtenerDetalleSolicitud,
  registrarDevolucion,
  informarPrestamoVencido,
  obtenerGrupos,
} from '../../lib/api';

const parseDate = (str) => {
  if (!str) return null;
  // normalizar a YYYY-MM-DD para evitar desfase por zona horaria
  const [y, m, d] = str.split('T')[0].split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return isNaN(date) ? null : date;
};

const formatDate = (str) => {
  const date = parseDate(str);
  return date ? date.toLocaleDateString() : 'Sin fecha';
};

const isOverdue = (str) => {
  const date = parseDate(str);
  if (!date) return false;
  const today = new Date();
  return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

// Función para formatear nombres de materiales
const formatMaterialName = (name) => {
  if (!name) return '';
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const esReactivo = (tipo = '') => ['liquido', 'solido'].includes(tipo.trim().toLowerCase());
const esMaterial = (tipo = '') => {
  const normalizado = tipo.trim().toLowerCase();
  if (esReactivo(normalizado)) return false;
  return ['equipo', 'laboratorio'].includes(normalizado) || normalizado.length === 0;
};

const unidadPorTipo = (tipo = '') => {
  const normalizado = tipo.trim().toLowerCase();
  if (normalizado === 'liquido') return 'ml';
  if (normalizado === 'solido') return 'g';
  return 'u';
};

const prepararDetalle = (det) => {
  if (!det) return det;
  const items = (det.items || []).map((item) => {
    const cantidadPendiente = Number(item.cantidad) || 0;
    return {
      ...item,
      cantidad: cantidadPendiente,
      devolver: esMaterial(item.tipo) ? 0 : undefined,
      devuelto: false,
    };
  });
  return { ...det, items };
};


export default function Prestamos() {
  const { usuario } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [groups, setGroups] = useState([]);
  const [informados, setInformados] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  
  // 1) Al montar, cargar sólo si es almacenista
  useEffect(() => {
    if (usuario === null) return; 
    if (usuario.rol !== 'almacen') {
      router.push('/login');
      return;
    }
    loadPrestamos();
  }, [usuario, router]);

  // 2) Traer y agrupar por solicitud_id
  const loadPrestamos = async () => {
    setLoading(true);
    try {
      const data = await obtenerPrestamosEntregados();
      const grouped = Object.values(
        data.reduce((acc, item) => {
          if (!acc[item.solicitud_id]) {
            acc[item.solicitud_id] = {
              solicitud_id: item.solicitud_id,
              folio: item.folio,
              nombre_alumno: item.nombre_alumno,
              profesor: item.profesor,
              fecha_devolucion: item.fecha_devolucion,
              grupo: item.grupo_nombre,
            };
          }
          return acc;
        }, {})
      );
      setPrestamos(grouped);
      const gruposDB = await obtenerGrupos();
      setGroups(gruposDB.map(g => g.nombre));
      return grouped;
    } catch (err) {
      console.error('Error cargando préstamos:', err);
      alert('No se pudieron cargar los préstamos entregados');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 3) Filtrar
  const filtered = prestamos
    .filter(p =>
      p.folio.toLowerCase().includes(filter.toLowerCase()) ||
      (p.nombre_alumno || p.profesor || '')
        .toLowerCase()
        .includes(filter.toLowerCase())
    )
    .filter(p => (groupFilter ? p.grupo === groupFilter : true))
    .filter(p => {
      if (statusFilter === 'vencidas') return isOverdue(p.fecha_devolucion);
      return true;
    });

  const sorted =
    statusFilter === 'proximas'
      ? [...filtered].sort(
          (a, b) =>
           parseDate(a.fecha_devolucion) - parseDate(b.fecha_devolucion)
        )
      : filtered;

  const resetFilters = () => {
    setFilter('');
    setStatusFilter('');
    setGroupFilter('');
  };

  // 4) Abrir modal y cargar detalle
  const openModal = async solicitud_id => {
    // Abrir modal inmediatamente con loading
    setSelectedSolicitud(solicitud_id);
    setShowModal(true);
    setDetalle(null); // Reset detalle para mostrar loading
    
    try {
      const det = await obtenerDetalleSolicitud(solicitud_id);
        setDetalle(prepararDetalle(det));
    } catch (err) {
      console.error('Error al obtener detalle:', err);
      alert('No se pudo obtener el detalle del préstamo');
      closeModal(); // Cerrar modal si hay error
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setDetalle(null);
    setSelectedSolicitud(null);
  };

  const handleInformar = async (id) => {
    try {
      await informarPrestamoVencido(id);
      setInformados((prev) => [...prev, id]);
      alert('Notificación enviada');
    } catch (err) {
      console.error('Error al informar préstamo:', err);
      alert('No se pudo enviar la notificación');
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const devoluciones = detalle.items
       .map(item => {
          if (esReactivo(item.tipo)) {
            return item.devuelto
              ? { item_id: item.item_id, cantidad_devuelta: item.cantidad }
              : null;
          }
          if (esMaterial(item.tipo)) {
            const cantidadDevuelta = Number(item.devolver) || 0;
            return cantidadDevuelta > 0
              ? {
                  item_id: item.item_id,
                  cantidad_devuelta: Math.min(cantidadDevuelta, item.cantidad),
                }
              : null;
          }
          return null;
        })
        .filter(Boolean);

      if (devoluciones.length === 0) {
        setSaving(false);
        return;
      }

      await registrarDevolucion(selectedSolicitud, devoluciones);

      const grouped = await loadPrestamos();
      if (!grouped.some(g => g.solicitud_id === selectedSolicitud)) {
        return closeModal();
      }

       const nuevoDetalle = prepararDetalle(await obtenerDetalleSolicitud(selectedSolicitud));
      if (nuevoDetalle.items.length === 0) {
        return closeModal();
      }
      setDetalle(nuevoDetalle);

    } catch (err) {
      console.error('Error al guardar devolución:', err);
      alert('No se pudo guardar la devolución');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Responsivo */}
 <div className="bg-gradient-to-r from-[#003579] via-[#1f4c8b] to-[#2563eb] text-white px-3 py-5 sm:px-5 sm:py-7 lg:px-10 lg:py-9 shadow">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-2.5 bg-white/15 backdrop-blur rounded-lg sm:rounded-xl flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
             <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight truncate">Préstamos Entregados</h1>
            <p className="text-slate-200 mt-1 sm:mt-1.5 text-xs sm:text-sm">
              Gestiona y registra las devoluciones pendientes de forma ágil
            </p>
          </div>
        </div>
      </div>

     <div className="p-3 sm:p-5 lg:p-8">
        {/* Barra de búsqueda y filtros responsiva */}
      <div className="mb-5 sm:mb-7 space-y-3 sm:space-y-4">
          {/* Campo de búsqueda */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por folio o nombre..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
             className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent text-sm"
            />
          </div>

          {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            {/* Botones de estado - en una fila en móvil */}
           <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full">
              <button
                onClick={() => setStatusFilter(statusFilter === 'vencidas' ? '' : 'vencidas')}
               className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors duration-200 flex-1 sm:flex-none whitespace-nowrap ${statusFilter === 'vencidas' ? 'bg-[#003579] text-white border-[#003579]' : 'bg-white text-[#003579] border-slate-200 hover:border-[#003579]/40'}`}
              >
                Vencidas
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'proximas' ? '' : 'proximas')}
               className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors duration-200 flex-1 sm:flex-none whitespace-nowrap ${statusFilter === 'proximas' ? 'bg-[#003579] text-white border-[#003579]' : 'bg-white text-[#003579] border-slate-200 hover:border-[#003579]/40'}`}
              >
                Próximas a vencer
              </button>
            </div>

            {/* Select de grupo y botón limpiar en segunda fila en móvil */}
            <div className="flex gap-2">
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-[#003579] text-xs sm:text-sm flex-1 sm:min-w-[180px] bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">Todos los grupos</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <button
                onClick={resetFilters}
                 className="px-3 py-2 text-xs sm:text-sm rounded-lg border bg-white text-[#003579] whitespace-nowrap hover:border-[#003579]/40 transition-colors duration-200"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-slate-200 border-t-slate-600"></div>
          </div>
        )}

        {/* Cards Grid Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-5">
          {sorted.map((sol) => {
            const overdue = isOverdue(sol.fecha_devolucion);
            const nombre = sol.nombre_alumno || sol.profesor;

            return (
              <div
                key={sol.solicitud_id}
                onClick={() => openModal(sol.solicitud_id)}
               className={`bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 border border-slate-200/80 hover:border-[#003579]/30 active:scale-[0.98] ${overdue ? 'ring-1 ring-red-400/60 bg-red-50' : ''}`}
              >
              <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="p-2 bg-[#003579] rounded-lg sm:rounded-xl flex-shrink-0 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-lg sm:text-xl font-semibold text-slate-800 truncate">
                      {sol.folio}
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                     <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                     <span className="text-sm font-medium truncate">{nombre}</span>
                    </div>
                  <div className="text-xs sm:text-sm text-slate-500">
                      Devolver: {formatDate(sol.fecha_devolucion)}
                    </div>
                    {overdue && (
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                       <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
                          ⚠️ Vencido
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInformar(sol.solicitud_id); }}
                          disabled={informados.includes(sol.solicitud_id)}
                        className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-md disabled:opacity-50 hover:bg-red-700 transition-colors w-full xs:w-auto shadow-sm"
                        >
                          {informados.includes(sol.solicitud_id) ? 'Informado' : 'Informar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {!loading && sorted.length === 0 && (
          <div className="text-center py-12 sm:py-16">
          <div className="p-3 sm:p-4 bg-slate-100 rounded-xl w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">No hay préstamos</h3>
            <p className="text-sm sm:text-base text-slate-500">No se encontraron préstamos entregados</p>
          </div>
        )}
      </div>

      {/* Modal Completamente Responsivo */}
      {showModal && (
       <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 transition-opacity duration-300 ease-in-out">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden border border-slate-100">
            {/* Header del Modal Responsivo */}
          <div className="bg-gradient-to-r from-[#003579] via-[#1f4c8b] to-[#2563eb] text-white px-4 sm:px-6 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
               <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold truncate">Detalle del préstamo</h2>
                </div>
                <button
                  onClick={closeModal}
                  className="text-slate-100 hover:text-white hover:bg-white/20 rounded-lg p-2 flex-shrink-0 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50/60" style={{ maxHeight: 'calc(92vh - 72px)' }}>
              {/* Loading state en el modal */}
              {!detalle ? (
                <div className="flex justify-center items-center py-12 sm:py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-slate-200 border-t-slate-600 mx-auto mb-3"></div>
                    <p className="text-slate-600 text-sm sm:text-base">Cargando detalles del préstamo...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Info Cards Responsivas */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 mb-6 sm:mb-7">
                    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="p-2 bg-[#003579]/10 text-[#003579] rounded-lg flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H5C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H17M7 4H17" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                        <span className="block text-[11px] sm:text-xs text-slate-500 uppercase font-semibold tracking-wide">Folio</span>
                          <span className="block font-semibold text-base sm:text-lg text-slate-800 truncate">{detalle.folio}</span>
                        </div>
                      </div>
                    </div>

                  <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="p-2 bg-[#003579]/10 text-[#003579] rounded-lg flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] sm:text-xs text-slate-500 uppercase font-semibold tracking-wide">Recolección</span>
                          <span className="block font-semibold text-base sm:text-lg text-slate-800 truncate">
                            {formatDate(detalle.fecha_recoleccion)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {detalle.nombre_alumno && (
                       <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="p-2 bg-[#003579]/10 text-[#003579] rounded-lg flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                             <span className="block text-[11px] sm:text-xs text-slate-500 uppercase font-semibold tracking-wide">Alumno</span>
                            <span className="block font-semibold text-base sm:text-lg text-slate-800 break-words leading-snug">{detalle.nombre_alumno}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {detalle.profesor && (
                    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                           <div className="p-2 bg-[#003579]/10 text-[#003579] rounded-lg flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[11px] sm:text-xs text-slate-500 uppercase font-semibold tracking-wide">Profesor</span>
                            <span className="block font-semibold text-base sm:text-lg text-slate-800 break-words leading-snug">{detalle.profesor}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formulario Responsivo Mejorado */}
                  <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
                      <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center space-x-3">
                          <svg className="w-5 h-5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Materiales por Devolver</span>
                        </h3>
                      </div>

                      {/* Tabla Responsiva Mejorada */}
                      <div className="overflow-x-auto">
                        {/* Vista Desktop - Tabla compacta */}
                        <div className="hidden lg:block">
                          <table className="table-auto w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase tracking-wider">
                                   Registro
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase tracking-wider">
                                  Material
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-slate-500 uppercase tracking-wider">
                                  Pendiente
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-slate-500 uppercase tracking-wider">
                                  Unidad
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {detalle.items.map((item) => {
                                const reactivo = esReactivo(item.tipo);
                                const unidad = unidadPorTipo(item.tipo);
                                return (
                                  <tr key={item.item_id} className="hover:bg-white transition-colors duration-200">
                                    <td className="px-6 py-4">
                                      {reactivo ? (
                                        <label className="flex items-center justify-center gap-2 text-sm text-slate-600">
                                          <input
                                            type="checkbox"
                                            checked={item.devuelto}
                                            onChange={e => {
                                              item.devuelto = e.target.checked;
                                              setDetalle({ ...detalle });
                                            }}
                                            className="w-4 h-4 rounded text-[#003579] focus:ring-[#003579]/40"
                                          />
                                          <span className="hidden xl:inline">Devuelto completo</span>
                                        </label>
                                      ) : (
                                        <div className="flex items-center justify-center gap-2">
                                          <input
                                            type="number"
                                            min="0"
                                            max={item.cantidad}
                                            value={item.devolver ?? 0}
                                            onChange={e => {
                                              const val = Number(e.target.value || 0);
                                              item.devolver = Math.min(Math.max(val, 0), item.cantidad);
                                              setDetalle({ ...detalle });
                                            }}
                                            className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                                          />
                                          <span className="text-xs text-slate-400">/ {item.cantidad}</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                                          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                          </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className="text-base font-medium text-slate-900 leading-tight truncate">
                                              {formatMaterialName(item.nombre_material)}
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${reactivo ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                              {reactivo ? 'Reactivo' : 'Material'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                   </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-base font-medium text-slate-900">{item.cantidad}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                                        {unidad}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Vista Tablet - Tabla más compacta */}
                        <div className="hidden md:block lg:hidden">
                          <table className="w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Registro
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Material
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                 Pendiente
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Und
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {detalle.items.map((item) => {
                                const reactivo = esReactivo(item.tipo);
                                const unidad = unidadPorTipo(item.tipo);
                                return (
                                  <tr key={item.item_id} className="hover:bg-white transition-colors duration-200">
                                    <td className="px-4 py-3">
                                      {reactivo ? (
                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                                          <input
                                            type="checkbox"
                                            checked={item.devuelto}
                                            onChange={e => {
                                              item.devuelto = e.target.checked;
                                              setDetalle({ ...detalle });
                                            }}
                                            className="w-4 h-4 rounded text-[#003579] focus:ring-[#003579]/40"
                                          />
                                          <span>Devuelto</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <input
                                            type="number"
                                            min="0"
                                            max={item.cantidad}
                                            value={item.devolver ?? 0}
                                            onChange={e => {
                                              const val = Number(e.target.value || 0);
                                              item.devolver = Math.min(Math.max(val, 0), item.cantidad);
                                              setDetalle({ ...detalle });
                                            }}
                                            className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                                          />
                                          <span className="text-[11px] text-slate-400">/{item.cantidad}</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="p-1.5 bg-slate-100 rounded flex-shrink-0">
                                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                          </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium text-slate-900 leading-tight truncate">
                                              {formatMaterialName(item.nombre_material)}
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${reactivo ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                              {reactivo ? 'Reactivo' : 'Material'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-sm font-medium text-slate-900">{item.cantidad}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                        {unidad}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Vista Móvil Compacta */}
                        <div className="block md:hidden space-y-4 p-2">
                         {detalle.items.map((item) => {
                            const reactivo = esReactivo(item.tipo);
                            const unidad = unidadPorTipo(item.tipo);
                            return (
                              <div key={item.item_id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-shadow duration-200 hover:shadow-md">
                              <div className="flex flex-col space-y-3">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-base font-medium text-slate-900 leading-tight mb-1">
                                      {formatMaterialName(item.nombre_material)}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-slate-600">
                                     Pendiente: {item.cantidad}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                                        {unidad}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${reactivo ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {reactivo ? 'Reactivo' : 'Material'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-slate-700">Registro</span>
                                  {reactivo ? (
                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                      <input
                                        type="checkbox"
                                        checked={item.devuelto}
                                        onChange={e => {
                                          item.devuelto = e.target.checked;
                                          setDetalle({ ...detalle });
                                        }}
                                        className="w-4 h-4 rounded text-[#003579] focus:ring-[#003579]/40"
                                      />
                                      <span>Devuelto</span>
                                    </label>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max={item.cantidad}
                                     value={item.devolver ?? 0}
                                        onChange={e => {
                                         const val = Number(e.target.value || 0);
                                          item.devolver = Math.min(Math.max(val, 0), item.cantidad);
                                          setDetalle({ ...detalle });
                                        }}
                                        className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                                      />
                                      <span className="text-sm text-slate-400">/ {item.cantidad}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                        );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción responsivos */}
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium border border-slate-300 text-sm sm:text-base shadow-sm transition-all duration-200 hover:shadow-md order-2 sm:order-1"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#003579] text-white rounded-lg hover:bg-[#002a5e] font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5 text-sm sm:text-base transition-all duration-200 hover:shadow-lg order-1 sm:order-2"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Guardar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
