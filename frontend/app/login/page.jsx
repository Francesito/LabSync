'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../lib/auth';

export default function Auth() {
  // Estados compartidos
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  // Estados para Login
  const [correoLogin, setCorreoLogin] = useState('');
  const [contrasenaLogin, setContrasenaLogin] = useState('');
  const [mostrarContrasenaLogin, setMostrarContrasenaLogin] = useState(false);

  // Estados para Register
  const [nombre, setNombre] = useState('');
  const [correoRegister, setCorreoRegister] = useState('');
  const [contrasenaRegister, setContrasenaRegister] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [showPasswordRegister, setShowPasswordRegister] = useState(false);
    const [numeroExpediente, setNumeroExpediente] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('empty');
  const [loading, setLoading] = useState(false);
    const gruposScrollRef = useRef(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

 const { login } = useAuth();
  
  // Cargar grupos al montar el componente
  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/grupos`);
        setGrupos(response.data);
      } catch (err) {
        console.error('Error al cargar grupos:', err);
        setError('Error al cargar los grupos disponibles');
      }
    };

    cargarGrupos();
  }, []);

   useEffect(() => {
    const updateShadows = () => {
      const container = gruposScrollRef.current;
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScrollLeft = Math.max(scrollWidth - clientWidth, 0);
      setShowLeftShadow(scrollLeft > 4);
      setShowRightShadow(scrollLeft < maxScrollLeft - 4);
    };

    const container = gruposScrollRef.current;
    updateShadows();

    if (container) {
      container.addEventListener('scroll', updateShadows, { passive: true });
    }
    window.addEventListener('resize', updateShadows);

    return () => {
      if (container) {
        container.removeEventListener('scroll', updateShadows);
      }
      window.removeEventListener('resize', updateShadows);
    };
  }, [grupos]);

  useEffect(() => {
    const container = gruposScrollRef.current;
    if (!container) return;
    const id = requestAnimationFrame(() => {
      const { scrollWidth, clientWidth } = container;
      setShowRightShadow(scrollWidth > clientWidth + 4);
    });
    return () => cancelAnimationFrame(id);
  }, [isSignUp, grupos]);
  
  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setRedirecting(true);
       await login(correoLogin, contrasenaLogin);
    } catch (err) {
     setRedirecting(false);
      setError(err.response?.data?.error || err.message || 'Error al iniciar sesión');
    }
  };

  // Handle Register
    const evaluatePasswordStatus = (password) => {
    if (!password) return 'empty';
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const nearLength = password.length >= 6;

    if (hasMinLength && hasNumber) return 'valid';
    if (hasMinLength || (hasNumber && nearLength) || (nearLength && !hasNumber)) return 'almost';
    return 'invalid';
  };

  useEffect(() => {
    setPasswordStatus(evaluatePasswordStatus(contrasenaRegister));
  }, [contrasenaRegister]);
  
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!grupoId) {
      setError('Por favor selecciona tu grupo');
      return;
    }

        const expedienteLimpio = numeroExpediente.trim();
    if (!expedienteLimpio) {
      setError('Por favor ingresa tu número de expediente');
      return;
    }

    if (!/^\d{10}$/.test(expedienteLimpio)) {
      setError('El número de expediente debe tener 10 dígitos');
      return;
    }

    if (passwordStatus !== 'valid') {
      setError('La contraseña debe tener al menos 8 caracteres y un número');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        nombre,
        correo_institucional: correoRegister,
        contrasena: contrasenaRegister,
        grupo_id: parseInt(grupoId),
         numero_expediente: expedienteLimpio,
        rol: 'alumno',
      });

      setNombre('');
      setCorreoRegister('');
      setNumeroExpediente('');
      setGrupoId('');
      setContrasenaRegister('');
      setPasswordStatus('empty');
       setShowPasswordRegister(false);
      setIsSignUp(false);
      
      alert('Usuario registrado. Verifica tu correo.');
      router.push('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleGrupoSelect = (id) => {
    setGrupoId((prev) => (prev === id ? '' : id));
  };

 if (redirecting)
    return (
      <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
       <p className="text-primary">Espere un segundo...</p>
      </div>
    );

  return (
    <>
      <div className={`container ${isSignUp ? 'sign-up-mode' : ''}`}>
        <div className="forms-container">
          <div className="signin-signup">
            {/* Formulario de Login */}
            <form onSubmit={handleLoginSubmit} className="sign-in-form">
              <h2 className="title">Iniciar Sesión</h2>
              
              {error && !isSignUp && (
                <div className="error-alert">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="input-field">
                <i className="fas fa-user"></i>
                <input 
                  type="email"
                  value={correoLogin}
                  onChange={(e) => setCorreoLogin(e.target.value)}
                  placeholder="Correo institucional"
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input 
                  type={mostrarContrasenaLogin ? 'text' : 'password'}
                  value={contrasenaLogin}
                  onChange={(e) => setContrasenaLogin(e.target.value)}
                  placeholder="Contraseña"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setMostrarContrasenaLogin(!mostrarContrasenaLogin)}
                >
                  {mostrarContrasenaLogin ? 'OCULTAR' : 'MOSTRAR'}
                </button>
              </div>
              
              <input type="submit" className="btn solid" value="Iniciar Sesión" />
              
              <div className="forgot-password-container">
                <Link href="/forgot-password" className="forgot-password-link">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>

            {/* Formulario de Registro */}
            <form onSubmit={handleRegisterSubmit} className="sign-up-form">
              <h2 className="title">Crear Cuenta</h2>
              
              {error && isSignUp && (
                <div className="error-alert">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="input-field">
                <i className="fas fa-user"></i>
                <input 
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email"
                  value={correoRegister}
                  onChange={(e) => setCorreoRegister(e.target.value)}
                  placeholder="Correo institucional"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="input-field">
                 <i className="fas fa-id-card"></i>
                <input
                  type="text"
                  value={numeroExpediente}
                  onChange={(e) =>
                    setNumeroExpediente(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder="No. Expediente"
                  required
                  disabled={loading}
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>

              <div className={`input-field password-field ${passwordStatus}`}>
                <i className="fas fa-lock"></i>
                <input 
                  type={showPasswordRegister ? 'text' : 'password'}
                  value={contrasenaRegister}
                  onChange={(e) => setContrasenaRegister(e.target.value)}
                  placeholder="Contraseña"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPasswordRegister(!showPasswordRegister)}
                  disabled={loading}
                >
                  {showPasswordRegister ? 'OCULTAR' : 'MOSTRAR'}
                </button>
              </div>

              {/* Selección de Grupos */}
              <div className="grupo-selection">
                <label className="grupo-label">Selecciona tu Grupo:</label>
                
               <div
                  className={`grupos-scroll-wrapper ${
                    showLeftShadow ? 'has-left-shadow' : ''
                  } ${showRightShadow ? 'has-right-shadow' : ''}`}
                >
                  <div className="grupos-scroll" ref={gruposScrollRef}>
                    {grupos.map((grupo) => {
                      const idString = grupo.id.toString();
                      const isSelected = grupoId === idString;
                      return (
                        <button
                          key={grupo.id}
                          type="button"
                          onClick={() => handleGrupoSelect(idString)}
                          className={`grupo-btn ${isSelected ? 'selected' : ''}`}
                          disabled={loading}
                           aria-pressed={isSelected}
                        >
                          {grupo.nombre}
                        </button>
                       );
                    })}
                  </div>
              </div>
              </div>
              
              <input 
                type="submit" 
                className="btn" 
                value={loading ? "Creando..." : "Registrarse"}
                disabled={loading}
              />
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>¿Nuevo en LabSync?</h3>
              <p>
                Regístrate para solicitar préstamos de materiales y reactivos de química
              </p>
              <button 
                className="btn transparent" 
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
              >
                Registrarse
              </button>
            </div>
            <img src="/log.png" className="image" alt="Login illustration" />
          </div>
          <div className="panel right-panel">
            <div className="content">
              <h3>¿Ya tienes cuenta?</h3>
              <p>
                Inicia sesión para acceder a tu cuenta y gestionar tus préstamos
              </p>
              <button 
                className="btn transparent"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
              >
                Iniciar Sesión
              </button>
            </div>
            <img src="/register.png" className="image" alt="Register illustration" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800&display=swap");

        html, body, #__next, [data-nextjs-scroll-focus-boundary] {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }

        html {
          box-sizing: border-box;
        }

        *, *:before, *:after {
          box-sizing: inherit;
          margin: 0;
          padding: 0;
        }

        body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100vh;
          width: 100% !important;
          max-width: 100% !important;
          font-family: "Poppins", sans-serif;
          overflow-x: hidden !important;
        }

        body,
        input {
          font-family: "Poppins", sans-serif;
        }

        .container {
          position: relative;
          width: 100%;
          min-width: 100%;
          max-width: 100%;
          min-height: 100vh;
          background-color: #fff;
          overflow: hidden;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0rem 5rem;
          transition: all 0.2s 0.7s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
        }

        form.sign-in-form {
          z-index: 2;
          opacity: 1;
          position: relative;
          pointer-events: all;
        }

        .container.sign-up-mode form.sign-up-form {
          z-index: 2;
          opacity: 1;
          position: relative;
          pointer-events: all;
        }

        .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
        }

        .title {
          font-size: 2.2rem;
          color: #444;
          margin-bottom: 10px;
        }

        .error-alert {
          max-width: 380px;
          width: 100%;
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin: 10px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #f0f0f0;
          margin: 10px 0;
          height: 55px;
          border-radius: 55px;
          display: grid;
          grid-template-columns: 15% 85%;
          padding: 0 0.4rem;
          position: relative;
        }

  .password-field {
          border: 2px solid transparent;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .password-field.valid {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
        }

        .password-field.almost {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
        }

        .password-field.invalid {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }

        .password-field.empty {
          border-color: transparent;
          box-shadow: none;
        }

        .input-field i {
          text-align: center;
          line-height: 55px;
          color: #acacac;
          transition: 0.5s;
          font-size: 1.1rem;
        }

        .input-field input {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 600;
          font-size: 1.1rem;
          color: #333;
        }

        .input-field input::placeholder {
          color: #aaa;
          font-weight: 500;
        }

        .show-password-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
          z-index: 10;
        }

        .forgot-password-container {
          width: 100%;
          max-width: 380px;
          display: flex;
          justify-content: flex-end;
          margin: 10px 0 20px 0;
        }

        .forgot-password-link {
          color: #2563eb;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .forgot-password-link:hover {
          color: #1d4ed8;
        }

        .grupo-selection {
          width: 100%;
          max-width: 380px;
          margin: 20px 0;
        }

        .grupo-label {
          display: block;
          color: #444;
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 12px;
          text-align: left;
        }

        .grupos-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }

        .grupos-grid-second-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        /* Carrusel de grupos */
        .grupos-scroll-wrapper {
          position: relative;
          width: 100%;
          max-width: 420px;
          overflow: hidden;
          margin: 0 auto;
        }

        .grupos-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 6px 8px 12px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
        }

        .grupos-scroll::-webkit-scrollbar {
          display: none;
        }

        .grupos-scroll-wrapper::before,
        .grupos-scroll-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 48px;
          pointer-events: none;
          transition: opacity 0.3s ease;
          opacity: 0;
          z-index: 2;
        }

        .grupos-scroll-wrapper::before {
          left: 0;
          background: linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
        }

        .grupos-scroll-wrapper::after {
          right: 0;
          background: linear-gradient(to left, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
        }

        .grupos-scroll-wrapper.has-left-shadow::before {
          opacity: 1;
        }

        .grupos-scroll-wrapper.has-right-shadow::after {
          opacity: 1;
        }

        .grupo-btn {
            padding: 10px 18px;
          border: 2px solid #ddd;
          border-radius: 25px;
          background: #fff;
          color: #444;
         font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
       min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
           flex: 0 0 clamp(160px, 42%, 220px);
          scroll-snap-align: start;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
          background-image: linear-gradient(135deg, rgba(89, 149, 253, 0.12), rgba(89, 149, 253, 0));
        }

 .grupo-btn.selected {
          border-color: #1d4ed8;
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #fff;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.35);
          transform: translateY(-2px);
        }
        
        .grupo-btn:hover:not(:disabled) {
          border-color: #5995fd;
          color: #5995fd;
        }

 .grupo-btn.selected:hover:not(:disabled) {
          color: #fff;
          border-color: #1d4ed8;
        }
        
        .grupo-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn {
          width: 150px;
          background-color: #5995fd;
          border: none;
          outline: none;
          height: 49px;
          border-radius: 49px;
          color: #fff;
          text-transform: uppercase;
          font-weight: 600;
          margin: 10px 0;
          cursor: pointer;
          transition: 0.5s;
        }

        .btn:hover:not(:disabled) {
          background-color: #4d84e2;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background-image: linear-gradient(-45deg, #4481eb 0%, #04befe 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .image {
          width: 100%;
          transition: transform 1.1s ease-in-out;
          transition-delay: 0.4s;
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .left-panel {
          pointer-events: all;
          padding: 3rem 17% 2rem 12%;
        }

        .right-panel {
          pointer-events: none;
          padding: 3rem 12% 2rem 17%;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
        }

        .panel h3 {
          font-weight: 600;
          line-height: 1;
          font-size: 1.5rem;
        }

        .panel p {
          font-size: 0.95rem;
          padding: 0.7rem 0;
        }

        .btn.transparent {
          margin: 0;
          background: none;
          border: 2px solid #fff;
          width: 130px;
          height: 41px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .right-panel .image,
        .right-panel .content {
          transform: translateX(800px);
        }

        /* ANIMATION */
        .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .container.sign-up-mode .left-panel .image,
        .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .container.sign-up-mode .right-panel .image,
        .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        @media (max-width: 870px) {
          .container {
            overflow: hidden;
            min-height: 100vh;
            height: 100vh;
          }

          .signin-signup {
            width: 100%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Formulario de login más abajo en mobile */
          .sign-in-form {
            margin-top: 80px;
          }

          /* Formulario de registro más arriba en mobile */
          .sign-up-form {
            margin-top: -80px;
          }

          .container.sign-up-mode .signin-signup {
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }

          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2.5rem 8%;
            grid-column: 1 / 2;
          }

          .right-panel {
            grid-row: 3 / 4;
          }

          .left-panel {
            grid-row: 1 / 2;
          }

          .image {
            width: 200px;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.6s;
          }

          .panel .content {
            padding-right: 15%;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }

          .panel h3 {
            font-size: 1.2rem;
          }

          .panel p {
            font-size: 0.7rem;
            padding: 0.5rem 0;
          }

          .btn.transparent {
            width: 120px;
            height: 40px;
            font-size: 0.75rem;
          }

          .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }

          .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }

          .container.sign-up-mode .left-panel .image,
          .container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }

          .container.sign-up-mode .right-panel .image,
          .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }

          .right-panel .image,
          .right-panel .content {
            transform: translateY(300px);
          }

          .container.sign-up-mode .signin-signup {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

        .grupos-scroll-wrapper {
            max-width: 100%;
          }

          .grupos-scroll {
            gap: 10px;
            padding: 6px 4px 10px;
          }

          .grupo-btn {
           font-size: 0.8rem;
            padding: 8px 12px;
            min-height: 40px;
            flex-basis: clamp(150px, 55%, 210px);
          }
        }

        @media (max-width: 570px) {
          .container {
            overflow: hidden;
            min-height: 100vh;
            height: 100vh;
          }

          form {
            padding: 0 1.5rem;
          }

          .signin-signup {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Ajustar posición de formularios en pantallas muy pequeñas */
          .sign-in-form {
            margin-top: 100px;
          }

          .sign-up-form {
            margin-top: -100px;
          }

          .image {
            display: none;
          }
          
          .panel .content {
            padding: 0.5rem 1rem;
          }
          
          .panel {
            padding: 1.5rem;
          }

          .container:before {
            bottom: 72%;
            left: 50%;
          }

          .container.sign-up-mode:before {
            bottom: 28%;
            left: 50%;
          }

          .container.sign-up-mode .signin-signup {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .grupos-scroll {
            gap: 8px;
            padding: 4px 2px 8px;
          }

          .grupo-btn {
          font-size: 0.75rem;
            padding: 6px 10px;
            min-height: 36px;
            flex-basis: clamp(140px, 70%, 200px);
          }

          .btn.transparent {
            width: 140px;
            height: 45px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
}
