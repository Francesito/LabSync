const pool = require('../config/db');

const getResiduos = async () => {
  const [rows] = await pool.query('SELECT * FROM Residuo ORDER BY fecha DESC, id DESC');
  return rows;
};

const createResiduo = async ({ fecha, laboratorio, reactivo, tipo, cantidad, unidad }) => {
  const [result] = await pool.query(
    'INSERT INTO Residuo (fecha, laboratorio, reactivo, tipo, cantidad, unidad) VALUES (?, ?, ?, ?, ?, ?)',
    [fecha, laboratorio, reactivo, tipo, cantidad, unidad]
  );
  return { id: result.insertId, fecha, laboratorio, reactivo, tipo, cantidad, unidad };
};

module.exports = { getResiduos, createResiduo };
