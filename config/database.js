const { Pool } = require('pg');
require('dotenv').config();

console.log('Configuración de base de datos:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  // No mostramos la contraseña por seguridad
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Agrega este manejador de errores para detectar problemas de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => {
    console.log('Ejecutando query:', text, 'con parámetros:', params);
    return pool.query(text, params);
  },
  connect: () => pool.connect(),
};