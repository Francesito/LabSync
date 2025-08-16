'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../lib/auth';
import EstadisticasChart from '../../components/EstadisticasChart';

export default function Historial() {
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState('');
  const [historial, setHistorial] = useState([]);
  const [stats, setStats] = useState([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (!usuario || usuario.rol_id !== 4) return;
    const cargar = async () => {
      try {
        const params = fecha ? `?fecha=${fecha}` : '';
        const { data } = await axios.get(`${baseUrl}/api/materials/solicitudes/historial${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setHistorial(data.historial || []);
        setStats(data.estadisticas || []);
      } catch (err) {
        console.error('Error al cargar historial:', err);
      }
    };
    cargar();
  }, [usuario, fecha]);

  if (!usuario || usuario.rol_id !== 4) {
    return <p>Acceso denegado</p>;
  }

  const labels = stats.map(s => {
    const [year, month] = s.mes.split('-');
    const d = new Date(year, month - 1);
    return d.toLocaleDateString('es-MX', { month: 'long' });
  });
  const valores = stats.map(s => s.total);

  let analisis = '';
  if (valores.length >= 2) {
    const prev = valores[valores.length - 2];
    const curr = valores[valores.length - 1];
    if (prev === 0) {
      analisis = 'Sin datos del mes pasado';
    } else {
      const diff = ((curr - prev) / prev) * 100;
      const abs = Math.abs(diff).toFixed(2);
      analisis = `${abs}% ${diff >= 0 ? 'más' : 'menos'} peticiones que el mes pasado`;
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Historial de Solicitudes</h1>
      <div>
        <label className="block mb-1 font-medium">Filtrar por fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
    <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Folio</th>
                <th className="p-2 border">Solicitante</th>
                <th className="p-2 border">Encargado</th>
                <th className="p-2 border">Recolección</th>
                <th className="p-2 border">Devolución</th>
                <th className="p-2 border">Estado</th>
                <th className="p-2 border">Materiales</th>
                <th className="p-2 border">Grupo</th>
              </tr>
          </thead>
            <tbody>
              {historial.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{h.folio}</td>
                  <td className="p-2 border">{h.solicitante}</td>
                  <td className="p-2 border">{h.encargado}</td>
                  <td className="p-2 border">{new Date(h.fecha_recoleccion).toLocaleDateString()}</td>
                  <td className="p-2 border">{h.fecha_devolucion ? new Date(h.fecha_devolucion).toLocaleDateString() : '-'}</td>
                  <td className="p-2 border capitalize">{h.estado}</td>
                  <td className="p-2 border">{h.materiales}</td>
                  <td className="p-2 border">{h.grupo || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-full md:w-1/3">
          <EstadisticasChart datos={{ labels, valores }} className="h-40" />
          {analisis && <p className="mt-2 text-sm text-gray-600">{analisis}</p>}
        </div>
      </div>
    </div>
  );
}
