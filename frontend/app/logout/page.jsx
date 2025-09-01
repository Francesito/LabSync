'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';

export default function LogoutPage() {
  const router = useRouter();
  const { setUsuario } = useAuth();

  useEffect(() => {
    localStorage.removeItem('token');
    if (setUsuario) setUsuario(null);
    const timeout = setTimeout(() => router.replace('/login'), 1500);
    return () => clearTimeout(timeout);
  }, [router, setUsuario]);

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center bg-white">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-primary">Cerrando sesión...</p>
      </div>
    </div>
  );
}