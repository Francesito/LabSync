const rateLimitStores = new Map();

const cleanupWindowMs = 60 * 60 * 1000; // 1 hora
let lastCleanup = Date.now();

const limpiarRegistrosAntiguos = () => {
  const ahora = Date.now();
  if (ahora - lastCleanup < cleanupWindowMs) {
    return;
  }

  for (const [clave, registro] of rateLimitStores.entries()) {
    if (ahora - registro.inicio >= registro.windowMs) {
      rateLimitStores.delete(clave);
    }
  }

  lastCleanup = ahora;
};

const crearRateLimiter = ({ windowMs = 60 * 1000, max = 30, message = 'Demasiadas solicitudes. Inténtalo más tarde.' } = {}) => {
  return (req, res, next) => {
    limpiarRegistrosAntiguos();

    const clave = `${req.ip || req.connection?.remoteAddress || 'desconocido'}:${req.baseUrl}${req.path}`;
    const ahora = Date.now();
    const registro = rateLimitStores.get(clave);

    if (!registro) {
      rateLimitStores.set(clave, { cuenta: 1, inicio: ahora, windowMs });
      return next();
    }

    if (ahora - registro.inicio >= windowMs) {
      rateLimitStores.set(clave, { cuenta: 1, inicio: ahora, windowMs });
      return next();
    }

    if (registro.cuenta >= max) {
      return res.status(429).json({ error: message });
    }

    registro.cuenta += 1;
    return next();
  };
};

module.exports = {
  crearRateLimiter,
};