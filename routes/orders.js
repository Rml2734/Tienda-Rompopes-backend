const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Importar el servicio de email
const { sendOrderConfirmation, sendStatusUpdate } = require('../services/emailService');

// =========================================================================
// AGREGAR ESTO para la integración con Stripe
// Importa la librería de Stripe y usa tu clave secreta
// REEMPLAZA 'TU_CLAVE_SECRETA_DE_STRIPE' con la clave secreta que obtuviste de Stripe (sk_test_...)
 const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
 
// Nueva ruta para crear la intención de pago
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount } = req.body;
        // Valida que el monto sea un número y mayor a 0
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Monto de pago no válido.' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error al crear la intención de pago:', error);
        res.status(500).json({ error: 'Error al crear la intención de pago.' });
    }
});

// MODIFICAR ESTA RUTA POST existente
// La lógica para crear un nuevo pedido ahora debe verificar el método de pago
// y, si es con tarjeta, usar la intención de pago de Stripe.
router.post('/', async (req, res) => {
    console.log('Solicitud POST recibida en /api/orders');
    console.log('Datos recibidos:', req.body);
    
    try {
        const {
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            customer_city,
            customer_postal_code,
            items,
            subtotal,
            shipping,
            total,
            payment_method,
            payment_intent_id // Nuevo campo para el ID de Stripe
        } = req.body;

        console.log('Datos parseados:', {
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            customer_city,
            customer_postal_code,
            items,
            subtotal,
            shipping,
            total,
            payment_method,
            payment_intent_id
        });

        // Validar datos requeridos
        if (!customer_name || !customer_email || !items || !total) {
            console.log('Faltan campos obligatorios');
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Si el método de pago es con tarjeta, verificar el estado de la intención de pago
        if (payment_method === 'credit-card') {
            // Verificar si el payment_intent_id está presente
            if (!payment_intent_id) {
                return res.status(400).json({ error: 'Falta el ID de la intención de pago.' });
            }

            // Opcional: Obtener la intención de pago de Stripe para verificar su estado
            // Esto garantiza que el pago se haya procesado correctamente
            const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
            if (paymentIntent.status !== 'succeeded') {
                return res.status(400).json({ error: 'El pago no fue exitoso.' });
            }
        }

        // Insertar pedido en la base de datos
        const query = `
            INSERT INTO orders (
                customer_name, customer_email, customer_phone, customer_address,
                customer_city, customer_postal_code, items, subtotal, shipping, total, payment_method, payment_intent_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            customer_city,
            customer_postal_code,
            JSON.stringify(items),
            subtotal,
            shipping,
            total,
            payment_method,
            payment_intent_id // Se guarda el ID de Stripe
        ];

        console.log('Ejecutando query con valores:', values);

        const result = await db.query(query, values);
        console.log('Resultado de la inserción:', result.rows[0]);
        const newOrder = result.rows[0];

        // Intentar enviar email de confirmación
        try {
            await sendOrderConfirmation(newOrder);
            console.log('Email de confirmación enviado a:', newOrder.customer_email);
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            // No fallar la solicitud si el email falla
        }
        
        res.status(201).json({
            message: 'Pedido creado exitosamente',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// =========================================================================

// El resto de las rutas del archivo orders.js quedan igual
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total::numeric), 0) as total_revenue,
                COALESCE(AVG(total::numeric), 0) as average_order_value,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
                SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
            FROM orders
        `;
        
        const result = await db.query(statsQuery);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

router.get('/top-products', async (req, res) => {
    try {
        const topProductsQuery = `
            WITH product_counts AS (
                SELECT 
                    (item->>'name') as product_name,
                    SUM(CAST(item->>'quantity' AS INTEGER)) as total_sold
                FROM orders, jsonb_array_elements(items) as item
                GROUP BY product_name
                ORDER BY total_sold DESC
                LIMIT 5
            )
            SELECT * FROM product_counts
        `;
        
        const result = await db.query(topProductsQuery);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ error: 'Error al obtener productos más vendidos' });
    }
});

// Nueva ruta para obtener las ventas semanales (código a agregar)
// Nueva ruta para obtener las ventas semanales (versión mejorada)
// En tu archivo orders.js, modifica el endpoint /weekly-sales
router.get('/weekly-sales', async (req, res) => {
    try {
        const weekOffset = parseInt(req.query.week_offset) || 0;
        
        const query = `
            WITH dates AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days' - INTERVAL '${weekOffset} weeks', 
                    CURRENT_DATE - INTERVAL '${weekOffset} weeks', 
                    '1 day'::interval
                ) as date
            ),
            daily_sales AS (
                SELECT
                    DATE(created_at) as order_date,
                    SUM(total::numeric) as sales
                FROM orders
                WHERE DATE(created_at) BETWEEN 
                    (CURRENT_DATE - INTERVAL '6 days' - INTERVAL '${weekOffset} weeks') 
                    AND (CURRENT_DATE - INTERVAL '${weekOffset} weeks')
                GROUP BY DATE(created_at)
            )
            SELECT
                TO_CHAR(dates.date, 'Dy') as day,
                TO_CHAR(dates.date, 'DD Mon') as date_label,
                COALESCE(daily_sales.sales, 0) as sales
            FROM dates
            LEFT JOIN daily_sales ON dates.date = daily_sales.order_date
            ORDER BY dates.date;
        `;
        
        const result = await db.query(query);
        
        // Convertir días a español
        const dayMap = {
            'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 
            'Thu': 'Jue', 'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom'
        };
        
        const formattedResults = result.rows.map(row => ({
            day: `${dayMap[row.day] || row.day} ${row.date_label}`,
            sales: parseFloat(row.sales) || 0
        }));
        
        console.log("Datos de ventas semanales procesados para offset:", weekOffset);
        res.json(formattedResults);
    } catch (err) {
        console.error('Error fetching weekly sales:', err);
        res.status(500).json({ message: "Error fetching weekly sales" });
    }
});

// Nuevo endpoint para obtener las ventas diarias de todo el año
router.get('/yearly-sales', async (req, res) => {
    try {
        const query = `
            WITH all_dates AS (
                SELECT generate_series(
                    date_trunc('year', CURRENT_DATE),
                    date_trunc('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day',
                    '1 day'::interval
                ) as date
            ),
            daily_sales AS (
                SELECT
                    DATE(created_at) as order_date,
                    SUM(total::numeric) as sales
                FROM orders
                WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY DATE(created_at)
            )
            SELECT
                TO_CHAR(all_dates.date, 'YYYY-MM-DD') as date,
                COALESCE(daily_sales.sales, 0) as sales
            FROM all_dates
            LEFT JOIN daily_sales ON all_dates.date = daily_sales.order_date
            ORDER BY all_dates.date;
        `;
        
        const result = await db.query(query);
        const formattedResults = result.rows.map(row => ({
            date: row.date,
            sales: parseFloat(row.sales) || 0
        }));

        console.log("Datos de ventas anuales procesados.");
        res.json(formattedResults);
    } catch (err) {
        console.error('Error fetching yearly sales:', err);
        res.status(500).json({ message: "Error fetching yearly sales" });
    }
});


router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        let queryParams = [];
        
        if (status) {
            whereClause = 'WHERE status = $1';
            queryParams.push(status);
        }
        
        const ordersQuery = `
            SELECT * FROM orders 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        const countQuery = `
            SELECT COUNT(*) FROM orders 
            ${whereClause}
        `;
        
        const ordersResult = await db.query(
            queryParams.length > 0 ? ordersQuery : ordersQuery, 
            queryParams.length > 0 ? queryParams : null
        );
        
        const countResult = await db.query(
            queryParams.length > 0 ? countQuery : countQuery, 
            queryParams.length > 0 ? queryParams : null
        );
        
        const totalOrders = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalOrders / limit);
        
        res.json({
            orders: ordersResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages
            }
        });
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }
        
        const oldStatusResult = await db.query('SELECT status FROM orders WHERE id = $1', [id]);
        if (oldStatusResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        const oldStatus = oldStatusResult.rows[0].status;
        
        const result = await db.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        const updatedOrder = result.rows[0];
        
        try {
            await sendStatusUpdate(updatedOrder, oldStatus, status);
            console.log('Email de actualización enviado a:', updatedOrder.customer_email);
        } catch (emailError) {
            console.error('Error enviando email de actualización:', emailError);
        }
        
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;