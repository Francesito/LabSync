'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

export default function ResetPassword() {
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasNumber: false,
    isValid: false
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useParams();

  useEffect(() => {
    const hasMinLength = contrasena.length >= 8;
    const hasNumber = /\d/.test(contrasena);
    const isValid = hasMinLength && hasNumber;
    
    setPasswordValidation({
      hasMinLength,
      hasNumber,
      isValid
    });
  }, [contrasena]);

  const handlePasswordChange = (e) => {
    setContrasena(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      setError('La contraseña debe tener al menos 8 caracteres y un número');
      return;
    }
    
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${token}`,
        { contrasena }
      );
      setMensaje(response.data.mensaje);
      setError('');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña');
      setMensaje('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container">
        {/* Decoraciones en las esquinas */}
        <div className="decoration top-left">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>
        
        <div className="decoration top-right">
          <div className="floating-square square-1"></div>
          <div className="floating-square square-2"></div>
          <div className="floating-triangle"></div>
        </div>
        
        <div className="decoration bottom-left">
          <div className="floating-hexagon hex-1"></div>
          <div className="floating-hexagon hex-2"></div>
          <div className="floating-circle circle-4"></div>
        </div>
        
        <div className="decoration bottom-right">
          <div className="floating-diamond diamond-1"></div>
          <div className="floating-diamond diamond-2"></div>
          <div className="floating-square square-3"></div>
        </div>

        <div className="main-content">
          <div className="form-container">
            <form onSubmit={handleSubmit} className="reset-password-form">
              <h2 className="title">Restablecer Contraseña</h2>
              <p className="subtitle">Crea una nueva contraseña segura para tu cuenta</p>

              {error && (
                <div className="error-alert">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              {mensaje && (
                <div className="success-alert">
                  <i className="fas fa-check-circle"></i>
                  {mensaje}
                </div>
              )}

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={contrasena}
                  onChange={handlePasswordChange}
                  placeholder="Nueva Contraseña"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  disabled={loading}
                >
                  {mostrarContrasena ? 'OCULTAR' : 'MOSTRAR'}
                </button>
              </div>

              {/* Indicadores de validación de contraseña */}
              {contrasena && (
                <div className="password-requirements">
                  <div className={`requirement ${passwordValidation.hasMinLength ? 'valid' : 'invalid'}`}>
                    <i className={`fas ${passwordValidation.hasMinLength ? 'fa-check' : 'fa-times'}`}></i>
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`requirement ${passwordValidation.hasNumber ? 'valid' : 'invalid'}`}>
                    <i className={`fas ${passwordValidation.hasNumber ? 'fa-check' : 'fa-times'}`}></i>
                    <span>Al menos 1 número</span>
                  </div>
                </div>
              )}

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type={mostrarConfirmarContrasena ? 'text' : 'password'}
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  placeholder="Confirmar Contraseña"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setMostrarConfirmarContrasena(!mostrarConfirmarContrasena)}
                  disabled={loading}
                >
                  {mostrarConfirmarContrasena ? 'OCULTAR' : 'MOSTRAR'}
                </button>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading || !passwordValidation.isValid}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Restableciendo...
                  </>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>
          </div>
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

        html, body {
          width: 100%;
          height: 100%;
          font-family: "Poppins", sans-serif;
          overflow-x: hidden;
        }

        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .container {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* Decoraciones flotantes */
        .decoration {
          position: fixed;
          z-index: 1;
        }

        .top-left {
          top: 5%;
          left: 5%;
        }

        .top-right {
          top: 8%;
          right: 6%;
        }

        .bottom-left {
          bottom: 8%;
          left: 4%;
        }

        .bottom-right {
          bottom: 6%;
          right: 5%;
        }

        /* Círculos flotantes */
        .floating-circle {
          border-radius: 50%;
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .circle-1 {
          width: 60px;
          height: 60px;
          animation: float1 6s ease-in-out infinite;
        }

        .circle-2 {
          width: 40px;
          height: 40px;
          top: 80px;
          left: 30px;
          background: rgba(255, 193, 7, 0.2);
          border-color: rgba(255, 193, 7, 0.3);
          animation: float2 8s ease-in-out infinite;
        }

        .circle-3 {
          width: 25px;
          height: 25px;
          top: 30px;
          left: 90px;
          background: rgba(40, 167, 69, 0.2);
          border-color: rgba(40, 167, 69, 0.3);
          animation: float3 7s ease-in-out infinite;
        }

        .circle-4 {
          width: 35px;
          height: 35px;
          top: -20px;
          left: 60px;
          background: rgba(220, 53, 69, 0.2);
          border-color: rgba(220, 53, 69, 0.3);
          animation: float1 9s ease-in-out infinite;
        }

        /* Cuadrados flotantes */
        .floating-square {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          transform: rotate(45deg);
        }

        .square-1 {
          width: 50px;
          height: 50px;
          animation: rotate1 10s linear infinite;
        }

        .square-2 {
          width: 30px;
          height: 30px;
          top: 70px;
          right: 40px;
          background: rgba(255, 193, 7, 0.2);
          border-color: rgba(255, 193, 7, 0.3);
          animation: rotate2 12s linear infinite;
        }

        .square-3 {
          width: 40px;
          height: 40px;
          top: 20px;
          right: 10px;
          background: rgba(23, 162, 184, 0.2);
          border-color: rgba(23, 162, 184, 0.3);
          animation: rotate1 8s linear infinite;
        }

        /* Triángulo */
        .floating-triangle {
          width: 0;
          height: 0;
          border-left: 25px solid transparent;
          border-right: 25px solid transparent;
          border-bottom: 45px solid rgba(255, 255, 255, 0.1);
          position: absolute;
          top: 20px;
          right: 80px;
          animation: float2 11s ease-in-out infinite;
        }

        /* Hexágonos */
        .floating-hexagon {
          width: 50px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
          position: absolute;
          transform: rotate(90deg);
        }

        .floating-hexagon:before,
        .floating-hexagon:after {
          content: "";
          position: absolute;
          width: 0;
          border-left: 25px solid transparent;
          border-right: 25px solid transparent;
        }

        .floating-hexagon:before {
          bottom: 100%;
          border-bottom: 15px solid rgba(255, 255, 255, 0.1);
        }

        .floating-hexagon:after {
          top: 100%;
          border-top: 15px solid rgba(255, 255, 255, 0.1);
        }

        .hex-1 {
          animation: float3 8s ease-in-out infinite;
        }

        .hex-2 {
          top: 60px;
          left: 50px;
          background: rgba(40, 167, 69, 0.2);
          animation: float1 10s ease-in-out infinite;
        }

        .hex-2:before {
          border-bottom-color: rgba(40, 167, 69, 0.2);
        }

        .hex-2:after {
          border-top-color: rgba(40, 167, 69, 0.2);
        }

        /* Diamantes */
        .floating-diamond {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          position: absolute;
          transform: rotate(45deg);
          border-radius: 5px;
        }

        .diamond-1 {
          background: rgba(220, 53, 69, 0.2);
          animation: rotate2 9s linear infinite;
        }

        .diamond-2 {
          width: 30px;
          height: 30px;
          top: 50px;
          right: 30px;
          background: rgba(255, 193, 7, 0.2);
          animation: rotate1 7s linear infinite;
        }

        /* Animaciones */
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-15px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-25px) translateX(-10px); }
          66% { transform: translateY(-15px) translateX(20px); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-35px) translateX(15px) rotate(180deg); }
        }

        @keyframes rotate1 {
          0% { transform: rotate(45deg); }
          100% { transform: rotate(405deg); }
        }

        @keyframes rotate2 {
          0% { transform: rotate(45deg); }
          100% { transform: rotate(-315deg); }
        }

        /* Contenido principal */
        .main-content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 500px;
          padding: 2rem;
        }

        .form-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }

        .reset-password-form {
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .title {
          font-size: 2.5rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-weight: 700;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: #718096;
          font-size: 1rem;
          text-align: center;
          margin-bottom: 2rem;
          font-weight: 400;
        }

        .error-alert, .success-alert {
          width: 100%;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .error-alert {
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          color: #c53030;
          border: 1px solid #fc8181;
        }

        .success-alert {
          background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
          color: #2f855a;
          border: 1px solid #68d391;
        }

        .input-field {
          width: 100%;
          background: #f7fafc;
          margin: 0.75rem 0;
          height: 60px;
          border-radius: 15px;
          display: grid;
          grid-template-columns: 60px 1fr auto;
          align-items: center;
          padding: 0 1rem;
          position: relative;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .input-field:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: #ffffff;
        }

        .input-field i {
          color: #a0aec0;
          font-size: 1.2rem;
          text-align: center;
          transition: color 0.3s ease;
        }

        .input-field:focus-within i {
          color: #667eea;
        }

        .input-field input {
          background: none;
          outline: none;
          border: none;
          font-weight: 500;
          font-size: 1rem;
          color: #2d3748;
          width: 100%;
          padding: 0 0.5rem;
        }

        .input-field input::placeholder {
          color: #a0aec0;
          font-weight: 400;
        }

        .show-password-btn {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .show-password-btn:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #5a67d8;
        }

        .password-requirements {
          width: 100%;
          background: rgba(247, 250, 252, 0.8);
          border-radius: 12px;
          padding: 1rem;
          margin: 0.5rem 0 1rem 0;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .requirement {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.5rem 0;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .requirement.valid {
          color: #2f855a;
        }

        .requirement.valid i {
          color: #38a169;
          background: rgba(56, 161, 105, 0.1);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .requirement.invalid {
          color: #c53030;
        }

        .requirement.invalid i {
          color: #e53e3e;
          background: rgba(229, 62, 62, 0.1);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          outline: none;
          height: 55px;
          border-radius: 15px;
          color: #ffffff;
          font-weight: 600;
          font-size: 1.1rem;
          margin-top: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 5px 10px rgba(102, 126, 234, 0.1);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .main-content {
            max-width: 95%;
            padding: 1rem;
          }

          .reset-password-form {
            padding: 2rem 1.5rem;
          }

          .title {
            font-size: 2rem;
          }

          .subtitle {
            font-size: 0.9rem;
          }

          .decoration {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .reset-password-form {
            padding: 1.5rem 1rem;
          }

          .title {
            font-size: 1.75rem;
          }

          .input-field {
            height: 55px;
            grid-template-columns: 50px 1fr auto;
          }

          .btn-submit {
            height: 50px;
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
}
