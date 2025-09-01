// Handle Login
  const handleLoginSubmit = async () => {
    try {
      // Simulación de login exitoso
      console.log('Login:', { correoLogin, contrasenaLogin });
      alert('Login exitoso');
    } catch (err) {
      setError('Error al iniciar sesión');
    }
  };

  // Handle Register
  const handleRegisterSubmit = async () => {
    if (!grupo'use client';
import { useState, useEffect } from 'react';

export default function Auth() {
  // Estados compartidos
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // Estados para Login
  const [correoLogin, setCorreoLogin] = useState('');
  const [contrasenaLogin, setContrasenaLogin] = useState('');
  const [mostrarContrasenaLogin, setMostrarContrasenaLogin] = useState(false);

  // Estados para Register
  const [nombre, setNombre] = useState('');
  const [correoRegister, setCorreoRegister] = useState('');
  const [contrasenaRegister, setContrasenaRegister] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([
    { id: 1, nombre: 'QFB-A' },
    { id: 2, nombre: 'QFB-B' },
    { id: 3, nombre: 'IQ-A' },
    { id: 4, nombre: 'IQ-B' },
    { id: 5, nombre: 'QA-A' },
    { id: 6, nombre: 'QA-B' },
    { id: 7, nombre: 'OTRO' }
  ]);
  const [showPasswordRegister, setShowPasswordRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Login
  const handleLoginSubmit = async () => {
    try {
      // Simulación de login exitoso
      console.log('Login:', { correoLogin, contrasenaLogin });
      alert('Login exitoso');
    } catch (err) {
      setError('Error al iniciar sesión');
    }
  };

  // Handle Register
  const handleRegisterSubmit = async () => {
    if (!grupoId) {
      setError('Por favor selecciona tu grupo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulación de registro exitoso
      console.log('Register:', { nombre, correoRegister, contrasenaRegister, grupoId });
      alert('Usuario registrado exitosamente');
      setIsSignUp(false);
    } catch (err) {
      setError('Error al registrar usuario');
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
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-toggle">
            <button 
              className={`toggle-btn ${!isSignUp ? 'active' : ''}`}
              onClick={() => {
                setIsSignUp(false);
                setError('');
              }}
            >
              Iniciar Sesión
            </button>
            <button 
              className={`toggle-btn ${isSignUp ? 'active' : ''}`}
              onClick={() => {
                setIsSignUp(true);
                setError('');
              }}
            >
              Registrarse
            </button>
          </div>

          {/* Formulario de Login */}
          {!isSignUp && (
            <div className="auth-form">
              <h2 className="form-title">Bienvenido de vuelta</h2>
              <p className="form-subtitle">Inicia sesión en tu cuenta</p>
              
              {error && (
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
                />
              </div>
              
              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input 
                  type={mostrarContrasenaLogin ? 'text' : 'password'}
                  value={contrasenaLogin}
                  onChange={(e) => setContrasenaLogin(e.target.value)}
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setMostrarContrasenaLogin(!mostrarContrasenaLogin)}
                >
                  {mostrarContrasenaLogin ? 'OCULTAR' : 'MOSTRAR'}
                </button>
              </div>
              
              <div className="forgot-password-container">
                <a href="/forgot-password" className="forgot-password-link">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              
              <button onClick={handleLoginSubmit} className="submit-btn">
                Iniciar Sesión
              </button>
            </div>
          )}

          {/* Formulario de Registro */}
          {isSignUp && (
            <div className="auth-form">
              <h2 className="form-title">Crear cuenta</h2>
              <p className="form-subtitle">Únete a LabSync</p>
              
              {error && (
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
                  {grupos.slice(0, 4).map((grupo) => (
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
                {grupos.length > 4 && (
                  <div className="grupos-grid-second-row">
                    {grupos.slice(4, 7).map((grupo) => (
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
              
              <button 
                onClick={handleRegisterSubmit} 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Creando..." : "Registrarse"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800&display=swap");
        @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css");

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Poppins", sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .auth-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 450px;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .auth-toggle {
          display: flex;
          background: #f8f9fa;
          border-radius: 50px;
          padding: 4px;
          margin-bottom: 30px;
          position: relative;
        }

        .toggle-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #666;
          font-weight: 600;
          font-size: 14px;
          border-radius: 46px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .auth-form {
          width: 100%;
        }

        .form-title {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          text-align: center;
          margin-bottom: 8px;
        }

        .form-subtitle {
          color: #666;
          text-align: center;
          margin-bottom: 30px;
          font-size: 14px;
        }

        .error-alert {
          width: 100%;
          background-color: #fee;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 4px solid #c53030;
        }

        .input-field {
          width: 100%;
          background-color: #f8f9fa;
          margin-bottom: 20px;
          height: 55px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          position: relative;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .input-field:focus-within {
          border-color: #667eea;
          background-color: #fff;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-field i {
          color: #666;
          font-size: 18px;
          margin-right: 15px;
          min-width: 20px;
        }

        .input-field input {
          background: none;
          outline: none;
          border: none;
          flex: 1;
          font-weight: 500;
          font-size: 15px;
          color: #333;
        }

        .input-field input::placeholder {
          color: #999;
          font-weight: 400;
        }

        .show-password-btn {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          padding: 5px;
          margin-left: 10px;
        }

        .show-password-btn:hover {
          color: #5a67d8;
        }

        .forgot-password-container {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin-bottom: 25px;
        }

        .forgot-password-link {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }

        .forgot-password-link:hover {
          color: #5a67d8;
          text-decoration: underline;
        }

        .grupo-selection {
          width: 100%;
          margin-bottom: 25px;
        }

        .grupo-label {
          display: block;
          color: #333;
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 15px;
          text-align: left;
        }

        .grupos-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 10px;
        }

        .grupos-grid-second-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .grupo-btn {
          padding: 10px 8px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          color: #666;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          min-height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .grupo-btn:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }

        .grupo-btn.selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .grupo-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          outline: none;
          height: 55px;
          border-radius: 15px;
          color: #fff;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .auth-container {
            padding: 15px;
          }

          .auth-card {
            padding: 30px 25px;
            max-width: 400px;
          }

          .form-title {
            font-size: 1.75rem;
          }

          .grupos-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .grupos-grid-second-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .grupo-btn {
            font-size: 11px;
            padding: 8px 6px;
            min-height: 40px;
          }
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 25px 20px;
            margin: 10px;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .input-field {
            height: 50px;
            padding: 0 15px;
          }

          .input-field i {
            margin-right: 12px;
          }

          .submit-btn {
            height: 50px;
            font-size: 15px;
          }

          .grupo-btn {
            font-size: 10px;
            padding: 6px 4px;
            min-height: 35px;
          }
        }
      `}</style>
    </>
  );
}
