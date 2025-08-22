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
    det.items = det.items.map(i => ({ ...i, devolver: 0, entregado: false, estado: {} }));
      setDetalle(det);
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
const esAlumno = !!detalle.nombre_alumno;
    const devoluciones = detalle.items
   .filter(item =>
        esAlumno
          ? item.devolver > 0 || (item.estado?.tipo && item.estado?.numero)
          : item.entregado || (item.estado?.tipo && item.estado?.numero)
      )
      .map(item => ({
        item_id: item.item_id,
       cantidad_devuelta: esAlumno
          ? item.devolver
          : item.entregado
            ? item.cantidad
            : 0,
        ...(item.estado?.tipo && item.estado?.numero ? { estado: item.estado } : {}),
      }));

 if (devoluciones.length === 0) {
      setSaving(false);
      return;
    }

      await registrarDevolucion(selectedSolicitud, devoluciones);

    const estadoMap = detalle.items.reduce((acc, it) => {
      if (it.estado?.tipo && it.estado?.numero) {
        acc[it.item_id] = it.estado;
      }
      return acc;
    }, {});

    const grouped = await loadPrestamos();
    if (!grouped.some(g => g.solicitud_id === selectedSolicitud)) {
      return closeModal();
    }

    const nuevoDetalle = await obtenerDetalleSolicitud(selectedSolicitud);
     nuevoDetalle.items = nuevoDetalle.items.map(i => ({
      ...i,
      devolver: 0,
      entregado: false,
      estado: estadoMap[i.item_id] || {},
    }));
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
      {/* Header */}
          <div className="bg-[#003579] text-white px-4 py-8 lg:px-8 lg:py-12">
        <div className="flex items-center space-x-4">
        <div className="p-3 bg-[#002e63] rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold">Préstamos Entregados</h1>
            <p className="text-slate-200 mt-2">Gestiona las devoluciones de materiales</p>
          </div>
        </div>
      </div>

      <div className="p-8">
       {/* Barra de búsqueda y filtros */}
        <div className="mb-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por folio o nombre..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>
           <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter(statusFilter === 'vencidas' ? '' : 'vencidas')}
              className={`px-4 py-2 rounded-xl border ${statusFilter === 'vencidas' ? 'bg-[#003579] text-white' : 'bg-white text-[#003579]'}`}
            >
              Vencidas
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'proximas' ? '' : 'proximas')}
              className={`px-4 py-2 rounded-xl border ${statusFilter === 'proximas' ? 'bg-[#003579] text-white' : 'bg-white text-[#003579]'}`}
            >
              Próximas a vencer
            </button>
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="border rounded-xl px-3 py-2 text-[#003579]"
            >
              <option value="">Selecciona un grupo</option>
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
             <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl border bg-white text-[#003579]"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600"></div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sorted.map((sol) => {
            const overdue = isOverdue(sol.fecha_devolucion);
            const nombre = sol.nombre_alumno || sol.profesor;

            return (
              <div
                key={sol.solicitud_id}
                onClick={() => openModal(sol.solicitud_id)}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-shadow duration-200 border-2 ${overdue ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-[#002e63] rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-slate-800">
                      {sol.folio}
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium">{nombre}</span>
                    </div>
                    <div className="text-sm text-slate-600">Devolver: {formatDate(sol.fecha_devolucion)}</div>
                    {overdue && (
                       <div className="flex items-center gap-2">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          ⚠️ Vencido
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInformar(sol.solicitud_id); }}
                          disabled={informados.includes(sol.solicitud_id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
                        >
                          Informar
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
          <div className="text-center py-16">
            <div className="p-4 bg-slate-100 rounded-xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No hay préstamos</h3>
            <p className="text-slate-500">No se encontraron préstamos entregados</p>
          </div>
        )}
      </div>

      {/* Modal Mejorado y Compacto */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-11/12 lg:w-3/4 xl:w-2/3 max-w-4xl max-h-[85vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="bg-[#003579] text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                 <div className="p-2 bg-[#002e63] rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold">Detalle del Préstamo</h2>
                </div>
                <button 
                  onClick={closeModal} 
                  className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              {/* Loading state en el modal */}
              {!detalle ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600 mx-auto mb-3"></div>
                    <p className="text-slate-600">Cargando detalles del préstamo...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Info Cards Compactas en una sola fila */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                    <div className="p-1 bg-[#002e63] rounded-lg">  
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H5C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H17M7 4H17" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs text-slate-500 uppercase font-medium">Folio</span>
                          <span className="block font-bold text-sm text-slate-800 truncate">{detalle.folio}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                     <div className="p-1 bg-[#002e63] rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                         <span className="block text-xs text-slate-500 uppercase font-medium">Recolección</span>
                          <span className="block font-bold text-sm text-slate-800 truncate">
                         {formatDate(detalle.fecha_recoleccion)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {detalle.nombre_alumno && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-[#002e63] rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs text-slate-500 uppercase font-medium">Alumno</span>
                            <span className="block font-bold text-sm text-slate-800 truncate">{detalle.nombre_alumno}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {detalle.profesor && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                        <div className="p-1 bg-[#002e63] rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs text-slate-500 uppercase font-medium">Profesor</span>
                            <span className="block font-bold text-sm text-slate-800 truncate">{detalle.profesor}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formulario Compacto */}
                  <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h3 className="text-md font-semibold text-slate-800 flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Materiales por Devolver</span>
                        </h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                             {detalle.nombre_alumno ? 'Cantidad devuelta' : 'Entregado'}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Material
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Unidad
                              </th>
                              {detalle.nombre_alumno && (
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Estado
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {detalle.items.map((item) => (
                              <tr key={item.item_id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  {detalle.nombre_alumno ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max={item.cantidad}
                                        value={item.devolver}
                                        onChange={e => {
                                          const val = parseInt(e.target.value || '0', 10);
                                          item.devolver = Math.min(Math.max(val, 0), item.cantidad);
                                          setDetalle({ ...detalle });
                                        }}
                                        className="w-16 border border-slate-300 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                      />
                                      <span className="text-xs text-slate-500">/{item.cantidad}</span>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <input
                                        type="checkbox"
                                        checked={item.entregado}
                                        onChange={e => {
                                          item.entregado = e.target.checked;
                                          setDetalle({ ...detalle });
                                        }}
                                      />
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1 bg-slate-100 rounded-lg">
                                      <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-slate-900 truncate">
                                        {formatMaterialName(item.nombre_material)}
                                      </div>
                                       {item.estado?.tipo && item.estado?.numero && (
                                        <span
                                          className={`mt-1 inline-block px-2 py-1 rounded text-xs font-medium ${
                                            item.estado.tipo === 'danado'
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {item.estado.tipo === 'danado' ? 'Dañado' : 'Extraviado'} {item.estado.numero}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-sm font-medium text-slate-900">{item.cantidad}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    {item.tipo === 'liquido' ? 'ml' : item.tipo === 'solido' ? 'g' : 'u'}
                                  </span>
                                </td>
                                 {detalle.nombre_alumno && (
                                  <td className="px-4 py-3">
                                    {item.tipo !== 'liquido' && item.tipo !== 'solido' ? (
                                      <div className="flex items-center space-x-2">
                                        <select
                                          value={item.estado?.tipo || ''}
                                          onChange={e => {
                                            item.estado = { tipo: e.target.value, numero: '' };
                                            setDetalle({ ...detalle });
                                          }}
                                          className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                                        >
                                          <option value="">Estado</option>
                                          <option value="danado">Dañado</option>
                                          <option value="extraviado">Extraviado</option>
                                        </select>
                                        {item.estado?.tipo && (
                                          <select
                                            value={item.estado.numero || ''}
                                            onChange={e => {
                                              item.estado = { ...item.estado, numero: e.target.value };
                                              setDetalle({ ...detalle });
                                            }}
                                            className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                                          >
                                            <option value="">#</option>
                                            {Array.from({ length: item.cantidad }, (_, i) => i + 1).map(n => (
                                              <option key={n} value={n}>{n}</option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-500">—</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Botones de acción compactos */}
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium border border-slate-300 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 bg-[#003579] text-white rounded-lg hover:bg-[#002a5e] font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                        >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
