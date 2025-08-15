const express = require('express');
const router = express.Router();
const { obtenerResiduos, registrarResiduo } = require('../controllers/residuoController');

router.get('/', obtenerResiduos);
router.post('/', registrarResiduo);

module.exports = router;
