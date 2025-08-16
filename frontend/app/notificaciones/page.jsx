'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../lib/auth';

export default function Notificaciones() {
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (!usuario) return;
    const cargar = async () => {
      try {
        const { data } = await axios.get(
         `${baseUrl}/api/notificaciones`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setNotificaciones(data);
      } catch (err) {
        console.error('Error al cargar notificaciones:', err);
      }
    };
    cargar();
  }, [usuario]);

  const eliminar = async (id) => {
    try {
      await axios.delete(`${baseUrl}/api/notificaciones/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
    }
  };

  if (!usuario) return null;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Notificaciones</h1>
      {notificaciones.length === 0 ? (
        <p>No hay notificaciones.</p>
      ) : (
        <ul className="space-y-4">
          {notificaciones.map((n) => (
            <li key={n.id} className="border rounded p-4 flex justify-between items-start">
              <div>
                <p className="font-medium">{n.mensaje}</p>
                <p className="text-sm text-gray-500">
                  {new Date(n.fecha).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => eliminar(n.id)}
                className="text-red-500 hover:text-red-700"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
