const express = require('express');
const router = express.Router();
const { obtenerResiduos, registrarResiduo, eliminarResiduos } = require('../controllers/residuoController');

router.get('/', obtenerResiduos);
router.post('/', registrarResiduo);
router.delete('/', eliminarResiduos);

module.exports = router;
