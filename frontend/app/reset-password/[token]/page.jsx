'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

export default function ResetPassword() {
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
   const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { token } = useParams();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setMensaje('');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${token}`,
        { contrasena }
      );

        setMensaje(response.data.mensaje || 'Contraseña restablecida exitosamente');
      setContrasena('');
      setConfirmarContrasena('');
      
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña');
      setMensaje('');
        } finally {
      setLoading(false);
    }
  };
  
  return (
   <div className="reset-wrapper">
      <div className="background-shape shape-1" aria-hidden="true" />
      <div className="background-shape shape-2" aria-hidden="true" />

      <div className="reset-card">
        <div className="card-header">
          <h2>Restablecer contraseña</h2>
          <p>Ingresa tu nueva contraseña para acceder nuevamente a la plataforma.</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          {error && <p className="feedback error">{error}</p>}
          {mensaje && <p className="feedback success">{mensaje}</p>}

          <label className="input-group">
            <span>Nueva contraseña</span>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
              required
            />
           </label>

          <label className="input-group">
            <span>Confirmar contraseña</span>
            <input
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
               placeholder="••••••••"
              required
            />
         </label>

          <button type="submit" className="submit-button" disabled={loading}>
            <span>{loading ? 'Restableciendo…' : 'Restablecer'}</span>
            <span className="button-glow" aria-hidden="true" />
          </button>
        </form>
      </div>

         <style jsx>{`
        .reset-wrapper {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          overflow: hidden;
          font-family: 'Poppins', sans-serif;
        }

        .background-shape {
          position: absolute;
          width: 440px;
          height: 440px;
          border-radius: 50%;
          filter: blur(0.2rem);
          opacity: 0.55;
          animation: float 12s ease-in-out infinite;
        }

        .shape-1 {
          top: -160px;
          left: -120px;
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0));
          animation-delay: 0s;
        }

        .shape-2 {
          bottom: -200px;
          right: -80px;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0));
          animation-delay: 4s;
        }

        .reset-card {
          position: relative;
          z-index: 5;
          width: min(480px, 100%);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 24px;
          padding: 2.75rem 2.5rem;
          box-shadow: 0 25px 60px rgba(15, 81, 173, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          transform: translateY(0);
          animation: card-enter 0.9s ease forwards;
        }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .card-header h2 {
          font-size: clamp(1.75rem, 2vw + 1rem, 2.4rem);
          color: #1b3a57;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .card-header p {
          margin-top: 0.5rem;
          font-size: 0.95rem;
          color: #4f5d75;
          line-height: 1.5;
        }

        .reset-form {
          display: grid;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          color: #334e68;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .input-group input {
          padding: 0.85rem 1rem;
          border-radius: 14px;
          border: 1.5px solid rgba(27, 58, 87, 0.18);
          background: rgba(255, 255, 255, 0.9);
          transition: border 0.25s ease, box-shadow 0.25s ease;
          font-size: 0.95rem;
          color: #1b3a57;
        }

        .input-group input:focus {
          outline: none;
          border-color: rgba(32, 99, 247, 0.85);
          box-shadow: 0 10px 25px rgba(66, 135, 245, 0.25);
        }

        .feedback {
          padding: 0.85rem 1rem;
          border-radius: 14px;
          font-size: 0.9rem;
          font-weight: 600;
          box-shadow: 0 12px 25px rgba(15, 81, 173, 0.15);
          animation: fade-in 0.6s ease;
        }

        .feedback.error {
          background: rgba(255, 99, 132, 0.15);
          color: #b00020;
          border: 1px solid rgba(255, 99, 132, 0.3);
        }

        .feedback.success {
          background: rgba(46, 213, 115, 0.18);
          color: #1b7f4c;
          border: 1px solid rgba(46, 213, 115, 0.35);
        }

        .submit-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.95rem 1rem;
          border-radius: 16px;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(135deg, #2b6ef2, #1bcfb4);
          box-shadow: 0 18px 45px rgba(48, 133, 214, 0.35);
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
        }

        .submit-button:disabled {
          cursor: wait;
          filter: grayscale(10%);
          opacity: 0.85;
        }

        .submit-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 55px rgba(48, 133, 214, 0.45);
        }

        .button-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.6), transparent 55%),
            radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.25), transparent 55%),
            radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.25), transparent 65%);
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
          animation: pulse 2.4s ease-in-out infinite;
        }

        .submit-button:not(:disabled):hover .button-glow,
        .submit-button:focus-visible .button-glow {
          opacity: 1;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.65;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(12px, -18px, 0) scale(1.05);
          }
        }

        @keyframes card-enter {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .reset-wrapper {
            padding: 1.75rem 1.25rem;
          }

          .reset-card {
            padding: 2.25rem 1.75rem;
          }
        }

        @media (max-width: 480px) {
          .reset-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
          }

          .card-header h2 {
            font-size: 1.75rem;
          }

          .background-shape {
            width: 320px;
            height: 320px;
          }
        }
      `}</style>
    </div>
  );
}
