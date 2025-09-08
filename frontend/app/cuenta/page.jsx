'use client';
import { useAuth } from '../../lib/auth';
import { useState } from 'react';
import axios from 'axios';

export default function Cuenta() {
  const { usuario, setUsuario, logout } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [mensaje, setMensaje] = useState('');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const handleActualizar = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(
        `${baseUrl}/api/usuarios/nombre`,
        { nombre },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setUsuario({ ...usuario, nombre: data.nombre });
      setMensaje(data.mensaje);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al actualizar nombre');
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible.')) return;
    try {
      await axios.delete(`${baseUrl}/api/usuarios/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      logout();
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al eliminar cuenta');
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h1 className="text-3xl fw-bold mb-4 text-dark">Cuenta</h1>

      <div className="bg-light p-4 rounded shadow mb-4">
        <h2 className="text-xl fw-semibold mb-3 text-dark">Información</h2>
        <ul className="list-group list-group-flush">
          <li className="list-group-item bg-white"><strong>Nombre:</strong> {usuario?.nombre}</li>
          <li className="list-group-item bg-white"><strong>Correo:</strong> {usuario?.correo}</li>
          {usuario?.rol_id === 1 && (
            <li className="list-group-item bg-white"><strong>Grupo:</strong> {usuario?.grupo}</li>
          )}
        </ul>
      </div>

      <form onSubmit={handleActualizar} className="bg-light p-4 rounded shadow mb-4">
        <h2 className="text-xl fw-semibold mb-3 text-dark">Cambiar nombre</h2>
        <div className="mb-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="form-control"
          />
        </div>
        <button type="submit" className="btn btn-primary">Guardar</button>
      </form>

      <button onClick={handleEliminar} className="btn btn-danger">Eliminar cuenta</button>

      {mensaje && <p className="mt-3 text-danger">{mensaje}</p>}
    </div>
  );
}

