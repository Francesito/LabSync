// backend/controllers/usuarioController.js
const pool = require('../config/db');

const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT u.*, r.nombre as rol FROM Usuario u JOIN Rol r ON u.rol_id = r.id');
   const solicitudesMap = new Map();

for (const row of rows) {
  if (!solicitudesMap.has(row.solicitud_id)) {
    solicitudesMap.set(row.solicitud_id, {
      solicitud_id: row.solicitud_id,
      folio: row.folio,
      fecha_solicitud: row.fecha_solicitud,
      estado: row.estado,
      profesor: row.profesor,
      nombre_alumno: row.nombre_alumno,
      items: []
    });
  }

  solicitudesMap.get(row.solicitud_id).items.push({
    id: row.item_id,
    material_id: row.material_id,
    tipo: row.tipo,
    cantidad: row.cantidad,
    nombre_material: row.nombre_material
  });
}

const resultado = Array.from(solicitudesMap.values());
res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const desactivarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE Usuario SET activo = FALSE WHERE id = ?', [id]);
    res.json({ mensaje: 'Usuario desactivado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};

// Obtiene la información del usuario autenticado
const obtenerPerfil = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.correo_institucional, u.rol_id, u.ultimo_cambio_nombre,
              g.nombre AS grupo
         FROM Usuario u
         LEFT JOIN Grupo g ON u.grupo_id = g.id
        WHERE u.id = ?`,
      [req.usuario.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// Permite cambiar el nombre una vez al mes
const actualizarNombre = async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Nombre requerido' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT ultimo_cambio_nombre FROM Usuario WHERE id = ?',
      [req.usuario.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const ultimoCambio = rows[0].ultimo_cambio_nombre;
    if (ultimoCambio) {
      const diffMes = (Date.now() - new Date(ultimoCambio).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (diffMes < 1) {
        return res.status(400).json({ error: 'Solo puedes cambiar tu nombre una vez al mes' });
      }
    }

    await pool.query(
      'UPDATE Usuario SET nombre = ?, ultimo_cambio_nombre = NOW() WHERE id = ?',
      [nombre, req.usuario.id]
    );

    res.json({ mensaje: 'Nombre actualizado', nombre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar nombre' });
  }
};

// Elimina la cuenta del usuario
const eliminarCuenta = async (req, res) => {
  try {
    await pool.query('DELETE FROM Usuario WHERE id = ?', [req.usuario.id]);
    res.json({ mensaje: 'Cuenta eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
};

module.exports = {
  obtenerUsuarios,
  desactivarUsuario,
  obtenerPerfil,
  actualizarNombre,
  eliminarCuenta,
};
