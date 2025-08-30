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
        <div className="min-vh-100 d-flex">
          <div className="row w-100 m-0 min-vh-100">
            
            {/* Sección izquierda - Bienvenida con forma curva */}
            <div className="col-12 col-lg-7 position-relative p-0 blue-section">
              {/* Círculo grande principal */}
              <div className="main-circle"></div>
              
              {/* Círculo pequeño inferior derecha de la sección izquierda */}
              <div className="bottom-right-circle"></div>
              
              <div className="content-wrapper">
                <div className="text-content">
                  <h1 className="welcome-title">WELCOME</h1>
                  <h2 className="headline">YOUR HEADLINE NAME</h2>
                  <p className="description">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam<br />
                    nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam<br />
                    erat volutpat ut wisi enim ad minim quis nostrud exerci tation.
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
                  <h2 className="form-title">Sign in</h2>
                  <p className="form-subtitle">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Campo User Name */}
                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-person-fill input-icon"></i>
                      <input
                        type="email"
                        id="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="form-control input-custom"
                        placeholder="User Name"
                        required
                      />
                    </div>
                  </div>

                  {/* Campo Password */}
                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-lock-fill input-icon"></i>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="contrasena"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        className="form-control input-custom"
                        placeholder="Password"
                        required
                      />
                      <button
                        type="button"
                        className="show-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  {/* Remember me y Forgot Password */}
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
                        Remember me
                      </label>
                    </div>
                    <Link href="/forgot-password" className="forgot-link">
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Botón Sign in */}
                  <button type="submit" className="btn-signin">
                    Sign in
                  </button>
                </form>

                {/* Divisor */}
                <div className="divider-container">
                  <div className="divider-line"></div>
                  <span className="divider-text">Or</span>
                  <div className="divider-line"></div>
                </div>

                {/* Botón Sign in with other */}
                <Link href="/register" className="btn-secondary">
                  Sign in with other
                </Link>

                {/* Sign up link */}
                <p className="signup-text">
                  Don't have an account? <Link href="/register" className="signup-link">Sign up</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-container {
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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
          background: rgba(37, 99, 235, 0.4);
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

        /* Sección azul con forma curva */
        .blue-section {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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

        /* Círculos */
        .main-circle {
          position: absolute;
          width: 350px;
          height: 350px;
          background: rgba(37, 99, 235, 0.3);
          border-radius: 50%;
          top: 50%;
          right: 15%;
          transform: translateY(-50%);
          z-index: 1;
        }

        .bottom-right-circle {
          position: absolute;
          width: 120px;
          height: 120px;
          background: rgba(37, 99, 235, 0.4);
          border-radius: 50%;
          bottom: 10%;
          right: 5%;
          z-index: 2;
        }

        /* Círculo en sección del formulario */
        .form-bottom-circle {
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(37, 99, 235, 0.1);
          border-radius: 50%;
          bottom: 8%;
          right: 8%;
          z-index: 1;
        }

        /* Formulario */
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

        /* Inputs personalizados */
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

        /* Remember me y Forgot Password */
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

        /* Botones */
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

        /* Divisor */
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

        /* Sign up text */
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
          .blue-section {
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
            width: 200px;
            height: 200px;
            right: 10%;
          }

          .bottom-right-circle {
            width: 80px;
            height: 80px;
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
