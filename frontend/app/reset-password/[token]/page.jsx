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
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasNumber: false,
    isValid: false
  });

  const router = useRouter();
  const params = useParams();
  const token = Array.isArray((params as any)?.token) ? (params as any).token[0] : (params as any)?.token;

  useEffect(() => {
    const hasMinLength = contrasena.length >= 8;
    const hasNumber = /\d/.test(contrasena);
    setPasswordValidation({
      hasMinLength,
      hasNumber,
      isValid: hasMinLength && hasNumber
    });
  }, [contrasena]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordValidation.isValid) {
      setError('La contraseña debe tener al menos 8 caracteres y un número.');
      return;
    }
    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!token) {
      setError('Token no válido o faltante.');
      return;
    }

    setLoading(true);
    setError('');
    setMensaje('');

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${token}`,
        { contrasena }
      );
      setMensaje(data.mensaje || 'Contraseña actualizada correctamente.');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="page">
        <section className="card" aria-labelledby="title">
          <h1 id="title" className="title">Restablecer contraseña</h1>
          <p className="subtitle">Crea una nueva contraseña segura para tu cuenta</p>

          {!!error && (
            <div className="alert alert-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}
          {!!mensaje && (
            <div className="alert alert-success" role="status" aria-live="polite">
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form" noValidate>
            <div className="field">
              <label htmlFor="newpass">Nueva contraseña</label>
              <div className="control">
                <input
                  id="newpass"
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  disabled={loading}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContrasena ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {contrasena && (
                <ul className="hints" aria-live="polite">
                  <li className={passwordValidation.hasMinLength ? 'ok' : 'bad'}>
                    Mínimo 8 caracteres
                  </li>
                  <li className={passwordValidation.hasNumber ? 'ok' : 'bad'}>
                    Al menos 1 número
                  </li>
                </ul>
              )}
            </div>

            <div className="field">
              <label htmlFor="confirmpass">Confirmar contraseña</label>
              <div className="control">
                <input
                  id="confirmpass"
                  type={mostrarConfirmarContrasena ? 'text' : 'password'}
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle"
                  onClick={() => setMostrarConfirmarContrasena((v) => !v)}
                  disabled={loading}
                  aria-label={mostrarConfirmarContrasena ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                >
                  {mostrarConfirmarContrasena ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading || !passwordValidation.isValid}
            >
              {loading ? 'Restableciendo…' : 'Restablecer contraseña'}
            </button>
          </form>
        </section>
      </main>

      <style jsx global>{`
        /* ===== Mini reset + base ===== */
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #__next { height: 100%; }
        body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; color: #111827; background: #f3f4f6; }
        img, svg, video { display: block; max-width: 100%; }
        button { font: inherit; }
        input, button { outline: none; }

        /* ===== Layout sencillo ===== */
        .page {
          min-height: 100%;
          display: grid;
          place-items: center;
          padding: 2rem;
        }
        .card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.04);
        }
        .title { font-size: 1.5rem; margin: 0 0 .25rem; }
        .subtitle { margin: 0 0 1rem; color: #6b7280; font-size: .95rem; }

        .alert {
          border-radius: 10px;
          padding: .75rem .9rem;
          font-size: .9rem;
          margin-bottom: .75rem;
        }
        .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }

        .form { display: grid; gap: 1rem; }
        .field { display: grid; gap: .4rem; }
        label { font-weight: 600; font-size: .95rem; }
        .control {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0 .5rem;
          background: #fafafa;
        }
        input {
          flex: 1;
          border: 0;
          background: transparent;
          height: 44px;
          padding: 0 .25rem;
          font-size: 1rem;
          color: #111827;
        }
        input::placeholder { color: #9ca3af; }
        .toggle {
          margin-left: .25rem;
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: .25rem .5rem;
          border-radius: 8px;
          color: #2563eb;
          font-weight: 600;
          font-size: .85rem;
        }
        .toggle:hover { background: #eef2ff; }

        .hints { list-style: none; padding: 0; margin: .25rem 0 0; font-size: .85rem; }
        .hints li { margin: .2rem 0; }
        .hints .ok { color: #16a34a; }
        .hints .bad { color: #dc2626; }

        .btn {
          height: 46px;
          border-radius: 12px;
          border: 0;
          background: #2563eb;
          color: #fff;
          font-weight: 700;
          letter-spacing: .3px;
          cursor: pointer;
          transition: transform .04s ease, filter .2s ease;
        }
        .btn:hover:not(:disabled) { filter: brightness(1.05); }
        .btn:active:not(:disabled) { transform: translateY(1px); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }

        @media (max-width: 420px) {
          .card { padding: 20px; border-radius: 12px; }
          .title { font-size: 1.35rem; }
        }
      `}</style>
    </>
  );
}
