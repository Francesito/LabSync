'use client';
import { useEffect } from 'react';
import { useAuth } from '../../lib/auth';

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center bg-white">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-primary">Cerrando sesión...</p>
      </div>
    </div>
  );
}
