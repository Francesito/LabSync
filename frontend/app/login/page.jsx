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
    <div className="min-vh-100 d-flex font-sans">
      <div className="row w-100 m-0 min-vh-100">
        
        {/* Sección izquierda - Bienvenida */}
        <div className="col-12 col-lg-7 d-flex flex-column justify-content-center align-items-center position-relative p-0 blue-section">
          {/* Círculos decorativos */}
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
          <div className="circle circle-4"></div>
          <div className="circle circle-5"></div>
          <div className="circle circle-6"></div>
          
          <div className="text-center text-white position-relative" style={{ zIndex: 2 }}>
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
        <div className="col-12 col-lg-5 d-flex flex-column justify-content-center align-items-center bg-white p-4 p-md-5">
          <div className="login-card w-100" style={{ maxWidth: '450px' }}>
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

      <style jsx>{`
        .blue-section {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%);
          overflow: hidden;
        }

        .circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
        }

        .circle-1 {
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.3);
          top: 10%;
          left: 10%;
          animation: float 6s ease-in-out infinite;
        }

        .circle-2 {
          width: 150px;
          height: 150px;
          background: rgba(255, 255, 255, 0.2);
          top: 20%;
          right: 15%;
          animation: float 8s ease-in-out infinite reverse;
        }

        .circle-3 {
          width: 100px;
          height: 100px;
          background: rgba(59, 130, 246, 0.4);
          bottom: 30%;
          left: 20%;
          animation: float 7s ease-in-out infinite;
        }

        .circle-4 {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.25);
          bottom: 15%;
          right: 25%;
          animation: float 5s ease-in-out infinite reverse;
        }

        .circle-5 {
          width: 120px;
          height: 120px;
          background: rgba(30, 64, 175, 0.3);
          top: 60%;
          left: 5%;
          animation: float 9s ease-in-out infinite;
        }

        .circle-6 {
          width: 180px;
          height: 180px;
          background: rgba(255, 255, 255, 0.15);
          top: 5%;
          right: 5%;
          animation: float 10s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-5px); }
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 3rem 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
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
          
          .login-card {
            margin-top: -50px;
            z-index: 10;
            position: relative;
          }
        }
      `}</style>
    </div>
  );
}
