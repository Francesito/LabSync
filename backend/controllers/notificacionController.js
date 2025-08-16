const {
  crearNotificacion,
  obtenerNotificacionesPorUsuario,
  eliminarNotificacion
} = require('../models/notificacion');

const obtenerNotificaciones = async (req, res) => {
  try {
    const notificaciones = await obtenerNotificacionesPorUsuario(req.usuario.id);
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const eliminar = async (req, res) => {
  const { id } = req.params;
  try {
    await eliminarNotificacion(id, req.usuario.id);
    res.json({ mensaje: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};

module.exports = {
  crearNotificacion,
  obtenerNotificaciones,
  eliminar
};
