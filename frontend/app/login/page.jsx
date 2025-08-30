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
  const [showBubbles, setShowBubbles] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
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
    // Animación de burbujeo inicial
    const timer = setTimeout(() => {
      setShowBubbles(false);
      setTimeout(() => {
        setPageLoaded(true);
      }, 300);
    }, 2500);

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
      {/* Animación de burbujeo inicial */}
      {showBubbles && (
        <div className="bubble-container">
          <div className="bubble-overlay">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="bubble"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      <div className={`main-container ${pageLoaded ? 'page-loaded' : ''}`}>
        <div className="min-vh-100 d-flex font-sans">
          <div className="row w-100 m-0 min-vh-100">
            
            {/* Sección izquierda - Bienvenida */}
            <div className="col-12 col-lg-7 d-flex flex-column justify-content-center align-items-center position-relative p-0 blue-section">
              {/* Círculo grande principal */}
              <div className="main-circle"></div>
              
              {/* Círculos superiores superpuestos */}
              <div className="small-circle-1"></div>
              <div className="small-circle-2"></div>
              
              {/* Círculos decorativos adicionales */}
              <div className="decoration-circle decoration-1"></div>
              <div className="decoration-circle decoration-2"></div>
              <div className="decoration-circle decoration-3"></div>
              
              <div className="text-center text-white position-relative" style={{ zIndex: 5 }}>
                <h1 className="display-3 fw-bold mb-3" style={{ fontSize: '3.5rem', letterSpacing: '0.1em' }}>
                  BIENVENIDO
                </h1>
                <h2 className="h2 fw-semibold mb-4" style={{ fontSize: '2rem', letterSpacing: '0.15em' }}>
                  LABSYNC
                </h2>
                <p className="lead mx-auto" style={{ maxWidth: '400px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                  Gestiona tus préstamos de materiales<br />
                  de equipo y laboratorio de manera<br />
                  sencilla.
                </p>
              </div>
            </div>

            {/* Sección derecha - Formulario */}
            <div className="col-12 col-lg-5 d-flex flex-column justify-content-center align-items-center bg-white p-4 p-md-5 position-relative">
              {/* Círculo pequeño inferior derecha */}
              <div className="right-circle"></div>
              
              <div className="w-100" style={{ maxWidth: '450px' }}>
                <div className="mb-4">
                  <h2 className="fw-bold text-dark mb-2" style={{ fontSize: '2rem' }}>Iniciar Sesión</h2>
                  <p className="text-muted">Introduce tus credenciales para iniciar sesión.</p>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4 rounded-3 shadow-sm">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Campo Email */}
                  <div className="mb-4">
                    <label htmlFor="correo" className="form-label fw-semibold text-dark mb-2">
                      Nombre Completo
                    </label>
                    <div className="position-relative">
                      <i className="bi bi-person-fill position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" 
                         style={{ fontSize: '1.1rem', zIndex: 3 }}></i>
                      <input
                        type="email"
                        id="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="form-control custom-input"
                        placeholder="ejemplo@utsjr.edu.mx"
                        required
                      />
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div className="mb-4">
                    <label htmlFor="contrasena" className="form-label fw-semibold text-dark mb-2">
                      Contraseña
                    </label>
                    <div className="position-relative">
                      <i className="bi bi-lock-fill position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" 
                         style={{ fontSize: '1.1rem', zIndex: 3 }}></i>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="contrasena"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        className="form-control custom-input"
                        placeholder="Ingresa tu contraseña"
                        required
                      />
                      <button
                        type="button"
                        className="btn position-absolute top-50 end-0 translate-middle-y me-3 p-0 border-0 bg-transparent text-primary fw-semibold"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ fontSize: '0.85rem', zIndex: 3 }}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  {/* Enlace Olvidaste contraseña */}
                  <div className="mb-4 text-end">
                    <Link href="/forgot-password" className="text-primary text-decoration-none fw-semibold">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {/* Botón Iniciar Sesión */}
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 fw-semibold mb-4 custom-btn-primary"
                  >
                    Iniciar Sesión
                  </button>
                </form>

                {/* Divisor */}
                <div className="text-center mb-4 position-relative">
                  <hr className="text-muted" />
                  <span className="bg-white px-3 text-muted position-absolute top-50 start-50 translate-middle">
                    Or
                  </span>
                </div>

                {/* Botón Registrarse */}
                <Link href="/register" className="btn btn-outline-secondary w-100 fw-semibold text-decoration-none">
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-container {
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
        }

        .main-container.page-loaded {
          opacity: 1;
        }

        /* Animación de burbujeo inicial */
        .bubble-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bubbleDissolve 0.5s ease-out 2s forwards;
        }

        @keyframes bubbleDissolve {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        .bubble-overlay {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: bubbleRise 3s ease-in-out infinite;
        }

        .bubble:nth-child(even) {
          background: rgba(59, 130, 246, 0.4);
          width: 15px;
          height: 15px;
        }

        .bubble:nth-child(3n) {
          background: rgba(255, 255, 255, 0.5);
          width: 25px;
          height: 25px;
        }

        @keyframes bubbleRise {
          0% {
            bottom: -50px;
            transform: translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateX(20px) scale(1.2);
          }
          100% {
            bottom: 100vh;
            transform: translateX(-20px) scale(0.8);
            opacity: 0;
          }
        }

        .blue-section {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%);
          overflow: hidden;
        }

        /* Círculo grande principal */
        .main-circle {
          position: absolute;
          width: 400px;
          height: 400px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          top: 50%;
          left: 20%;
          transform: translateY(-50%);
          animation: pulseGlow 4s ease-in-out infinite;
          z-index: 1;
        }

        /* Círculos superiores superpuestos */
        .small-circle-1 {
          position: absolute;
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          top: 25%;
          left: 15%;
          animation: float 6s ease-in-out infinite;
          z-index: 2;
        }

        .small-circle-2 {
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(30, 64, 175, 0.4);
          border-radius: 50%;
          top: 20%;
          left: 22%;
          animation: float 8s ease-in-out infinite reverse;
          z-index: 3;
        }

        /* Círculos decorativos adicionales */
        .decoration-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.15;
        }

        .decoration-1 {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.3);
          bottom: 20%;
          left: 10%;
          animation: float 7s ease-in-out infinite;
        }

        .decoration-2 {
          width: 90px;
          height: 90px;
          background: rgba(59, 130, 246, 0.4);
          top: 15%;
          right: 10%;
          animation: float 9s ease-in-out infinite reverse;
        }

        .decoration-3 {
          width: 45px;
          height: 45px;
          background: rgba(255, 255, 255, 0.4);
          bottom: 35%;
          right: 15%;
          animation: float 5s ease-in-out infinite;
        }

        /* Círculo pequeño en sección derecha */
        .right-circle {
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 50%;
          bottom: 15%;
          right: 15%;
          animation: gentleFloat 6s ease-in-out infinite;
          z-index: 1;
        }

        @keyframes pulseGlow {
          0%, 100% { 
            transform: translateY(-50%) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-50%) scale(1.05);
            opacity: 0.4;
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

        .custom-input {
          padding: 14px 20px 14px 45px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #f9fafb;
        }

        .custom-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: white;
        }

        .custom-input::placeholder {
          color: #9ca3af;
        }

        .custom-btn-primary {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .custom-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .btn-outline-secondary {
          border: 2px solid #d1d5db;
          border-radius: 12px;
          padding: 14px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
        }

        .btn-outline-secondary:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        @media (max-width: 991.98px) {
          .blue-section {
            min-height: 300px;
          }
          
          .main-circle {
            width: 250px;
            height: 250px;
            left: 10%;
          }

          .small-circle-1 {
            width: 80px;
            height: 80px;
            left: 10%;
          }

          .small-circle-2 {
            width: 60px;
            height: 60px;
            left: 15%;
          }

          .right-circle {
            width: 60px;
            height: 60px;
            bottom: 10%;
            right: 10%;
          }
        }
      `}</style>
    </>
  );
}
