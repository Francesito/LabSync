'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);

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

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        correo_institucional: correoLogin,
        contrasena: contrasenaLogin,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('nombre', data.nombre);
      setRedirecting(true);
      router.replace('/catalog');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!grupoId) {
      setError('Por favor selecciona tu grupo');
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
        rol: 'alumno',
      });
      
      alert('Usuario registrado. Verifica tu correo.');
      router.push('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleGrupoSelect = (id) => {
    setGrupoId(id);
  };

  if (redirecting) return <div className="min-vh-100 bg-white" />;

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
                <div className="grupos-grid">
                  {grupos.slice(0, 2).map((grupo) => (
                    <button
                      key={grupo.id}
                      type="button"
                      onClick={() => handleGrupoSelect(grupo.id.toString())}
                      className={`grupo-btn ${grupoId === grupo.id.toString() ? 'selected' : ''}`}
                      disabled={loading}
                    >
                      {grupo.nombre}
                    </button>
                  ))}
                </div>
                {grupos.length > 2 && (
                  <div className="grupos-grid-second-row">
                    {grupos.slice(2, 4).map((grupo) => (
                      <button
                        key={grupo.id}
                        type="button"
                        onClick={() => handleGrupoSelect(grupo.id.toString())}
                        className={`grupo-btn ${grupoId === grupo.id.toString() ? 'selected' : ''}`}
                        disabled={loading}
                      >
                        {grupo.nombre}
                      </button>
                    ))}
                  </div>
                )}
                {grupos.length > 4 && (
                  <div className="grupos-grid-third-row">
                    {grupos.slice(4, 6).map((grupo) => (
                      <button
                        key={grupo.id}
                        type="button"
                        onClick={() => handleGrupoSelect(grupo.id.toString())}
                        className={`grupo-btn ${grupoId === grupo.id.toString() ? 'selected' : ''}`}
                        disabled={loading}
                      >
                        {grupo.nombre}
                      </button>
                    ))}
                  </div>
                )}
                {grupos.length > 6 && (
                  <div className="grupos-grid-fourth-row">
                    {grupos.slice(6, 7).map((grupo) => (
                      <button
                        key={grupo.id}
                        type="button"
                        onClick={() => handleGrupoSelect(grupo.id.toString())}
                        className={`grupo-btn ${grupoId === grupo.id.toString() ? 'selected' : ''}`}
                        disabled={loading}
                      >
                        {grupo.nombre}
                      </button>
                    ))}
                  </div>
                )}
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
          overflow: hidden !important;
          height: 100vh !important;
          max-height: 100vh !important;
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
          height: 100vh !important;
          max-height: 100vh !important;
          width: 100% !important;
          max-width: 100% !important;
          font-family: "Poppins", sans-serif;
          overflow: hidden !important;
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
          height: 100vh;
          max-height: 100vh;
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
        }

        form.sign-in-form {
          z-index: 2;
        }

        .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
        }

        .title {
          font-size: 2.2rem;
          color: #444;
          margin-bottom: 10px;
        }

        /* En modo registro, el título debe ser negro */
        .container.sign-up-mode .title {
          color: #000;
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

        /* En modo registro, el label debe ser negro */
        .container.sign-up-mode .grupo-label {
          color: #000;
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

        .grupo-btn {
          padding: 8px 12px;
          border: 2px solid #ddd;
          border-radius: 25px;
          background: #fff;
          color: #444;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .grupo-btn:hover:not(:disabled) {
          border-color: #5995fd;
          color: #5995fd;
        }

        .grupo-btn.selected {
          background: #5995fd;
          border-color: #5995fd;
          color: #fff;
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
          height: 100vh;
          width: 100vw;
          top: 0;
          right: 50%;
          background-image: linear-gradient(-45deg, #4481eb 0%, #04befe 100%);
          transition: 1.8s ease-in-out;
          border-radius: 0;
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
          right: 0%;
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
            height: 100vh;
            max-height: 100vh;
            overflow: hidden;
          }

          .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }

          .signin-signup,
          .container.sign-up-mode .signin-signup {
            left: 50%;
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
            width: 110px;
            height: 35px;
            font-size: 0.7rem;
          }

          .container:before {
            width: 100vw;
            height: 100vh;
            transform: translateX(-50%);
            left: 50%;
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
            top: 5%;
            transform: translate(-50%, 0);
          }

          .grupos-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .grupos-grid-second-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .container {
            overflow: hidden;
            height: 100vh;
            max-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .container:before {
            display: none;
          }

          .panels-container {
            display: none;
          }

          .forms-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .signin-signup {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 400px;
            transition: none;
          }

          form {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem 1.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .title {
            color: #2d3748;
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
            text-align: center;
            font-weight: 700;
          }

          .input-field {
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid rgba(102, 126, 234, 0.1);
            margin: 0.8rem 0;
            transition: all 0.3s ease;
          }

          .input-field:focus-within {
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.95);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
          }

          .input-field i {
            color: #667eea;
            font-size: 1rem;
          }

          .input-field input {
            color: #2d3748;
            font-weight: 500;
          }

          .input-field input::placeholder {
            color: #718096;
          }

          .show-password-btn {
            color: #667eea;
            font-weight: 600;
            font-size: 0.7rem;
          }

          .forgot-password-link {
            color: #667eea;
            font-weight: 600;
          }

          .forgot-password-link:hover {
            color: #764ba2;
          }

          .grupo-selection {
            margin: 1.5rem 0;
          }

          .grupo-label {
            color: #2d3748;
            font-weight: 700;
            font-size: 1rem;
            margin-bottom: 1rem;
            text-align: center;
          }

          .grupos-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.8rem;
            margin-bottom: 0.8rem;
          }

          .grupos-grid-second-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.8rem;
            margin-bottom: 0.8rem;
          }

          .grupos-grid-third-row {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 0.8rem;
            justify-items: center;
          }

          .grupo-btn {
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid rgba(102, 126, 234, 0.3);
            color: #4a5568;
            font-size: 0.8rem;
            font-weight: 600;
            padding: 0.8rem 0.5rem;
            border-radius: 12px;
            min-height: 45px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 10px rgba(102, 126, 234, 0.1);
          }

          .grupo-btn:hover:not(:disabled) {
            background: rgba(102, 126, 234, 0.1);
            border-color: #667eea;
            color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
          }

          .grupo-btn.selected {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
          }

          .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 100%;
            max-width: 200px;
            height: 50px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 0.9rem;
            margin: 1.5rem 0 1rem 0;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
          }

          .btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
          }

          .error-alert {
            background: rgba(248, 215, 218, 0.9);
            border: 1px solid rgba(220, 53, 69, 0.3);
            border-radius: 12px;
            backdrop-filter: blur(5px);
          }

          /* Ajustes específicos para 7 grupos */
          .grupos-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .grupos-grid-second-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .grupos-grid-third-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .grupos-grid-fourth-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.8rem;
            justify-items: center;
          }

          .grupos-grid-fourth-row .grupo-btn {
            max-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .signin-signup {
            width: 95%;
            max-width: 350px;
          }

          form {
            padding: 1.8rem 1.2rem;
          }

          .title {
            font-size: 1.6rem;
            margin-bottom: 1.2rem;
          }

          .input-field {
            height: 50px;
            margin: 0.6rem 0;
          }

          .input-field i {
            font-size: 0.9rem;
          }

          .input-field input {
            font-size: 1rem;
          }

          .grupo-label {
            font-size: 0.9rem;
          }

          .grupo-btn {
            font-size: 0.75rem;
            padding: 0.7rem 0.4rem;
            min-height: 42px;
          }

          .btn {
            height: 45px;
            font-size: 0.85rem;
            margin: 1.2rem 0 0.8rem 0;
          }
        }
      `}</style>
    </>
  );
}
