require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración SSL segura. Por defecto se verifica el certificado del servidor.
// Para deshabilitarlo explícitamente (por ejemplo en entornos de desarrollo con
// certificados autofirmados) se puede establecer DB_SSL_REJECT_UNAUTHORIZED=false
// y DB_SSL=true.
const useSSL = process.env.DB_SSL === 'true';
const sslConfig = useSSL
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
   ssl: sslConfig,
  waitForConnections: true, // Maneja reconexiones automáticamente
  connectionLimit: 10, // Máximo 10 conexiones
  queueLimit: 0, // Sin límite en la cola de consultas
  connectTimeout: 60000 // 60 segundos para establecer conexión
});

// Probar conexión al inicio
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos exitosa');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1); // Finaliza el proceso si la conexión falla
  }
}

testConnection();

module.exports = pool;
