'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../lib/auth';
import EstadisticasChart from '../../components/EstadisticasChart';

export default function Historial() {
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [historial, setHistorial] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [estadisticasSolicitudes, setEstadisticasSolicitudes] = useState({ labels: [], valores: [] });
  const [estadisticasMovimientos, setEstadisticasMovimientos] = useState({ labels: [], valores: [] });
  const [vista, setVista] = useState('solicitudes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  };

  const getEstadoBadgeClass = (estado) => {
    const classes = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'aprobada': 'bg-blue-100 text-blue-800',
      'entregado': 'bg-green-100 text-green-800',
      'devuelto parcial': 'bg-orange-100 text-orange-800',
      'devuelto total': 'bg-gray-100 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return classes[estado] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
 // Verificar permisos - almacén (3) o administradores (4)
    if (!usuario || ![3, 4].includes(usuario.rol_id)) {
      setError('Acceso denegado. Solo administradores o almacenistas pueden ver el historial.');
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token no encontrado');
        }

        const headers = { Authorization: `Bearer ${token}` };
       const params = new URLSearchParams();
        if (fecha) params.append('fecha', fecha);
        if (busqueda) params.append('busqueda', busqueda);
        const query = params.toString() ? `?${params.toString()}` : '';

        console.log('Cargando datos del historial...');

        const solicitudesPromise = axios.get(
         `${baseUrl}/api/materials/solicitudes/historial${query}`,
          { headers }
        );

        const movimientosPromise = axios.get(
         `${baseUrl}/api/materials/historial-movimientos${query}`,
          { headers }
        );

        const [solRes, movRes] = await Promise.all([
          solicitudesPromise,
          movimientosPromise
        ]);

        const historialData = solRes.data.historial || [];
        const estadisticasSol = solRes.data.estadisticas || [];
        const movimientosData = movRes.data.movimientos || movRes.data || [];
        const estadisticasMov = movRes.data.estadisticas || [];

        setHistorial(historialData);
        setMovimientos(movimientosData);
        setEstadisticasSolicitudes({
          labels: estadisticasSol.map(s => s.mes || ''),
          valores: estadisticasSol.map(s => s.total || 0)
        });
        setEstadisticasMovimientos({
          labels: estadisticasMov.map(m => m.mes || ''),
          valores: estadisticasMov.map(m => m.total || 0)
        });

        console.log(`Historial cargado: ${historialData.length} solicitudes`);
        console.log(`Movimientos cargados: ${movimientosData.length || 0} registros`);
      } catch (err) {
        console.error('Error al cargar datos del historial:', err);
        setError(err.response?.data?.error || err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
     }, [usuario, fecha, busqueda, baseUrl]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Cargando historial...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-700 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  // Verificación adicional por si acaso
  if (!usuario || ![3, 4].includes(usuario.rol_id)) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-800 font-medium">Acceso Denegado</div>
          <div className="text-yellow-700 mt-1">Solo administradores o almacenistas pueden ver el historial del sistema.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Historial del Sistema</h1>
        <div className="text-sm text-gray-600">
          {historial.length} solicitudes • {movimientos.length} movimientos
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block mb-1 font-medium text-sm">Filtrar por fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Nombre o grupo"
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {(fecha || busqueda) && (
            <button
             onClick={() => { setFecha(''); setBusqueda(''); }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* Botones de vista */}
      <div className="flex gap-4">
        <button
          onClick={() => setVista('solicitudes')}
          className={`px-4 py-2 rounded ${vista === 'solicitudes' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Solicitudes
        </button>
        <button
          onClick={() => setVista('movimientos')}
          className={`px-4 py-2 rounded ${vista === 'movimientos' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Movimientos de Inventario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {vista === 'solicitudes' ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="font-semibold text-lg">Historial de Solicitudes</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {historial.length} solicitudes encontradas
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encargado</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recolección</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devolución</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materiales</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historial.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                          No se encontraron solicitudes
                        </td>
                      </tr>
                  ) : (
                      historial.map(h => (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{h.folio}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{h.nombre_display || h.solicitante}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{h.encargado}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatearFecha(h.fecha_recoleccion)}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatearFecha(h.fecha_devolucion)}</td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeClass(h.estado)}`}>
                              {h.estado}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={h.materiales}>{h.materiales || 'Sin materiales'}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{h.grupo || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
           ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="font-semibold text-lg">Movimientos de Inventario</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {movimientos.length} movimientos registrados
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                     <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movimiento</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                    </tr>
                   </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movimientos.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                          No se encontraron movimientos
                        </td>
                      </tr>
                    ) : (
                      movimientos.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{m.nombre_material || 'Material Desconocido'}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{m.tipo}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{m.tipo_movimiento}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={m.cantidad > 0 ? 'text-green-600' : 'text-red-600'}>
                              {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{m.usuario || 'Sistema'}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatearFecha(m.fecha_movimiento)}</td>
                          <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={m.motivo}>{m.motivo || '-'}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
         )}
        </div>

       <div>
          {vista === 'solicitudes' ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-4">Estadísticas de Solicitudes</h3>
              {estadisticasSolicitudes.labels.length > 0 ? (
                <EstadisticasChart datos={estadisticasSolicitudes} label="Solicitudes por Mes" className="h-64" />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">Sin datos para mostrar</div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-4">Estadísticas de Movimientos</h3>
              {estadisticasMovimientos.labels.length > 0 ? (
                <EstadisticasChart datos={estadisticasMovimientos} label="Movimientos por Mes" className="h-64" />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">Sin datos para mostrar</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
