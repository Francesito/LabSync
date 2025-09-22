'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

export default function ResetPassword() {
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState('empty');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useParams();

  const evaluatePasswordStatus = (password) => {
    if (!password) return 'empty';
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const nearLength = password.length >= 6;

    if (hasMinLength && hasNumber) return 'valid';
    if (hasMinLength || (hasNumber && nearLength) || (nearLength && !hasNumber)) return 'almost';
    return 'invalid';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setContrasena(newPassword);
    setPasswordStatus(evaluatePasswordStatus(newPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordStatus !== 'valid') {
      setError('La contraseña debe tener al menos 8 caracteres y un número');
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
        <div className="forms-container">
          <div className="signin-signup">
            <form onSubmit={handleSubmit} className="reset-password-form">
              <h2 className="title">Restablecer Contraseña</h2>

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

              <div className={`input-field password-field ${passwordStatus}`}>
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
                value={loading ? 'Restableciendo...' : 'Restablecer'}
                disabled={loading}
              />
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel center-panel">
            <div className="content">
              <h3>Nueva Contraseña</h3>
              <p>
                Crea una nueva contraseña segura para tu cuenta de LabSync
              </p>
            </div>
            <img src="/log.png" className="image" alt="Reset password illustration" />
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
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50%;
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
          z-index: 2;
          opacity: 1;
          position: relative;
          pointer-events: all;
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

        .success-alert {
          max-width: 380px;
          width: 100%;
          background-color: #d1edff;
          color: #0c4a6e;
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
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-image: linear-gradient(-45deg, #4481eb 0%, #04befe 100%);
          border-radius: 50%;
          z-index: 1;
        }

        .image {
          width: 100%;
          max-width: 300px;
          transition: transform 1.1s ease-in-out;
          transition-delay: 0.4s;
        }

        .center-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 2;
          color: #fff;
          padding: 3rem;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
          margin-bottom: 2rem;
        }

        .panel h3 {
          font-weight: 600;
          line-height: 1;
          font-size: 1.8rem;
          margin-bottom: 1rem;
        }

        .panel p {
          font-size: 1rem;
          padding: 0.7rem 0;
          max-width: 400px;
        }

        @media (max-width: 870px) {
          .container {
            overflow: hidden;
            min-height: 100vh;
            height: 100vh;
          }

          .signin-signup {
            width: 90%;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .reset-password-form {
            padding: 0 2rem;
          }

          .panels-container {
            flex-direction: column;
            justify-content: flex-end;
            padding-bottom: 2rem;
          }

          .center-panel {
            padding: 2rem;
          }

          .image {
            max-width: 200px;
          }

          .panel h3 {
            font-size: 1.4rem;
          }

          .panel p {
            font-size: 0.85rem;
            padding: 0.5rem 0;
          }

          .container:before {
            width: 1500px;
            height: 1500px;
          }
        }

        @media (max-width: 570px) {
          .container {
            overflow: hidden;
            min-height: 100vh;
            height: 100vh;
          }

          .signin-signup {
            width: 95%;
            top: 35%;
          }

          .reset-password-form {
            padding: 0 1.5rem;
          }

          .title {
            font-size: 1.8rem;
          }

          .input-field {
            max-width: 100%;
          }

          .image {
            max-width: 150px;
          }

          .center-panel {
            padding: 1.5rem;
          }

          .panel h3 {
            font-size: 1.2rem;
          }

          .panel p {
            font-size: 0.8rem;
            padding: 0.4rem 0;
          }

          .container:before {
            width: 1200px;
            height: 1200px;
          }
        }
      `}</style>
    </>
  );
}
