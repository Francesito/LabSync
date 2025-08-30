'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [showBlueOverlay, setShowBlueOverlay] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1320px) and (min-height: 750px)');
    const updateScreen = () => setIsLargeScreen(mediaQuery.matches);
    updateScreen();

    // Compatibilidad con navegadores que aún usan addListener/removeListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateScreen);
      return () => mediaQuery.removeEventListener('change', updateScreen);
    } else {
      mediaQuery.addListener(updateScreen);
      return () => mediaQuery.removeListener(updateScreen);
    }
  }, []);

  useEffect(() => {
    // Animación de derretimiento inicial
    const timer = setTimeout(() => {
      setShowBlueOverlay(false);
      setTimeout(() => {
        setPageLoaded(true);
      }, 800);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        correo_institucional: correo,
        contrasena,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('nombre', response.data.nombre);
      setRedirecting(true);
      router.replace('/catalog');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  if (redirecting) {
    return <div className="min-vh-100 bg-white"></div>;
  }

  return (
    <>
      {/* Animación de derretimiento inicial */}
      {showBlueOverlay && (
        <div className="blue-overlay">
          <div className="melting-effect"></div>
        </div>
      )}

      <div className={`main-container ${pageLoaded ? 'page-loaded' : ''}`}>
        <div className="min-vh-100 d-flex">
          <div className="row w-100 m-0 min-vh-100">
            
            {/* Sección izquierda - Bienvenida con forma curva */}
            <div className="col-12 col-lg-7 position-relative p-0 left-section">
              {/* Círculo grande principal */}
              <div className="main-circle"></div>
              
              {/* Círculos pequeños superpuestos */}
              <div className="small-circle-1"></div>
              <div className="small-circle-2"></div>
              
              <div className="content-wrapper">
                <div className="text-content">
                  <h1 className="welcome-title">BIENVENIDO</h1>
                  <h2 className="headline">LABSYNC</h2>
                  <p className="description">
                    Gestiona tus préstamos de materiales<br />
                    de equipo y laboratorio de manera<br />
                    sencilla y eficiente.
                  </p>
                </div>
              </div>
            </div>

            {/* Sección derecha - Formulario */}
            <div className="col-12 col-lg-5 d-flex flex-column justify-content-center align-items-start bg-white p-5 form-section position-relative">
              {/* Círculo pequeño en la esquina inferior derecha */}
              <div className="form-bottom-circle"></div>
              
              <div className="form-container">
                <div className="mb-4">
                  <h2 className="form-title">Iniciar Sesión</h2>
                  <p className="form-subtitle">Introduce tus credenciales para acceder a tu cuenta</p>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Campo Correo Electrónico */}
                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-person-fill input-icon"></i>
                      <input
                        type="email"
                        id="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="form-control input-custom"
                        placeholder="Correo Electrónico"
                        required
                      />
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-lock-fill input-icon"></i>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="contrasena"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        className="form-control input-custom"
                        placeholder="Contraseña"
                        required
                      />
                      <button
                        type="button"
                        className="show-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                      </button>
                    </div>
                  </div>

                  {/* Recordarme y Olvidé contraseña */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value=""
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label className="form-check-label remember-label" htmlFor="rememberMe">
                        Recordarme
                      </label>
                    </div>
                    <Link href="/forgot-password" className="forgot-link">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {/* Botón Iniciar Sesión */}
                  <button type="submit" className="btn-signin">
                    Iniciar Sesión
                  </button>
                </form>

                {/* Divisor */}
                <div className="divider-container">
                  <div className="divider-line"></div>
                  <span className="divider-text">O</span>
                  <div className="divider-line"></div>
                </div>

                {/* Botón Registrarse */}
                <Link href="/register" className="btn-secondary">
                  Registrarse
                </Link>

                {/* Texto de registro */}
                <p className="signup-text">
                  ¿No tienes cuenta? <Link href="/register" className="signup-link">Regístrate aquí</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-container {
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .main-container.page-loaded {
          opacity: 1;
        }

        /* Animación de derretimiento inicial */
        .blue-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          z-index: 9999;
          animation: meltDown 0.8s ease-in-out 1.5s forwards;
        }

        .melting-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: inherit;
          clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0%);
          animation: meltReveal 0.8s ease-in-out 1.5s forwards;
        }

        @keyframes meltDown {
          0% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0%);
            opacity: 0;
          }
        }

        @keyframes meltReveal {
          0% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0%);
          }
        }

        /* Sección izquierda con fondo blanco y círculos */}
        .left-section {
          background: white;
          clip-path: ellipse(120% 100% at 0% 50%);
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

        .text-content {
          color: white;
        }

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
          opacity: 0.8;
          max-width: 500px;
        }

        /* Círculo grande principal */}
        .main-circle {
          position: absolute;
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 50%;
          top: 50%;
          right: 15%;
          transform: translateY(-50%);
          z-index: 1;
          animation: pulseGlow 4s ease-in-out infinite;
        }

        /* Círculos pequeños superpuestos */}
        .small-circle-1 {
          position: absolute;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 50%;
          bottom: 35%;
          right: 25%;
          z-index: 2;
          animation: float 6s ease-in-out infinite;
        }

        .small-circle-2 {
          position: absolute;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          border-radius: 50%;
          bottom: 25%;
          right: 20%;
          z-index: 3;
          animation: float 8s ease-in-out infinite reverse;
        }

        /* Círculo en sección del formulario */}
        .form-bottom-circle {
          position: absolute;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 50%;
          bottom: 8%;
          right: 8%;
          z-index: 1;
          animation: gentleFloat 6s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { 
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translateY(-50%) scale(1.05);
            opacity: 0.9;
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-15px) translateX(8px); }
          66% { transform: translateY(8px) translateX(-5px); }
        }

        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        /* Formulario */}
        .form-section {
          background: #f8f9fa;
        }

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

        .form-subtitle {
          color: #6b7280;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        /* Inputs personalizados */}
        .input-group-custom {
          position: relative;
          margin-bottom: 1rem;
        }

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

        .input-custom:focus {
          background: #d1d5db;
          outline: none;
          box-shadow: none;
        }

        .input-custom::placeholder {
          color: #6b7280;
        }

        .show-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          z-index: 3;
        }

        /* Recordarme y Olvidé contraseña */}
        .form-check-input {
          background: #e5e7eb;
          border: 2px solid #d1d5db;
          border-radius: 4px;
        }

        .form-check-input:checked {
          background: #2563eb;
          border-color: #2563eb;
        }

        .remember-label {
          color: #6b7280;
          font-size: 0.9rem;
          margin-left: 0.5rem;
        }

        .forgot-link {
          color: #2563eb;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .forgot-link:hover {
          color: #1d4ed8;
        }

        /* Botones */}
        .btn-signin {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 1rem;
          font-weight: 600;
          width: 100%;
          margin-bottom: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-signin:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .btn-secondary {
          display: block;
          background: white;
          color: #374151;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          padding: 16px;
          font-size: 1rem;
          font-weight: 500;
          width: 100%;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1.5rem;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          color: #374151;
          text-decoration: none;
        }

        /* Divisor */}
        .divider-container {
          display: flex;
          align-items: center;
          margin: 2rem 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #d1d5db;
        }

        .divider-text {
          margin: 0 1rem;
          color: #6b7280;
          font-size: 0.9rem;
        }

        /* Texto de registro */}
        .signup-text {
          text-align: center;
          color: #6b7280;
          font-size: 0.95rem;
          margin: 0;
        }

        .signup-link {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        .signup-link:hover {
          color: #1d4ed8;
        }

        @media (max-width: 991.98px) {
          .left-section {
            clip-path: none;
            min-height: 40vh;
          }
          
          .content-wrapper {
            padding: 2rem;
            text-align: center;
          }

          .welcome-title {
            font-size: 2.5rem;
          }

          .headline {
            font-size: 1.25rem;
          }

          .main-circle {
            width: 250px;
            height: 250px;
            right: 10%;
          }

          .small-circle-1 {
            width: 80px;
            height: 80px;
            right: 20%;
            bottom: 30%;
          }

          .small-circle-2 {
            width: 60px;
            height: 60px;
            right: 15%;
            bottom: 25%;
          }

          .form-bottom-circle {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </>
  );
}
