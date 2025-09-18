// frontend/lib/auth.js
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://labsync-1090.onrender.com';

axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

const RUTAS_PUBLICAS = ['/login', '/register', '/forgot-password', '/logout'];
const esRutaPublica = pathname =>
  RUTAS_PUBLICAS.includes(pathname) ||
  pathname.startsWith('/reset-password') ||
  pathname.startsWith('/verificar');

const normalizarRol = rolId => {
  switch (Number(rolId)) {
    case 1:
      return 'alumno';
    case 2:
      return 'docente';
    case 3:
      return 'almacen';
    case 4:
      return 'administrador';
    default:
      return 'desconocido';
  }
};

const estadoInicialPermisos = {
  acceso_chat: false,
  modificar_stock: false,
  rol: null,
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [permissions, setPermissions] = useState(estadoInicialPermisos);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const limpiarSesion = () => {
    setUsuario(null);
       setPermissions(estadoInicialPermisos);
  };

    const fetchPermissions = async () => {
    try {
  const [chatRes, stockRes] = await Promise.all([
        axios.get(`${API_BASE}/api/auth/permisos-chat`),
        axios.get(`${API_BASE}/api/auth/permisos-stock`),
      ]);
      setPermissions({
       acceso_chat: Boolean(chatRes.data?.acceso_chat),
        modificar_stock: Boolean(stockRes.data?.modificar_stock),
        rol: stockRes.data?.rol || chatRes.data?.rol || null,
      });
    } catch (err) {
      console.error('Error cargando permisos:', err);
     if (err.response?.status === 401) {
        limpiarSesion();
      }
    }
  };

 const construirUsuario = data => {
    if (!data) return null;
    return {
      id: data.id,
      nombre: data.nombre,
      correo: data.correo || data.correo_institucional,
      rol_id: Number(data.rol_id),
      rol: data.rol || normalizarRol(data.rol_id),
      grupo_id: data.grupo_id ?? null,
      grupo: data.grupo_nombre || data.grupo || null,
      numero_expediente: data.numero_expediente ?? null,
    };
  };

    useEffect(() => {
    let activo = true;
    const cargarSesion = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/api/auth/session`);
        if (!activo) return;
        const usuarioNormalizado = construirUsuario(data.usuario);
        setUsuario(usuarioNormalizado);
        await fetchPermissions();

        if (esRutaPublica(pathname)) {
          router.replace('/catalog');
          return;
        }
        
     if (
          usuarioNormalizado &&
          (usuarioNormalizado.rol === 'alumno' || usuarioNormalizado.rol === 'almacen') &&
          pathname === '/solicitudes/pendientes'
        ) {
          router.replace('/solicitudes');
          return;
        }

    if (usuarioNormalizado && usuarioNormalizado.rol !== 'administrador' && pathname === '/configuracion') {
          router.replace('/catalog');
        }
      } catch (error) {
        if (!activo) return;
        limpiarSesion();
        if (!esRutaPublica(pathname)) {
          router.replace('/login');
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

      cargarSesion();
      
return () => {
      activo = false;
    };
  }, [pathname]);

    const login = async (correo, contrasena) => {
    const response = await axios.post(
      `${API_BASE}/api/auth/login`,
      { correo_institucional: correo, contrasena },
      { withCredentials: true }
    );
      
      const usuarioNormalizado = construirUsuario(response.data?.usuario);
    setUsuario(usuarioNormalizado);
    await fetchPermissions();
    router.replace('/catalog');
    return true;
  };

       const logout = async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`, {});
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      limpiarSesion();
      router.replace('/login');
    }
  };

   const contextValue = useMemo(
    () => ({
      usuario,
      permissions,
      setUsuario,
      login,
      logout,
      loading,
    }),
    [usuario, permissions, loading]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
  <AuthContext.Provider value={contextValue}>
      <div className="flex min-h-screen">
        <main className="flex-1 bg-light p-1">{children}</main>
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
