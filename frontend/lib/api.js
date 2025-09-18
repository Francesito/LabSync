// File: frontend/lib/api.js
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'https://labsync-1090.onrender.com/api';

const API = axios.create({
  baseURL,
    timeout: 10000, // 10s de tiempo máximo por petición
  withCredentials: true,
});

const getData = async (url, config) => {
  const { data } = await API.get(url, config);
  return data;
};

// --- Solicitudes (alumno/docente) ---
export async function obtenerSolicitudes() {
  return getData('/materials/usuario/solicitudes');
}

export async function aprobarSolicitud(id) {
 await API.post(`/materials/solicitud/${id}/aprobar`);
}

export async function rechazarSolicitud(id) {
    await API.post(`/materials/solicitud/${id}/rechazar`);
}

// --- Adeudos (alumno/docente) ---
export async function obtenerAdeudos() {
  try {
  return await getData('/materials/adeudos/entrega');
  } catch (_error) {
    return getData('/materials/adeudos');
  }
}

// --- Función adicional para obtener fecha de entrega desde préstamos ---
export async function obtenerFechaEntregaPrestamo(solicitudId) {
  try {
    const prestamos = await getData('/materials/solicitudes/entregadas');
    const prestamo = prestamos.find(
      p => p.solicitud_id === solicitudId || p.id === solicitudId
    );
    if (prestamo) {
    return prestamo.fecha_entrega || prestamo.updated_at || prestamo.created_at || null;
    }
    return null;
     } catch (_error) {
    return null;
  }
}

// --- Función mejorada para obtener adeudos con fecha de entrega ---
export async function obtenerAdeudosConFechaEntrega() {
  return getData('/materials/adeudos/entrega');
}

// --- Préstamos entregados (almacenista) ---
export async function obtenerPrestamosEntregados() {
  return getData('/materials/solicitudes/entregadas');
}

// --- Detalle de una solicitud entregada (almacenista) ---
export async function obtenerDetalleSolicitud(solicitudId) {
  return getData(`/materials/solicitudes/${solicitudId}`);
}

// --- Ajustar adeudo tras devolución parcial (almacenista) ---
export async function registrarDevolucion(solicitudId, itemsDevueltos) {
  const { data } = await API.put(`/solicitudes/recibir-devolucion/${solicitudId}`, {
    items_devueltos: itemsDevueltos,
  });
  return data;
}

export async function informarPrestamoVencido(solicitudId) {
   const { data } = await API.post(`/solicitudes/${solicitudId}/informar-vencido`, {});
  return data;
}

// --- Generación de reportes en PDF (admin) ---
export async function generarReporte(tipoReporte) {
  const response = await API.get(`/reportes/${tipoReporte}`, { responseType: 'blob' });
  return response.data;
}

// --- Residuos ---
export async function obtenerResiduos() {
 return getData('/residuos');
}

export async function registrarResiduo(payload) {
   const { data } = await API.post('/residuos', payload);
  return data;
}

export async function eliminarResiduos(ids) {
  await API.delete('/residuos', { data: { ids } });
}

// --- Grupos ---
export async function obtenerGrupos() {
  return getData('/grupos');
}

// --- Adeudos globales (almacen/administrador) ---
export async function obtenerAdeudosGlobal() {
  return getData('/adeudos');
}

// --- Solicitudes aprobadas (almacen/administrador) ---
export async function obtenerSolicitudesAprobadas() {
   return getData('/materials/solicitudes/aprobadas');
}

// --- Inventario ---
export async function obtenerInventarioLiquidos(config) {
  return getData('/materials/inventario/liquidos', config);
}

export async function obtenerInventarioSolidos(config) {
  return getData('/materials/inventario/solidos', config);
}

export async function obtenerPrestamosEquipos() {
    return getData('/materials/inventario/equipos');
}

export async function obtenerPrestamosLaboratorio() {
  return getData('/materials/inventario/laboratorio');
}
