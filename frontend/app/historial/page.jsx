'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../lib/auth';

export default function Historial() {
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState('');
  const [historial, setHistorial] = useState([]);
   const [movimientos, setMovimientos] = useState([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (!usuario || usuario.rol_id !== 4) return;
    const cargar = async () => {
      try {
        const params = fecha ? `?fecha=${fecha}` : '';
       const token = localStorage.getItem('token');
        const [solRes, movRes] = await Promise.all([
          axios.get(`${baseUrl}/api/materials/solicitudes/historial${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${baseUrl}/api/materials/historial-movimientos`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setHistorial(solRes.data.historial || []);
        setMovimientos(movRes.data || []);
      } catch (err) {
        console.error('Error al cargar historial:', err);
      }
    };
    cargar();
  }, [usuario, fecha]);

  if (!usuario || usuario.rol_id !== 4) {
    return <p>Acceso denegado</p>;
  }

 return (
    <div className="p-4 space-y-6">
    <h1 className="text-2xl font-bold">Historial</h1>
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
          <h2 className="font-semibold mb-2">Movimientos de Inventario</h2>
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Material</th>
                <th className="p-2 border">Tipo</th>
                <th className="p-2 border">Movimiento</th>
                <th className="p-2 border">Cantidad</th>
                <th className="p-2 border">Usuario</th>
                <th className="p-2 border">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{m.nombre_material || 'Desconocido'}</td>
                  <td className="p-2 border capitalize">{m.tipo}</td>
                  <td className="p-2 border capitalize">{m.tipo_movimiento}</td>
                  <td className="p-2 border">{m.cantidad}</td>
                  <td className="p-2 border">{m.usuario}</td>
                  <td className="p-2 border">{new Date(m.fecha_movimiento).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex-1 overflow-x-auto">
          <h2 className="font-semibold mb-2">Solicitudes</h2>
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
        </div>
      </div>
  );
}
