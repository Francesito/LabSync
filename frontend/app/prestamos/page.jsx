'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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

const normalizeName = (name) => (name || '').replace(/_/g, ' ');

// Normaliza cadenas para búsquedas: quita acentos, convierte a minúsculas y
// reemplaza guiones bajos por espacios para hacer coincidencias más flexibles.
const normalizeSearch = (str) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ');

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
      className={`${palette} text-white text-sm rounded-lg px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </button>
  );
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

  const [showPrestamo, setShowPrestamo] = useState(false);
  const [usuariosList, setUsuariosList] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [tipoPrestamo, setTipoPrestamo] = useState('alumno');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [prestamoItems, setPrestamoItems] = useState([]);
  const [itemQuery, setItemQuery] = useState('');
  const [fechaDev, setFechaDev] = useState('');
  const [minDevDate, setMinDevDate] = useState('');
  const [pendingItem, setPendingItem] = useState(null);
  
  // Función mejorada para calcular la fecha mínima de devolución
  const computeMinDevDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Si son después de las 9 PM, empezar desde mañana
    if (currentHour >= 21) {
      now.setDate(now.getDate() + 1);
    }
    
    // Buscar el próximo día hábil
    while (now.getDay() === 0 || now.getDay() === 6) {
      now.setDate(now.getDate() + 1);
    }
    
    return now.toISOString().split('T')[0];
  };

  const handleTipoPrestamoChange = (tipo) => {
    setTipoPrestamo(tipo);
    setSelectedUser(null);
    setUserQuery('');
    setPrestamoItems([]);
    setItemQuery('');
    setFechaDev(minDevDate);
    setPendingItem(null);
  };

  useEffect(() => {
    if (!showPrestamo) return;
    const token = localStorage.getItem('token');
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/usuarios-prestamo`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUsuariosList(res.data))
      .catch(err => console.error(err));
  }, [showPrestamo]);

  useEffect(() => {
    if (!showPrestamo) return;
    const token = localStorage.getItem('token');
    const fetchItems = async () => {
      try {
        if (tipoPrestamo === 'alumno') {
          const [lab, eq] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/tipo/laboratorio`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/tipo/equipos`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          const data = [
            ...lab.data.map(m => ({ id: m.id, nombre: m.nombre, stock: m.cantidad_disponible, unidad: 'u', tipo: 'laboratorio' })),
            ...eq.data.map(m => ({ id: m.id, nombre: m.nombre, stock: m.cantidad_disponible_u, unidad: 'u', tipo: 'equipo' }))
          ];
          setItemsList(data);
        } else {
          const [liq, sol] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/tipo/liquidos`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/tipo/solidos`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          const data = [
            ...liq.data.map(m => ({ id: m.id, nombre: m.nombre, stock: m.cantidad_disponible_ml, unidad: 'ml', tipo: 'liquido' })),
            ...sol.data.map(m => ({ id: m.id, nombre: m.nombre, stock: m.cantidad_disponible_g, unidad: 'g', tipo: 'solido' }))
          ];
          setItemsList(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchItems();
  }, [showPrestamo, tipoPrestamo]);

  useEffect(() => {
    if (!showPrestamo) return;
    const min = computeMinDevDate();
    setMinDevDate(min);
    setFechaDev(min);
  }, [showPrestamo]);

  // Filtrado mejorado de usuarios - buscar por correo exacto
  const filteredUsers = usuariosList.filter(u => {
    if (!u.rol) return false;
    
    const rolMatch = u.rol.toLowerCase() === (tipoPrestamo === 'alumno' ? 'alumno' : 'docente');
    if (!rolMatch) return false;
    
    // Búsqueda exacta por correo
    if (!userQuery.trim()) return false;
    
    const queryLower = userQuery.toLowerCase();
    const correoMatch = u.correo_institucional && u.correo_institucional.toLowerCase().includes(queryLower);
    
    return correoMatch;
  });

  // Filtrado mejorado de materiales - búsqueda más precisa
  const filteredItems = itemsList.filter(item => {
    if (!itemQuery.trim()) return false;
    
    const queryNormalized = normalizeSearch(itemQuery).trim();
    const itemNameNormalized = normalizeSearch(item.nombre).trim();

    if (queryNormalized.includes(' ')) {
      return itemNameNormalized === queryNormalized;
    }

    return itemNameNormalized.includes(queryNormalized);
  });

  const handleStartAddItem = (item) => {
    setPendingItem({ ...item, cantidad: '' });
  };

  const handleConfirmAddItem = () => {
    const qty = parseInt(pendingItem.cantidad, 10);
    if (!qty || qty <= 0) return;
    if (qty > pendingItem.stock) {
      alert('Cantidad supera el stock disponible');
      return;
    }
    setPrestamoItems(prev => [...prev, { ...pendingItem, nombre: normalizeName(pendingItem.nombre), cantidad: qty }]);
    setPendingItem(null);
    setItemQuery('');
  };

  const handleFechaDevChange = (e) => {
    const v = e.target.value;
    const d = new Date(v);
    const day = d.getDay();
    if (day === 0 || day === 6) return;
    setFechaDev(v);
  };

  const handleClosePrestamo = () => {
    setShowPrestamo(false);
    setTipoPrestamo('alumno');
    setSelectedUser(null);
    setUserQuery('');
    setPrestamoItems([]);
    setItemQuery('');
    setFechaDev('');
    setPendingItem(null);
  };

  const handleGuardarPrestamo = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/materials/prestamo-inmediato`,
        {
          usuario_id: selectedUser?.id,
          tipo: tipoPrestamo,
          fecha_devolucion: fechaDev,
          items: prestamoItems.map(i => ({ id: i.id, cantidad: i.cantidad, tipo: i.tipo }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleClosePrestamo();
    } catch (err) {
      console.error(err);
      alert('Error al guardar préstamo');
    }
  };
  
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
      det.items = det.items.map(i => ({ ...i, devolver: 0, entregado: false }));
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
        .filter(item => (esAlumno ? item.devolver > 0 : item.entregado))
        .map(item => ({
          item_id: item.item_id,
          cantidad_devuelta: esAlumno
            ? item.devolver
            : item.entregado
              ? item.cantidad
              : 0,
        }));

      if (devoluciones.length === 0) {
        setSaving(false);
        return;
      }

      await registrarDevolucion(selectedSolicitud, devoluciones);

      const grouped = await loadPrestamos();
      if (!grouped.some(g => g.solicitud_id === selectedSolicitud)) {
        return closeModal();
      }

      const nuevoDetalle = await obtenerDetalleSolicitud(selectedSolicitud);
      nuevoDetalle.items = nuevoDetalle.items.map(i => ({
        ...i,
        devolver: 0,
        entregado: false,
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
      {/* Header Responsivo */}
      <div className="bg-[#003579] text-white px-3 py-6 sm:px-4 sm:py-8 lg:px-8 lg:py-12">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-[#002e63] rounded-lg sm:rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">Préstamos Entregados</h1>
            <p className="text-slate-200 mt-1 sm:mt-2 text-sm sm:text-base">Gestiona las devoluciones de materiales</p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 lg:p-8">
        {/* Barra de búsqueda y filtros responsiva */}
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Campo de búsqueda */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por folio o nombre..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Botones de estado - en una fila en móvil */}
           <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full">
              <button
                onClick={() => setStatusFilter(statusFilter === 'vencidas' ? '' : 'vencidas')}
                className={`px-3 py-2 text-xs sm:text-sm rounded-lg border flex-1 sm:flex-none whitespace-nowrap ${statusFilter === 'vencidas' ? 'bg-[#003579] text-white' : 'bg-white text-[#003579]'}`}
              >
                Vencidas
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'proximas' ? '' : 'proximas')}
                className={`px-3 py-2 text-xs sm:text-sm rounded-lg border flex-1 sm:flex-none whitespace-nowrap ${statusFilter === 'proximas' ? 'bg-[#003579] text-white' : 'bg-white text-[#003579]'}`}
              >
                Próximas a vencer
              </button>
               <div className="ml-auto">
                <Btn color="green" icon="⚡" onClick={() => setShowPrestamo(true)}>
                  Préstamo inmediato
                </Btn>
              </div>
            </div>

            {/* Select de grupo y botón limpiar en segunda fila en móvil */}
            <div className="flex gap-2">
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-[#003579] text-xs sm:text-sm flex-1 sm:min-w-[180px] bg-white"
              >
                <option value="">Todos los grupos</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs sm:text-sm rounded-lg border bg-white text-[#003579] whitespace-nowrap"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {sorted.map((sol) => {
            const overdue = isOverdue(sol.fecha_devolucion);
            const nombre = sol.nombre_alumno || sol.profesor;

            return (
              <div
                key={sol.solicitud_id}
                onClick={() => openModal(sol.solicitud_id)}
                className={`bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 border-2 active:scale-95 ${overdue ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-[#002e63] rounded-lg sm:rounded-xl flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-slate-400">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
                      {sol.folio}
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium truncate">{nombre}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600">
                      Devolver: {formatDate(sol.fecha_devolucion)}
                    </div>
                    {overdue && (
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          ⚠️ Vencido
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInformar(sol.solicitud_id); }}
                          disabled={informados.includes(sol.solicitud_id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50 hover:bg-red-700 transition-colors w-full xs:w-auto"
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
            <div className="p-3 sm:p-4 bg-slate-100 rounded-xl w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-2 sm:p-4">
         <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header del Modal Responsivo */}
            <div className="bg-[#003579] text-white px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="p-1.5 sm:p-2 bg-[#002e63] rounded-lg sm:rounded-xl flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold truncate">Detalle del Préstamo</h2>
                </div>
                <button 
                  onClick={closeModal} 
                  className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg p-2 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 80px)' }}>
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
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-[#002e63] rounded-lg flex-shrink-0">  
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H5C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H17M7 4H17" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs text-slate-500 uppercase font-medium">Folio</span>
                          <span className="block font-bold text-sm text-slate-800 truncate">{detalle.folio}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-[#002e63] rounded-lg flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs text-slate-500 uppercase font-medium">Recolección</span>
                          <span className="block font-bold text-sm text-slate-800 truncate">
                            {formatDate(detalle.fecha_recoleccion)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {detalle.nombre_alumno && (
                      <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-[#002e63] rounded-lg flex-shrink-0">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs text-slate-500 uppercase font-medium">Alumno</span>
                         <span className="block font-bold text-sm text-slate-800 break-words">{detalle.nombre_alumno}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {detalle.profesor && (
                      <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-[#002e63] rounded-lg flex-shrink-0">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs text-slate-500 uppercase font-medium">Profesor</span>
                             <span className="block font-bold text-sm text-slate-800 break-words">{detalle.profesor}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formulario Responsivo Mejorado */}
                  <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
                      <div className="bg-slate-50 px-3 sm:px-4 py-2 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Materiales por Devolver</span>
                        </h3>
                      </div>

                      {/* Tabla Responsiva Mejorada */}
                      <div className="overflow-x-auto">
                        {/* Vista Desktop - Tabla compacta */}
                        <div className="hidden lg:block">
                          <table className="table-auto w-auto mx-auto">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  {detalle.nombre_alumno ? 'Devolver' : 'Entregado'}
                                </th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Material
                                </th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Total
                                </th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Unidad
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {detalle.items.map((item) => (
                                <tr key={item.item_id} className="hover:bg-slate-50">
                                  <td className="px-2 py-2">
                                    {detalle.nombre_alumno ? (
                                      <div className="flex items-center justify-center space-x-1">
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
                                          className="w-10 border border-slate-300 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                                        />
                                        <span className="text-xs text-slate-400">/{item.cantidad}</span>
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
                                          className="w-4 h-4"
                                        />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex items-center space-x-2">
                                      <div className="p-1 bg-slate-100 rounded flex-shrink-0">
                                        <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-slate-900 leading-tight truncate">
                                          {formatMaterialName(item.nombre_material)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="text-xs font-medium text-slate-900">{item.cantidad}</span>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                      {item.tipo === 'liquido' ? 'ml' : item.tipo === 'solido' ? 'g' : 'u'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Vista Tablet - Tabla más compacta */}
                        <div className="hidden md:block lg:hidden">
                          <table className="w-full">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  {detalle.nombre_alumno ? 'Dev.' : 'Ent.'}
                                </th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Material
                                </th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Total
                                </th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Und
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {detalle.items.map((item) => (
                                <tr key={item.item_id} className="hover:bg-slate-50">
                                  <td className="px-2 py-2">
                                    {detalle.nombre_alumno ? (
                                      <div className="flex items-center justify-center space-x-1">
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
                                          className="w-10 border border-slate-300 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                                        />
                                        <span className="text-xs text-slate-400">/{item.cantidad}</span>
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
                                          className="w-4 h-4"
                                        />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex items-center space-x-2">
                                      <div className="p-1 bg-slate-100 rounded flex-shrink-0">
                                        <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-slate-900 leading-tight truncate">
                                          {formatMaterialName(item.nombre_material)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="text-xs font-medium text-slate-900">{item.cantidad}</span>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                      {item.tipo === 'liquido' ? 'ml' : item.tipo === 'solido' ? 'g' : 'u'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Vista Móvil Compacta */}
                        <div className="block md:hidden">
                          <div className="space-y-2 p-2">
                            {detalle.items.map((item) => (
                              <div key={item.item_id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0 mr-3">
                                    <div className="p-1 bg-slate-100 rounded flex-shrink-0">
                                      <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-medium text-slate-900 leading-tight mb-1">
                                        {formatMaterialName(item.nombre_material)}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-slate-600">
                                          {item.cantidad}
                                        </span>
                                        <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                                          {item.tipo === 'liquido' ? 'ml' : item.tipo === 'solido' ? 'g' : 'u'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex-shrink-0">
                                    {detalle.nombre_alumno ? (
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 font-medium mb-1">Devolver</div>
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
                                          className="w-12 border border-slate-300 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 font-medium mb-1">Entregado</div>
                                        <input
                                          type="checkbox"
                                          checked={item.entregado}
                                          onChange={e => {
                                            item.entregado = e.target.checked;
                                            setDetalle({ ...detalle });
                                          }}
                                          className="w-4 h-4"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción responsivos */}
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium border border-slate-300 text-sm order-2 sm:order-1"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-4 py-2 bg-[#003579] text-white rounded-lg hover:bg-[#002a5e] font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm order-1 sm:order-2"
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

      {/* Modal de Préstamo Inmediato */}
      {showPrestamo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Préstamo Inmediato</h3>
              <button 
                onClick={handleClosePrestamo}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Selector de tipo de préstamo */}
            <div className="flex gap-2 mb-4">
              <Btn 
                color={tipoPrestamo === 'alumno' ? 'blue' : 'gray'} 
                onClick={() => handleTipoPrestamoChange('alumno')}
              >
                Alumno
              </Btn>
              <Btn 
                color={tipoPrestamo === 'docente' ? 'blue' : 'gray'} 
                onClick={() => handleTipoPrestamoChange('docente')}
              >
                Docente
              </Btn>
            </div>

            {/* Selector de usuario */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-slate-700">
                {tipoPrestamo === 'alumno' ? 'Alumno' : 'Docente'}
              </label>
              <input
                type="text"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar por correo institucional..."
              />
              {userQuery && filteredUsers.length > 0 && (
                <div className="border border-slate-200 rounded-lg mt-2 max-h-40 overflow-y-auto bg-white shadow-lg">
                  {filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      onClick={() => { 
                        setSelectedUser(u); 
                        setUserQuery(''); 
                      }}
                    >
                      <div className="font-medium text-slate-900">{u.nombre}</div>
                      <div className="text-sm text-slate-600">{u.correo_institucional}</div>
                      {tipoPrestamo === 'alumno' && u.grupo_nombre && (
                        <div className="text-xs text-slate-500">Grupo: {u.grupo_nombre}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {userQuery && filteredUsers.length === 0 && (
                <div className="text-sm text-slate-500 mt-2">No se encontraron usuarios</div>
              )}
              
              {/* Usuario seleccionado */}
              {selectedUser && (
                <div className="mt-3 inline-flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm">
                  <div>
                    <span className="font-medium">{selectedUser.nombre}</span>
                    {tipoPrestamo === 'alumno' && selectedUser.grupo_nombre && (
                      <span className="text-blue-600"> - {selectedUser.grupo_nombre}</span>
                    )}
                  </div>
                  <button 
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    onClick={() => setSelectedUser(null)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Selector de materiales */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-slate-700">
                {tipoPrestamo === 'alumno' ? 'Materiales de Laboratorio' : 'Reactivos'}
              </label>
              <input
                type="text"
                value={itemQuery}
                onChange={e => { 
                  setItemQuery(e.target.value); 
                  setPendingItem(null); 
                }}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar materiales..."
              />
              {itemQuery && filteredItems.length > 0 && (
                <div className="border border-slate-200 rounded-lg mt-2 max-h-40 overflow-y-auto bg-white shadow-lg">
                  {filteredItems.map(item => (
                    <div key={item.id} className="px-3 py-2 flex justify-between items-center hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{normalizeName(item.nombre)}</div>
                        <div className="text-sm text-slate-600">Stock: {item.stock} {item.unidad}</div>
                      </div>
                      {pendingItem && pendingItem.id === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={pendingItem.cantidad}
                            onChange={e => setPendingItem({ ...pendingItem, cantidad: e.target.value })}
                            className="w-20 border border-slate-300 px-2 py-1 rounded text-sm"
                            placeholder="Cant."
                            autoFocus
                          />
                          <button 
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                            onClick={handleConfirmAddItem}
                          >
                            ✓
                          </button>
                          <button 
                            className="text-slate-400 hover:text-slate-600 text-sm"
                            onClick={() => setPendingItem(null)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded"
                          onClick={() => handleStartAddItem(item)}
                        >
                          Agregar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {itemQuery && filteredItems.length === 0 && (
                <div className="text-sm text-slate-500 mt-2">No se encontraron materiales</div>
              )}
              
              {/* Materiales seleccionados */}
              {prestamoItems.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">Materiales seleccionados:</div>
                  <div className="flex flex-wrap gap-2">
                    {prestamoItems.map((item, idx) => (
                      <div key={idx} className="inline-flex items-center bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm">
                        <span>{normalizeName(item.nombre)} - {item.cantidad} {item.unidad}</span>
                        <button 
                          className="ml-2 text-slate-500 hover:text-slate-700"
                          onClick={() => setPrestamoItems(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fecha de devolución */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-slate-700">Fecha de devolución</label>
              <input
                type="date"
                value={fechaDev}
                min={minDevDate}
                onChange={handleFechaDevChange}
                className="border border-slate-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-xs text-slate-500 mt-1">
                Solo días hábiles. No se permiten préstamos después de las 9 PM para el día actual.
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3">
              <Btn color="gray" onClick={handleClosePrestamo}>
                Cancelar
              </Btn>
              <Btn
                color="green"
                onClick={handleGuardarPrestamo}
                disabled={!selectedUser || prestamoItems.length === 0 || !fechaDev}
              >
                Guardar Préstamo
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
