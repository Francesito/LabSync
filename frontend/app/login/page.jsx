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
  const router = useRouter();

  // Overlay azul que se "derrite" al entrar/recargar
  const [showMelt, setShowMelt] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowMelt(false), 1800);
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
      {showMelt && <div className="melt-overlay" aria-hidden="true"></div>}

      <div className="page">
        <div className="row w-100 m-0 min-vh-100">
          {/* IZQUIERDA: formulario centrado + círculos */}
          <div className="col-12 col-lg-6 position-relative p-0 left-pane">
            {/* Círculo grande (centro en 0,0 de la pantalla) */}
            <div className="giant-circle" />
            {/* Círculos pequeños con centro en la circunferencia del grande */}
            <div className="small-circle a" />
            <div className="small-circle b" />

            <div className="left-inner">
              <div className="form-card">
                <h2 className="form-title">Iniciar sesión</h2>
                <p className="form-subtitle">Accede con tu correo institucional y contraseña</p>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
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

                  <div className="d-flex justify-content-end mb-4">
                    <Link href="/forgot-password" className="forgot-link">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button type="submit" className="btn-signin">Iniciar sesión</button>
                </form>

                <div className="divider-container">
                  <div className="divider-line"></div>
                  <span className="divider-text">O</span>
                  <div className="divider-line"></div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => router.push('/register')}
                >
                  Iniciar con otra cuenta
                </button>

                <p className="signup-text">
                  ¿No tienes una cuenta?{' '}
                  <Link href="/register" className="signup-link">Regístrate</Link>
                </p>
              </div>
            </div>
          </div>

          {/* DERECHA: texto de marca */}
          <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center right-pane">
            <div className="brand-copy">
              <h1 className="welcome-title">LabSync.</h1>
              <h2 className="headline">
                Solicita préstamos para materiales y reactivos de química.
              </h2>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(html, body) { background:#fff; }
        .page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background:#fff;
        }

        /* ====== OVERLAY “DERRETIDO” ====== */
        .melt-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          z-index: 9999;
          animation: meltAway 1.8s ease-in-out forwards;
        }
        @keyframes meltAway {
          0%   { clip-path: polygon(0 0,100% 0,100% 100%,0 100%); opacity: 1; }
          40%  { clip-path: polygon(0 0,100% 0,100% 85%,0 95%); }
          70%  { clip-path: polygon(0 0,100% 0,100% 65%,0 80%); }
          85%  { clip-path: polygon(0 0,100% 0,100% 40%,0 60%); }
          100% { clip-path: polygon(0 0,100% 0,100% 0,0 0); opacity: 0; }
        }
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
        .melt-overlay::before { bottom: 10px; opacity: .7; animation-delay:.2s; }
        @keyframes drips {
          0% { transform: translateY(0); opacity:.9; }
          100% { transform: translateY(120%); opacity:0; }
        }

        /* ====== LADO IZQUIERDO ====== */
        .left-pane { background:#fff; min-height: 50vh; }
        .left-inner {
          position: relative;
          z-index: 5;
          min-height: 100vh;
          display: grid;
          place-items: center; /* centra el formulario vertical y horizontalmente */
          padding: 24px;
        }

        /* Círculo grande: centro en (0,0) de la pantalla */
        .giant-circle {
          --R: min(38vw, 560px); /* radio mayor que la mitad de la mitad izquierda */
          position: fixed; /* relativo a la pantalla para fijar el centro en la esquina */
          width: calc(var(--R) * 2);
          height: calc(var(--R) * 2);
          top: calc(-1 * var(--R));   /* para que el centro quede en 0,0 */
          left: calc(-1 * var(--R));
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.18)),
                      linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.18) inset, 0 10px 30px rgba(0,0,0,0.12);
          z-index: 1;
          pointer-events: none;
        }

        /* Círculos pequeños: centros en la circunferencia del grande */
        .small-circle {
          --R: min(38vw, 560px);
          --r: calc(var(--R) * 0.38);  /* radio pequeño */
          position: fixed;
          width: calc(var(--r) * 2);
          height: calc(var(--r) * 2);
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.30), rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.18)),
                      linear-gradient(135deg, rgba(37,99,235,0.9), rgba(29,78,216,0.9));
          box-shadow: 0 10px 30px rgba(0,0,0,0.18) inset, 0 6px 18px rgba(0,0,0,0.12);
          z-index: 2;
          pointer-events: none;
        }
        /* ángulos elegidos para que queden “abajo” y “hacia la derecha” sobre la circunferencia */
        .small-circle.a {
          /* ángulo ~65° desde el eje X, centro sobre la circunferencia */
          top: calc(-1 * var(--r) + var(--R) * (1 - sin(25deg)));
          left: calc(-1 * var(--r) + var(--R) * (cos(25deg)));
        }
        .small-circle.b {
          /* ángulo ~320° (o -40°) */
          top: calc(-1 * var(--r) + var(--R) * (1 - sin(40deg)));
          left: calc(-1 * var(--r) + var(--R) * (cos(320deg)));
        }

        /* Tarjeta del formulario */
        .form-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          padding: 28px;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(2, 6, 23, 0.08);
        }
        .form-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 .25rem 0;
        }
        .form-subtitle { color: #6b7280; margin-bottom: 1.5rem; font-size: .95rem; }

        .input-group-custom { position: relative; }
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
        .input-custom:focus { background: #d1d5db; outline: none; }
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

        .forgot-link { color: #2563eb; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
        .forgot-link:hover { color: #1d4ed8; }

        .btn-signin {
          background: #0f4aa8;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 1rem;
          font-weight: 700;
          width: 100%;
          margin-bottom: 1.6rem;
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
          margin-bottom: 1rem;
        }
        .btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

        .divider-container { display: flex; align-items: center; margin: 1.4rem 0; }
        .divider-line { flex: 1; height: 1px; background: #d1d5db; }
        .divider-text { margin: 0 1rem; color: #6b7280; font-size: 0.9rem; }

        .signup-text { text-align: center; color: #6b7280; font-size: 0.95rem; margin: 0; }
        .signup-link { color: #2563eb; font-weight: 700; text-decoration: none; }
        .signup-link:hover { color: #1d4ed8; }

        /* ====== LADO DERECHO: texto ====== */
        .right-pane { background:#fff; text-align:center; padding: 32px; }
        .brand-copy { max-width: 560px; }
        .welcome-title {
          font-size: 3.4rem;
          font-weight: 800;
          letter-spacing: .06em;
          margin-bottom: .6rem;
          color: #111827;
        }
        .headline {
          font-size: 1.35rem;
          font-weight: 500;
          color: #4b5563;
        }

        /* Responsive */
        @media (max-width: 991.98px) {
          .left-inner { min-height: 60vh; }
          .form-card { box-shadow: none; padding: 24px; }
          .welcome-title { font-size: 2.6rem; }
          .headline { font-size: 1.1rem; }
          .giant-circle { --R: min(60vw, 420px); }
          .small-circle { --r: calc(var(--R) * 0.38); }
        }
      `}</style>
    </>
  );
}
