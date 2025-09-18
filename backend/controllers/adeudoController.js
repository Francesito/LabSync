// backend/controllers/adeudoController.js
const pool = require('../config/db');

/** Log helper con timestamp */
function logRequest(name) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [AdeudoController] >> ${name}`);
}

/**
 * GET /api/adeudos/usuario
 * Devuelve todos los adeudos pendientes del usuario autenticado
 */
async function getUsuarioAdeudos(req, res) {
  logRequest('getUsuarioAdeudos');
  try {
    const usuarioId = req.usuario.id;
    const [rows] = await pool.query(
      `SELECT
         a.id,
         a.solicitud_id,
    a.solicitud_item_id,
         COALESCE(ml.nombre, ms.nombre, me.nombre, mlab.nombre) AS nombre_material,
         a.cantidad_pendiente AS cantidad,
         CASE a.tipo WHEN 'liquido' THEN 'ml'
                     WHEN 'solido'  THEN 'g'
                     ELSE 'u' END AS unidad,
         s.folio
       FROM Adeudo a
     JOIN Solicitud s ON a.solicitud_id = s.id
       LEFT JOIN MaterialLiquido ml ON a.tipo='liquido' AND a.material_id = ml.id
       LEFT JOIN MaterialSolido  ms ON a.tipo='solido'  AND a.material_id = ms.id
       LEFT JOIN MaterialEquipo  me ON a.tipo='equipo'  AND a.material_id = me.id
        LEFT JOIN MaterialLaboratorio mlab ON a.tipo='laboratorio' AND a.material_id = mlab.id
       WHERE a.usuario_id = ?`,
      [usuarioId]
    );
    res.json(rows);
  } catch (error) {
    console.error('[Error] getUsuarioAdeudos:', error);
    res.status(500).json({ error: 'Error al obtener adeudos' });
  }
}

/**
 * POST /api/adeudos/ajustar/:solicitudId
 * Body: { entregados: [solicitud_item_id, ...] }
 * Borra todos los adeudos marcados
 */
async function ajustarAdeudo(req, res) {
  logRequest('ajustarAdeudo');
  const { solicitudId } = req.params;
 const { entregados } = req.body;
  const usuario = req.usuario;

  if (!Array.isArray(entregados)) {
    return res.status(400).json({ error: 'Array de items entregados obligatorio' });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [adeudosAsociados] = await connection.query(
        `SELECT DISTINCT usuario_id
           FROM Adeudo
          WHERE solicitud_id = ?`,
        [solicitudId]
      );

    if (adeudosAsociados.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Adeudo no encontrado para la solicitud indicada' });
      }

      const esPropietario = adeudosAsociados.some(({ usuario_id }) => usuario_id === usuario.id);
      const esPersonalAlmacen = [3, 4].includes(usuario.rol_id);

      if (!esPropietario && !esPersonalAlmacen) {
        await connection.rollback();
        return res.status(403).json({ error: 'No tienes permisos para ajustar este adeudo' });
      }

      const itemsParseados = entregados.map(id => Number.parseInt(id, 10));
      if (itemsParseados.some(id => !Number.isInteger(id))) {
        await connection.rollback();
        return res.status(400).json({ error: 'Los identificadores de items deben ser números enteros' });
      }
      const itemsNormalizados = Array.from(new Set(itemsParseados));

      if (itemsNormalizados.length > 0) {
        const [itemsValidos] = await connection.query(
          `SELECT solicitud_item_id
             FROM Adeudo
            WHERE solicitud_id = ?
              AND solicitud_item_id IN (?)`,
          [solicitudId, itemsNormalizados]
        );

        const idsValidos = new Set(itemsValidos.map(row => row.solicitud_item_id));
        const idsInvalidos = itemsNormalizados.filter(id => !idsValidos.has(id));

        if (idsInvalidos.length > 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Se enviaron items que no pertenecen al adeudo' });
        }

        await connection.query(
          `DELETE FROM Adeudo
             WHERE solicitud_id = ?
               AND solicitud_item_id IN (?)`,
          [solicitudId, itemsNormalizados]
        );
      }

      const [[{ cnt }]] = await connection.query(
        `SELECT COUNT(*) AS cnt
           FROM Adeudo
          WHERE solicitud_id = ?`,
        [solicitudId]
      );

      if (cnt === 0) {
        await connection.query('DELETE FROM SolicitudItem WHERE solicitud_id = ?', [solicitudId]);
        await connection.query('DELETE FROM Solicitud WHERE id = ?', [solicitudId]);
      }

      await connection.commit();

      if (cnt === 0) {
        return res.json({
          message: 'Adeudo completado y solicitud eliminada',
          pendingItems: 0
        });
      }

      return res.json({
       message: 'Adeudo parcial registrado',
        pendingItems: cnt
      });
        } catch (transactionError) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('[Error] ajustarAdeudo rollback:', rollbackError);
      }
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[Error] ajustarAdeudo:', error);
    res.status(500).json({ error: 'Error al ajustar adeudo' });
  }
}
/**
 * GET /api/adeudos
 * Devuelve todos los adeudos pendientes (para almacenista)
 */
async function getAllAdeudos(req, res) {
  logRequest('getAllAdeudos');
  try {
    const [rows] = await pool.query(
      `SELECT
         a.id,
         a.solicitud_id,
         a.solicitud_item_id,
         a.tipo,
         COALESCE(ml.nombre, ms.nombre, me.nombre, mlab.nombre) AS nombre_material,
         a.cantidad_pendiente AS cantidad,
         CASE a.tipo WHEN 'liquido' THEN 'ml' WHEN 'solido' THEN 'g' ELSE 'u' END AS unidad,
         s.folio,
         s.nombre_alumno AS solicitante,
         s.profesor,
         g.nombre AS grupo,
           DATE_FORMAT(s.fecha_solicitud, '%Y-%m-%d') AS fecha_solicitud,
         DATE_FORMAT(a.fecha_entrega, '%Y-%m-%d') AS fecha_entrega
       FROM Adeudo a
     JOIN Solicitud s       ON a.solicitud_id = s.id
       LEFT JOIN Grupo g      ON s.grupo_id = g.id
        LEFT JOIN MaterialLiquido ml ON a.tipo='liquido' AND a.material_id = ml.id
       LEFT JOIN MaterialSolido  ms ON a.tipo='solido'  AND a.material_id = ms.id
       LEFT JOIN MaterialEquipo  me ON a.tipo='equipo'  AND a.material_id = me.id
        LEFT JOIN MaterialLaboratorio mlab ON a.tipo='laboratorio' AND a.material_id = mlab.id
      ORDER BY a.fecha_entrega DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('[Error] getAllAdeudos:', error);
    res.status(500).json({ error: 'Error al obtener adeudos' });
  }
}

module.exports = {
  getUsuarioAdeudos,
  getAllAdeudos,
  ajustarAdeudo
};
