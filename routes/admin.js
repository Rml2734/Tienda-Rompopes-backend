const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- NUEVO
const path = require('path');

// Cargar variables de entorno para usar la contraseña segura
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const adminPassword = process.env.ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET; // <-- NUEVO: Obtenemos la clave secreta

// Middleware para verificar autenticación con JWT
const authenticateAdmin = (req, res, next) => {

  
     // Para desarrollo, siempre permitir acceso
    //next();


    // Obtenemos el token del header de la solicitud
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // El formato es "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ error: 'No autorizado: Token no proporcionado' });
    }

    // Verificamos el token
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'No autorizado: Token inválido' });
        }
        req.user = user;
        next();
    });
};

// NUEVO ENDPOINT PARA EL LOGIN DE ADMINISTRADOR
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        // --- LÍNEA DE DEBUGGING CRÍTICA ---
        // Esto confirmará que el servidor conoce el hash (se verá en los logs de Railway)
        console.log('Hash ADMIN_PASSWORD cargado:', adminPassword ? 'Sí' : 'No'); 
        console.log('Iniciando comparación de contraseña...');
        // --- FIN LÍNEA DE DEBUGGING ---

        // Comparamos la contraseña enviada con la contraseña segura del .env
        const match = await bcrypt.compare(password, adminPassword);

        if (match) {
            // Si la contraseña es correcta, generamos el token JWT
            const user = { id: 1, role: 'admin' }; // Payload del token (puedes personalizarlo)
            const accessToken = jwt.sign(user, jwtSecret, { expiresIn: '1h' });
            
            // Enviamos el token en la respuesta
            res.status(200).json({ success: true, message: 'Login exitoso', token: accessToken });
        } else {
            // Si no, envía una respuesta de error
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('Error en el login del administrador:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});


// Rutas protegidas - Ahora todas usarán el middleware
router.get('/orders', authenticateAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM orders ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar estado de un pedido
router.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const result = await db.query(
            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ message: 'Estado actualizado', order: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener estadísticas
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalOrdersResult = await db.query('SELECT COUNT(*) FROM orders');
        const totalSalesResult = await db.query(
            'SELECT SUM(total) FROM orders WHERE status != $1',
            ['cancelled']
        );
        const ordersByStatusResult = await db.query(
            'SELECT status, COUNT(*) FROM orders GROUP BY status'
        );
        const topProductsResult = await db.query(`
      SELECT 
        (item->>'name') as product_name,
        SUM(CAST(item->>'quantity' AS INTEGER)) as total_quantity
      FROM orders, jsonb_array_elements(items) as item
      GROUP BY product_name
      ORDER BY total_quantity DESC
      LIMIT 5
    `);

        res.json({
            totalOrders: parseInt(totalOrdersResult.rows[0].count),
            totalSales: parseFloat(totalSalesResult.rows[0].sum || 0),
            ordersByStatus: ordersByStatusResult.rows,
            topProducts: topProductsResult.rows
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los productos
router.get('/products', authenticateAdmin, async (req, res) => {
    try {
        console.log('Solicitud de productos recibida');

        const result = await db.query(`
      SELECT 
        DISTINCT (item->>'name') as name,
        (item->>'price')::numeric as price,
        SUM(CAST(item->>'quantity' AS INTEGER)) OVER (PARTITION BY (item->>'name')) as sold_count,
        100 as stock
      FROM orders, jsonb_array_elements(items) as item
      ORDER BY name
    `);

        console.log('Productos encontrados:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los clientes
router.get('/customers', authenticateAdmin, async (req, res) => {
    try {
        console.log('Solicitud de clientes recibida');

        const result = await db.query(`
      SELECT 
        customer_email as email,
        customer_name as name,
        customer_phone as phone,
        COUNT(*) as order_count,
        SUM(total::numeric) as total_spent
      FROM orders
      GROUP BY customer_email, customer_name, customer_phone
      ORDER BY total_spent DESC
    `);

        console.log('Clientes encontrados:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;