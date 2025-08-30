'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Overlay azul que se "derrite" al entrar/recargar
  const [showMelt, setShowMelt] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowMelt(false), 1800); // dura lo mismo que la animación
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        correo_institucional: correo,
        contrasena,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('nombre', data.nombre);
      setRedirecting(true);
      router.replace('/catalog');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  if (redirecting) return <div className="min-vh-100 bg-white" />;

  return (
    <>
      {/* Overlay Azul que se derrite */}
      {showMelt && <div className="melt-overlay" aria-hidden="true"></div>}

      <div className="main-container">
        <div className="min-vh-100 d-flex">
          <div className="row w-100 m-0 min-vh-100">
            {/* IZQUIERDA: círculos y bienvenida */}
            <div className="col-12 col-lg-7 position-relative p-0 blue-panel">
              {/* Círculo grande de fondo */}
              <div className="circle-big" />
              {/* Dos círculos pequeños por encima del grande en la parte inferior */}
              <div className="circle-small left" />
              <div className="circle-small right" />

              <div className="content-wrapper">
                <div className="text-content">
                  <h1 className="welcome-title">BIENVENIDO</h1>
                  <h2 className="headline">AQUÍ VA TU ENCABEZADO</h2>
                  <p className="description">
                    Texto de bienvenida breve para tu plataforma. Puedes describir
                    beneficios o instrucciones iniciales en dos o tres líneas para
                    mantener el equilibrio visual con el diseño.
                  </p>
                </div>
              </div>
            </div>

            {/* DERECHA: formulario */}
            <div className="col-12 col-lg-5 d-flex flex-column justify-content-center align-items-start bg-white p-5 form-section position-relative">
              {/* Círculo decorativo en el extremo inferior derecho del panel derecho */}
              <div className="form-bottom-circle"></div>

              <div className="form-container">
                <div className="mb-4">
                  <h2 className="form-title">Iniciar sesión</h2>
                  <p className="form-subtitle">Accede con tu correo institucional y contraseña</p>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Usuario */}
                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-person-fill input-icon"></i>
                      <input
                        type="email"
                        id="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="form-control input-custom"
                        placeholder="Nombre de usuario"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-lock-fill input-icon"></i>
                      <input
                        type={mostrarContrasena ? 'text' : 'password'}
                        id="contrasena"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        className="form-control input-custom"
                        placeholder="Contraseña"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="show-btn"
                        onClick={() => setMostrarContrasena(!mostrarContrasena)}
                      >
                        {mostrarContrasena ? 'OCULTAR' : 'MOSTRAR'}
                      </button>
                    </div>
                  </div>

                  {/* Recordarme + ¿Olvidaste tu contraseña? */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <label className="form-check d-flex align-items-center gap-2 m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="remember-label">Recordarme</span>
                    </label>
                    <Link href="/forgot-password" className="forgot-link">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {/* Botón primario */}
                  <button type="submit" className="btn-signin">
                    Iniciar sesión
                  </button>
                </form>

                {/* Divisor */}
                <div className="divider-container">
                  <div className="divider-line"></div>
                  <span className="divider-text">O</span>
                  <div className="divider-line"></div>
                </div>

                {/* Botón secundario (otro método) */}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => router.push('/register')}
                >
                  Iniciar con otra cuenta
                </button>

                {/* Accesos rápidos: préstamos y más */}
                <div className="quick-links">
                  <Link href="/prestamos" className="quick-link">Préstamos</Link>
                  <Link href="/solicitudes" className="quick-link">Solicitudes</Link>
                  <Link href="/inventario" className="quick-link">Inventario</Link>
                </div>

                {/* Registro */}
                <p className="signup-text">
                  ¿No tienes una cuenta?{' '}
                  <Link href="/register" className="signup-link">Regístrate</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ====== OVERLAY AZUL QUE SE DERRITE ====== */
        .melt-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          z-index: 9999;
          animation: meltAway 1.8s ease-in-out forwards;
        }
        /* “Borde derretido” con waves usando clip-path */
        @keyframes meltAway {
          0%   { clip-path: polygon(0 0,100% 0,100% 100%,0 100%); opacity: 1; }
          40%  { clip-path: polygon(0 0,100% 0,100% 85%,0 95%); }
          70%  { clip-path: polygon(0 0,100% 0,100% 65%,0 80%); }
          85%  { clip-path: polygon(0 0,100% 0,100% 40%,0 60%); }
          100% { clip-path: polygon(0 0,100% 0,100% 0,0 0); opacity: 0; }
        }
        /* gotitas que caen para reforzar el efecto */
        .melt-overlay::after,
        .melt-overlay::before {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 140px;
          bottom: 0;
          background:
            radial-gradient(60px 60px at 15% 20%, rgba(255,255,255,0.35) 0 30%, transparent 31%) no-repeat,
            radial-gradient(45px 45px at 45% 35%, rgba(255,255,255,0.25) 0 30%, transparent 31%) no-repeat,
            radial-gradient(70px 70px at 75% 25%, rgba(255,255,255,0.3) 0 30%, transparent 31%) no-repeat;
          animation: drips 1.2s ease-in-out forwards;
          filter: blur(0.5px);
        }
        .melt-overlay::before {
          bottom: 10px;
          opacity: .7;
          animation-delay: .2s;
        }
        @keyframes drips {
          0% { transform: translateY(0); opacity: .9; }
          100% { transform: translateY(120%); opacity: 0; }
        }

        /* ====== PANEL IZQUIERDO (circles) ====== */
        .blue-panel {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          position: relative;
          overflow: hidden;
        }
        .content-wrapper {
          height: 100%;
          display: flex;
          align-items: center;
          padding-left: 8%;
          position: relative;
          z-index: 5;
        }
        .text-content { color: #fff; }
        .welcome-title {
          font-size: 3.5rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
          line-height: 1.1;
        }
        .headline {
          font-size: 1.5rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .description {
          font-size: 1rem;
          line-height: 1.6;
          opacity: 0.9;
          max-width: 520px;
        }

        /* Círculo grande centrado a la derecha */
        .circle-big {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          right: 14%;
          top: 50%;
          transform: translateY(-50%);
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.18));
          box-shadow: 0 20px 60px rgba(0,0,0,0.18) inset, 0 10px 30px rgba(0,0,0,0.15);
          z-index: 1;
        }
        /* Dos pequeños superpuestos por ENCIMA del grande y en la parte inferior */
        .circle-small {
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          bottom: 7%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.18));
          box-shadow: 0 10px 30px rgba(0,0,0,0.18) inset, 0 6px 18px rgba(0,0,0,0.12);
          z-index: 3; /* por encima del grande */
        }
        .circle-small.left { left: 6%; }
        .circle-small.right { right: 4%; }

        /* ====== PANEL DERECHO (form) ====== */
        .form-section { background: #f8f9fa; }
        .form-container {
          width: 100%;
          max-width: 400px;
          z-index: 10;
          position: relative;
        }
        .form-title {
          font-size: 2.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        .form-subtitle { color: #6b7280; margin-bottom: 2rem; font-size: 0.95rem; }

        .form-bottom-circle {
          position: absolute;
          width: 90px;
          height: 90px;
          background: rgba(37, 99, 235, 0.12);
          border-radius: 50%;
          bottom: 8%;
          right: 8%;
          z-index: 1;
        }

        /* Inputs */
        .input-group-custom { position: relative; margin-bottom: 1rem; }
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 1.1rem;
          z-index: 3;
        }
        .input-custom {
          background: #e5e7eb;
          border: none;
          border-radius: 12px;
          padding: 16px 20px 16px 48px;
          font-size: 1rem;
          color: #374151;
          transition: all 0.3s ease;
          width: 100%;
        }
        .input-custom:focus { background: #d1d5db; outline: none; box-shadow: none; }
        .input-custom::placeholder { color: #6b7280; }

        .show-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          z-index: 3;
          letter-spacing: .02em;
        }

        /* Recordarme / Olvidaste */
        .form-check-input {
          background: #e5e7eb;
          border: 2px solid #d1d5db;
          border-radius: 4px;
        }
        .form-check-input:checked { background: #2563eb; border-color: #2563eb; }
        .remember-label { color: #6b7280; font-size: 0.9rem; }
        .forgot-link { color: #2563eb; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
        .forgot-link:hover { color: #1d4ed8; }

        /* Botones */
        .btn-signin {
          background: #0f4aa8; /* un poco más oscuro que #2563eb para imitar el mock */
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 1rem;
          font-weight: 700;
          width: 100%;
          margin-bottom: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-signin:hover { background: #0d3f90; transform: translateY(-1px); }

        .btn-secondary {
          display: block;
          background: #fff;
          color: #374151;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          padding: 16px;
          font-size: 1rem;
          font-weight: 600;
          width: 100%;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1.25rem;
        }
        .btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

        /* Divisor */
        .divider-container { display: flex; align-items: center; margin: 1.5rem 0; }
        .divider-line { flex: 1; height: 1px; background: #d1d5db; }
        .divider-text { margin: 0 1rem; color: #6b7280; font-size: 0.9rem; }

        /* Quick links (préstamos, etc.) */
        .quick-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .5rem;
          margin-bottom: 1.25rem;
        }
        .quick-link {
          display: inline-block;
          padding: .6rem .75rem;
          border: 1px dashed #d1d5db;
          border-radius: 10px;
          text-align: center;
          font-size: .9rem;
          color: #374151;
          text-decoration: none;
        }
        .quick-link:hover { background: #f3f4f6; }

        /* Registro */
        .signup-text { text-align: center; color: #6b7280; font-size: 0.95rem; margin: 0; }
        .signup-link { color: #2563eb; font-weight: 700; text-decoration: none; }
        .signup-link:hover { color: #1d4ed8; }

        /* Responsive para igualar proporciones del mock */
        @media (max-width: 991.98px) {
          .content-wrapper { padding: 2rem; text-align: center; }
          .welcome-title { font-size: 2.5rem; }
          .headline { font-size: 1.25rem; }
          .circle-big { width: 240px; height: 240px; right: 10%; }
          .circle-small { width: 90px; height: 90px; }
          .circle-small.left { left: 8%; }
          .circle-small.right { right: 6%; }
          .form-bottom-circle { width: 70px; height: 70px; }
        }
      `}</style>
    </>
  );
}
