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

        <div className="forms-container">
          <div className="signin-signup">
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

              <input
                type="submit"
                className="btn solid"
                value={loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                disabled={loading || !passwordValidation.isValid}
              />
            </form>
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
          background-image: linear-gradient(-45deg, #4481eb 0%, #04befe 100%);
          overflow: hidden;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
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
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.25);
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
          background: rgba(255, 193, 7, 0.3);
          border-color: rgba(255, 193, 7, 0.4);
          animation: float2 8s ease-in-out infinite;
        }

        .circle-3 {
          width: 25px;
          height: 25px;
          top: 30px;
          left: 90px;
          background: rgba(40, 167, 69, 0.3);
          border-color: rgba(40, 167, 69, 0.4);
          animation: float3 7s ease-in-out infinite;
        }

        .circle-4 {
          width: 35px;
          height: 35px;
          top: -20px;
          left: 60px;
          background: rgba(220, 53, 69, 0.3);
          border-color: rgba(220, 53, 69, 0.4);
          animation: float1 9s ease-in-out infinite;
        }

        /* Cuadrados flotantes */
        .floating-square {
          position: absolute;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.25);
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
          background: rgba(255, 193, 7, 0.3);
          border-color: rgba(255, 193, 7, 0.4);
          animation: rotate2 12s linear infinite;
        }

        .square-3 {
          width: 40px;
          height: 40px;
          top: 20px;
          right: 10px;
          background: rgba(23, 162, 184, 0.3);
          border-color: rgba(23, 162, 184, 0.4);
          animation: rotate1 8s linear infinite;
        }

        /* Triángulo */
        .floating-triangle {
          width: 0;
          height: 0;
          border-left: 25px solid transparent;
          border-right: 25px solid transparent;
          border-bottom: 45px solid rgba(255, 255, 255, 0.15);
          position: absolute;
          top: 20px;
          right: 80px;
          animation: float2 11s ease-in-out infinite;
        }

        /* Hexágonos */
        .floating-hexagon {
          width: 50px;
          height: 30px;
          background: rgba(255, 255, 255, 0.15);
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
          border-bottom: 15px solid rgba(255, 255, 255, 0.15);
        }

        .floating-hexagon:after {
          top: 100%;
          border-top: 15px solid rgba(255, 255, 255, 0.15);
        }

        .hex-1 {
          animation: float3 8s ease-in-out infinite;
        }

        .hex-2 {
          top: 60px;
          left: 50px;
          background: rgba(40, 167, 69, 0.3);
          animation: float1 10s ease-in-out infinite;
        }

        .hex-2:before {
          border-bottom-color: rgba(40, 167, 69, 0.3);
        }

        .hex-2:after {
          border-top-color: rgba(40, 167, 69, 0.3);
        }

        /* Diamantes */
        .floating-diamond {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          position: absolute;
          transform: rotate(45deg);
          border-radius: 5px;
        }

        .diamond-1 {
          background: rgba(220, 53, 69, 0.3);
          animation: rotate2 9s linear infinite;
        }

        .diamond-2 {
          width: 30px;
          height: 30px;
          top: 50px;
          right: 30px;
          background: rgba(255, 193, 7, 0.3);
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
          left: 50%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        .reset-password-form {
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

        .title {
          font-size: 2.2rem;
          color: #444;
          margin-bottom: 5px;
        }

        .subtitle {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 400;
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

        .success-alert {
          max-width: 380px;
          width: 100%;
          background-color: #d4edda;
          color: #155724;
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
          grid-template-columns: 15% 70% 15%;
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

        .password-requirements {
          max-width: 380px;
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 12px 16px;
          margin: 5px 0 10px 0;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .requirement {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }

        .requirement.valid {
          color: #22c55e;
        }

        .requirement.valid i {
          color: #22c55e;
        }

        .requirement.invalid {
          color: #ef4444;
        }

        .requirement.invalid i {
          color: #ef4444;
        }

        .btn {
          width: 200px;
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

          .reset-password-form {
            margin-top: 0px;
          }

          .decoration {
            transform: scale(0.8);
          }
        }

        @media (max-width: 570px) {
          .container {
            overflow: hidden;
            min-height: 100vh;
            height: 100vh;
          }

          .reset-password-form {
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

          .title {
            font-size: 1.8rem;
          }

          .subtitle {
            font-size: 0.8rem;
          }

          .decoration {
            display: none;
          }

          .btn {
            width: 180px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  );
}
