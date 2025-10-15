// db.js
require('dotenv').config(); // 👈 Carga las variables desde .env

const { Pool } = require('pg');

// Configuración de la base de datos usando variables de entorno
// Esto permite cambiar la configuración sin modificar el código
const pool = new Pool({
  user: process.env.DB_USER || 'estudiante',         // usuario PostgreSQL
  host: process.env.DB_HOST || '190.236.75.167',          // host de la base de datos
  database: process.env.DB_NAME || 'norkysdb',       // nombre de la base de datos
  password: process.env.DB_PASS || 'MiPass123',      // contraseña
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,  // puerto
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Probar la conexión (opcional)
pool.connect()
  .then(client => {
    console.log('✅ Conexión exitosa a PostgreSQL');
    client.release();
  })
  .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));

module.exports = pool;


