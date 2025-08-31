'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  // Overlay azul que se "derrite"
  const [showMelt, setShowMelt] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowMelt(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        correo_institucional: correo,
        contrasena,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('nombre', data.nombre);
      setRedirecting(true);
      router.replace('/catalog');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  if (redirecting) return <div className="min-vh-100 bg-white" />;

  return (
    <>
      {showMelt && <div className="melt-overlay" aria-hidden="true"></div>}

      <div className="page">
        <div className="row w-100 m-0 min-vh-100">
          {/* IZQUIERDA (7/12): círculos y copy dentro del círculo grande */}
          <div className="col-12 col-lg-7 position-relative p-0 left-pane">
            {/* Círculo grande principal */}
            <div className="giant-circle" />
            
            {/* Contenedor del texto centrado dentro del círculo grande */}
            <div className="text-center-container">
              <div className="brand-copy">
                <h1 className="brand-title">LabSync.</h1>
                <h2 className="brand-subtitle">
                  Solicita préstamos para materiales y reactivos de química.
                </h2>
              </div>
            </div>

            {/* Círculo pequeño en la parte inferior izquierda */}
            <div className="small-circle bottom-left" />
            
            {/* Círculo mediano en la parte superior derecha del área izquierda */}
            <div className="medium-circle top-right" />
          </div>

          {/* DERECHA (5/12): formulario centrado */}
          <div className="col-12 col-lg-5 p-0 right-pane">
            <div className="form-wrap">
              <div className="form-card">
                <h2 className="form-title">Iniciar sesión</h2>
                <p className="form-subtitle">Accede con tu correo institucional y contraseña</p>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-person-fill input-icon"></i>
                      <input
                        type="email"
                        id="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="form-control input-custom"
                        placeholder="Nombre de usuario"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="position-relative input-group-custom">
                      <i className="bi bi-lock-fill input-icon"></i>
                      <input
                        type={mostrarContrasena ? 'text' : 'password'}
                        id="contrasena"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        className="form-control input-custom"
                        placeholder="Contraseña"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="show-btn"
                        onClick={() => setMostrarContrasena(!mostrarContrasena)}
                      >
                        {mostrarContrasena ? 'OCULTAR' : 'MOSTRAR'}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mb-4">
                    <Link href="/forgot-password" className="forgot-link">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button type="submit" className="btn-signin">Iniciar sesión</button>
                </form>

                <div className="divider-container">
                  <div className="divider-line"></div>
                  <span className="divider-text">O</span>
                  <div className="divider-line"></div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => router.push('/register')}
                >
                  Iniciar con otra cuenta
                </button>

                <p className="signup-text">
                  ¿No tienes una cuenta?{' '}
                  <Link href="/register" className="signup-link">Regístrate</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(html, body) { background:#fff; }
        .page { background:#fff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }

        /* ===== Overlay de "derretido" ===== */
        .melt-overlay{
          position:fixed; inset:0; z-index:9999;
          background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);
          animation:melt 1.8s ease-in-out forwards;
        }
        @keyframes melt{
          0%{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);opacity:1}
          40%{clip-path:polygon(0 0,100% 0,100% 85%,0 95%)}
          70%{clip-path:polygon(0 0,100% 0,100% 65%,0 80%)}
          85%{clip-path:polygon(0 0,100% 0,100% 40%,0 60%)}
          100%{clip-path:polygon(0 0,100% 0,100% 0,0 0);opacity:0}
        }
        .melt-overlay::after,.melt-overlay::before{
          content:'';position:absolute;left:0;right:0;bottom:0;height:140px;filter:blur(.5px);
          background:
            radial-gradient(60px 60px at 15% 20%, rgba(255,255,255,.35) 0 30%, transparent 31%) no-repeat,
            radial-gradient(45px 45px at 45% 35%, rgba(255,255,255,.25) 0 30%, transparent 31%) no-repeat,
            radial-gradient(70px 70px at 75% 25%, rgba(255,255,255,.30) 0 30%, transparent 31%) no-repeat;
          animation:drips 1.2s ease-in-out forwards;
        }
        .melt-overlay::before{bottom:10px;opacity:.7;animation-delay:.2s}
        @keyframes drips{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(120%);opacity:0}}

        /* ===== Layout panes ===== */
        .left-pane{
          position:relative; background:#fff; min-height:100vh; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
        }
        .right-pane{background:#fff; min-height:100vh;}
        .form-wrap{min-height:100vh; display:grid; place-items:center; padding:32px;}
        .form-card{
          width:100%; max-width:420px; background:#fff; padding:28px;
          border-radius:16px; box-shadow:0 8px 30px rgba(2,6,23,.08);
        }

        /* ===== Círculo grande principal =====
           Centrado en el área izquierda con el texto dentro */
        .giant-circle{
          position:absolute;
          width:min(70vw, 600px); height:min(70vw, 600px);
          top:50%; left:50%; transform:translate(-50%, -50%);
          border-radius:50%;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,.25), rgba(255,255,255,.08) 42%, rgba(0,0,0,.08) 70%, rgba(0,0,0,.16)),
            linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);
          box-shadow:0 20px 60px rgba(0,0,0,.18) inset, 0 10px 30px rgba(0,0,0,.12);
          z-index:1;
        }

        /* Contenedor del texto centrado dentro del círculo */
        .text-center-container{
          position:absolute;
          top:50%; left:50%; transform:translate(-50%, -50%);
          width:min(60vw, 500px); height:min(60vw, 500px);
          display:flex; align-items:center; justify-content:center;
          text-align:center; z-index:2; pointer-events:none;
        }
        
        .brand-copy{ 
          padding:24px; max-width:80%; 
        }
        .brand-title{
          color:#fff; font-size:clamp(2.5rem, 6vw, 4.5rem);
          font-weight:800; letter-spacing:.06em; margin:0 0 .6rem 0;
          text-shadow:0 2px 10px rgba(0,0,0,.15);
        }
        .brand-subtitle{
          color:#f3f4f6; font-size:clamp(1rem, 2.4vw, 1.4rem);
          font-weight:500; margin:0 auto; line-height:1.4;
          text-shadow:0 1px 6px rgba(0,0,0,.15); max-width:90%;
        }

        /* ===== Círculo pequeño inferior izquierdo ===== */
        .small-circle.bottom-left{
          position:absolute;
          width:min(25vw, 200px); height:min(25vw, 200px);
          bottom:-12.5vw; left:-12.5vw; /* la mitad del tamaño para centrarlo en la esquina */
          border-radius:50%;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,.30), rgba(255,255,255,.08) 40%, rgba(0,0,0,.08) 70%, rgba(0,0,0,.16)),
            linear-gradient(135deg, rgba(37,99,235,.95), rgba(29,78,216,.95));
          box-shadow:0 10px 30px rgba(0,0,0,.18) inset, 0 6px 18px rgba(0,0,0,.12);
          z-index:2;
        }

        /* ===== Círculo mediano superior derecho ===== */
        .medium-circle.top-right{
          position:absolute;
          width:min(35vw, 280px); height:min(35vw, 280px);
          top:-17.5vw; right:-17.5vw; /* la mitad del tamaño para centrarlo en la esquina */
          border-radius:50%;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,.25), rgba(255,255,255,.08) 42%, rgba(0,0,0,.08) 70%, rgba(0,0,0,.16)),
            linear-gradient(135deg, rgba(37,99,235,.90), rgba(29,78,216,.90));
          box-shadow:0 15px 40px rgba(0,0,0,.18) inset, 0 8px 24px rgba(0,0,0,.12);
          z-index:1;
        }

        /* ===== Formulario (derecha) ===== */
        .form-title{ font-size:2.2rem; font-weight:700; color:#1f2937; margin:0 0 .25rem 0; }
        .form-subtitle{ color:#6b7280; margin-bottom:1.5rem; font-size:.95rem; }

        .input-group-custom{ position:relative; }
        .input-icon{
          position:absolute; left:16px; top:50%; transform:translateY(-50%);
          color:#6b7280; font-size:1.1rem; z-index:3;
        }
        .input-custom{
          background:#e5e7eb; border:none; border-radius:12px;
          padding:16px 20px 16px 48px; font-size:1rem; color:#374151; width:100%;
          transition:background .25s ease;
        }
        .input-custom:focus{ background:#d1d5db; outline:none; }
        .input-custom::placeholder{ color:#6b7280; }
        .show-btn{
          position:absolute; right:16px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:#2563eb; font-weight:700; font-size:.85rem; cursor:pointer;
        }

        .forgot-link{ color:#2563eb; text-decoration:none; font-size:.9rem; font-weight:500; }
        .forgot-link:hover{ color:#1d4ed8; }

        .btn-signin{
          background:#0f4aa8; color:#fff; border:none; border-radius:12px;
          padding:16px; font-size:1rem; font-weight:700; width:100%; margin-bottom:1.6rem;
          cursor:pointer; transition:transform .2s ease, background .2s ease;
        }
        .btn-signin:hover{ background:#0d3f90; transform:translateY(-1px); }

        .btn-secondary{
          display:block; background:#fff; color:#374151; border:2px solid #d1d5db; border-radius:12px;
          padding:16px; font-size:1rem; font-weight:600; width:100%; text-align:center; margin-bottom:1rem;
          transition:background .2s ease, border-color .2s ease;
        }
        .btn-secondary:hover{ background:#f9fafb; border-color:#9ca3af; }

        .divider-container{ display:flex; align-items:center; margin:1.4rem 0; }
        .divider-line{ flex:1; height:1px; background:#d1d5db; }
        .divider-text{ margin:0 1rem; color:#6b7280; font-size:.9rem; }

        .signup-text{ text-align:center; color:#6b7280; font-size:.95rem; margin:0; }
        .signup-link{ color:#2563eb; font-weight:700; text-decoration:none; }
        .signup-link:hover{ color:#1d4ed8; }

        /* ===== Responsive ===== */
        @media (max-width: 991.98px){
          .left-pane{ min-height:60vh; }
          .form-wrap{ min-height:60vh; padding:24px; }
          .form-card{ box-shadow:none; padding:24px; }
          
          .giant-circle{ 
            width:min(85vw, 500px); height:min(85vw, 500px); 
          }
          .text-center-container{
            width:min(75vw, 450px); height:min(75vw, 450px);
          }
          .small-circle.bottom-left{ 
            width:min(30vw, 150px); height:min(30vw, 150px);
            bottom:-15vw; left:-15vw;
          }
          .medium-circle.top-right{ 
            width:min(40vw, 200px); height:min(40vw, 200px);
            top:-20vw; right:-20vw;
          }
          
          .brand-title{ font-size:clamp(2rem, 8vw, 3.5rem); }
          .brand-subtitle{ font-size:clamp(0.95rem, 3.2vw, 1.25rem); }
        }

        @media (max-width: 575.98px){
          .giant-circle{ 
            width:min(95vw, 400px); height:min(95vw, 400px); 
          }
          .text-center-container{
            width:min(85vw, 350px); height:min(85vw, 350px);
          }
          .small-circle.bottom-left{ 
            width:min(35vw, 120px); height:min(35vw, 120px);
            bottom:-17.5vw; left:-17.5vw;
          }
          .medium-circle.top-right{ 
            width:min(45vw, 160px); height:min(45vw, 160px);
            top:-22.5vw; right:-22.5vw;
          }
        }
      `}</style>
    </>
  );
}
