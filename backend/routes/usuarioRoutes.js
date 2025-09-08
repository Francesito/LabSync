// backend/routes/usuarioRoutes.js
const express = require('express');
const {
  obtenerUsuarios,
  desactivarUsuario,
  obtenerPerfil,
  actualizarNombre,
  eliminarCuenta,
} = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verificarToken, verificarRol([3]), obtenerUsuarios); // Solo almacén
router.put('/desactivar/:id', verificarToken, verificarRol([3]), desactivarUsuario); // Solo almacén

// Rutas disponibles para cualquier usuario autenticado
router.get('/me', verificarToken, obtenerPerfil);
router.put('/nombre', verificarToken, actualizarNombre);
router.delete('/me', verificarToken, eliminarCuenta);

module.exports = router;
