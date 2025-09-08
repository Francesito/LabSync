'use client';
import { useAuth } from '../../lib/auth';
import { useState } from 'react';
import axios from 'axios';

export default function Cuenta() {
  const { usuario, setUsuario, logout } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [mensaje, setMensaje] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const handleActualizar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.put(
        `${baseUrl}/api/usuarios/nombre`,
        { nombre },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setUsuario({ ...usuario, nombre: data.nombre });
      setMensaje(data.mensaje);
      setIsEditing(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al actualizar nombre');
      setTimeout(() => setMensaje(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible.')) return;
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/usuarios/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      logout();
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al eliminar cuenta');
      setTimeout(() => setMensaje(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setNombre(usuario?.nombre || '');
    setIsEditing(false);
    setMensaje('');
  };

  return (
    <>
      <style jsx>{`
        .profile-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          position: relative;
        }
        
        .profile-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
        }
        
        .profile-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 2rem;
          text-align: center;
          position: relative;
        }
        
        .profile-avatar {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 3rem;
          color: white;
          font-weight: bold;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
          position: relative;
        }
        
        .profile-avatar::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
          z-index: -1;
          animation: rotate 3s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .info-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: none;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border-left: 4px solid #667eea;
        }
        
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
        }
        
        .edit-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: none;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
          border-left: 4px solid #4ecdc4;
        }
        
        .custom-input {
          border: 2px solid #e1e8f0;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
        }
        
        .custom-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
          background: white;
        }
        
        .btn-modern {
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .btn-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .btn-modern:hover::before {
          left: 100%;
        }
        
        .btn-primary-modern {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        
        .btn-primary-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .btn-success-modern {
          background: linear-gradient(135deg, #4ecdc4, #44a08d);
          color: white;
        }
        
        .btn-success-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(78, 205, 196, 0.4);
        }
        
        .btn-secondary-modern {
          background: linear-gradient(135deg, #95a5a6, #7f8c8d);
          color: white;
        }
        
        .btn-secondary-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(149, 165, 166, 0.4);
        }
        
        .btn-danger-modern {
          background: linear-gradient(135deg, #ff6b6b, #ee5a52);
          color: white;
        }
        
        .btn-danger-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }
        
        .info-item {
          background: white;
          border: none;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          margin-bottom: 0.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .info-item:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .page-background {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          padding: 2rem 0;
        }
        
        .alert-modern {
          border: none;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .role-badge {
          background: linear-gradient(135deg, #ffecd2, #fcb69f);
          color: #8b4513;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="page-background">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-8 col-lg-10">
              
              {/* Header Profile Card */}
              <div className="card profile-card mb-4">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <h1 className="h2 mb-2 text-dark fw-bold">Mi Cuenta</h1>
                </div>
              </div>

              {/* Information Card */}
              <div className="card info-card mb-4">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-person-circle text-primary me-2" style={{fontSize: '1.5rem'}}></i>
                    <h2 className="h4 mb-0 fw-bold text-dark">Información Personal</h2>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="info-item">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person text-primary me-3"></i>
                          <div>
                            <small className="text-muted d-block">Nombre</small>
                            <strong className="text-dark">{usuario?.nombre || 'No disponible'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="info-item">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-envelope text-success me-3"></i>
                          <div>
                            <small className="text-muted d-block">Correo electrónico</small>
                            <strong className="text-dark">{usuario?.correo || 'No disponible'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {usuario?.rol_id === 1 && (
                      <div className="col-md-6">
                        <div className="info-item">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-people text-info me-3"></i>
                              <div>
                                <small className="text-muted d-block">Grupo</small>
                                <strong className="text-dark">{usuario?.grupo || 'No asignado'}</strong>
                              </div>
                            </div>
                            <span className="role-badge">Estudiante</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Name Card */}
              <div className="card edit-card mb-4">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-pencil-square text-info me-2" style={{fontSize: '1.5rem'}}></i>
                      <h2 className="h4 mb-0 fw-bold text-dark">Editar Información</h2>
                    </div>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="btn btn-modern btn-primary-modern btn-sm"
                        disabled={loading}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Editar
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleActualizar}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">
                          <i className="bi bi-person me-1"></i>
                          Nuevo nombre
                        </label>
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className="form-control custom-input"
                          placeholder="Ingresa tu nuevo nombre"
                          required
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="d-flex gap-2 flex-wrap">
                        <button 
                          type="submit" 
                          className="btn btn-modern btn-success-modern"
                          disabled={loading || !nombre.trim()}
                        >
                          {loading ? (
                            <>
                              <span className="loading-spinner"></span>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-1"></i>
                              Guardar cambios
                            </>
                          )}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={handleCancelEdit}
                          className="btn btn-modern btn-secondary-modern"
                          disabled={loading}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-muted">
                      <i className="bi bi-info-circle me-2"></i>
                      Haz clic en "Editar" para modificar tu nombre
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card border-danger mb-4">
                <div className="card-body">
                  <p className="text-muted mb-3">
                    Una vez que elimines tu cuenta, no hay vuelta atrás.
                  </p>
                  <button 
                    onClick={handleEliminar}
                    className="btn btn-modern btn-danger-modern"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-1"></i>
                        Eliminar cuenta 
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {mensaje && (
                <div className={`alert alert-modern ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'} mb-4`}>
                  <div className="d-flex align-items-center">
                    <i className={`bi ${mensaje.includes('Error') ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                    {mensaje}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Icons CDN */}
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet" />
    </>
  );
}
