// migrate.js
const { Pool } = require('pg');

// 1. Configuración de la conexión usando las variables de entorno de Railway
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 2. Sentencias SQL para crear todas las tablas
const createTablesQuery = `
    -- Tabla para Pedidos
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        customer_address VARCHAR(255),
        customer_city VARCHAR(100),
        customer_postal_code VARCHAR(20),
        items JSONB NOT NULL, -- Almacena los productos comprados (usado en admin.js)
        subtotal NUMERIC(10, 2),
        shipping NUMERIC(10, 2),
        total NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_intent_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending', -- Usado en admin.js para estados
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla para Mensajes de Contacto (de contact.js)
    CREATE TABLE IF NOT EXISTS mensajes_contacto (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla para Suscriptores de Newsletter (de contact.js)
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL, -- El email debe ser único
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla para Reseñas (de reviews.js)
    CREATE TABLE IF NOT EXISTS reseñas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        texto TEXT NOT NULL,
        calificacion INTEGER NOT NULL,
        imagen VARCHAR(255),
        fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`;

// 3. Función principal para ejecutar las migraciones
async function runMigrations() {
    try {
        console.log("Iniciando conexión a la base de datos...");
        await pool.connect();
        
        console.log("Creando tablas si no existen...");
        await pool.query(createTablesQuery);
        console.log("✅ Tablas creadas exitosamente.");

    } catch (error) {
        console.error("❌ Error al ejecutar las migraciones:", error.message);
        process.exit(1); // Salir con error
    } finally {
        await pool.end();
        console.log("Conexión a base de datos cerrada. ¡Listo!");
        process.exit(0); // Salir con éxito
    }
}

runMigrations();