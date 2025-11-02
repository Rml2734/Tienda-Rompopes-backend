/*
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
*/

//codigo de prueba
// config/database.js

const { Pool } = require('pg');
require('dotenv').config();

// 1. Priorizar DATABASE_URL (La forma más segura y recomendada por Railway)
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString 
  ? { 
      connectionString,
      // Opcional: Para entornos de producción con SSL, aunque Railway lo maneja
      // ssl: {
      //   rejectUnauthorized: false
      // }
    } 
  : { 
      // 2. Usar variables individuales (para desarrollo local)
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

// Mensaje de log para verificar qué configuración se está usando
console.log('Configuración de base de datos - Host/Conexión:', poolConfig.connectionString || poolConfig.host);

const pool = new Pool(poolConfig);

// Agrega este manejador de errores para detectar problemas de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones', err);
  // Es crucial no salir en un error de pool, solo en errores críticos
  // process.exit(-1); // Comentado: es mejor dejar que la app intente recuperarse
});

module.exports = {
  query: (text, params) => {
    console.log(`${new Date().toISOString()} - Ejecutando query: ${text.substring(0, 50)}...`);
    return pool.query(text, params);
  },
  connect: () => pool.connect(),
};