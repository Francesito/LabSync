const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/authMiddleware');
const notificacionController = require('../controllers/notificacionController');

router.get('/', verificarToken, notificacionController.obtenerNotificaciones);
router.delete('/:id', verificarToken, notificacionController.eliminar);

module.exports = router;
