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
      <p className="text-gray-600">No hay notificaciones.</p>
      ) : (
        <ul className="space-y-4">
          {notificaciones.map((n) => (
          <li
              key={n.id}
              className="bg-white shadow border-l-4 border-[#00BCD4] rounded p-4 flex justify-between items-start"
            >
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-[#00BCD4] mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">{n.mensaje}</p>
                  <p className="text-xs text-gray-500">{new Date(n.fecha).toLocaleString()}</p>
                </div>
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
