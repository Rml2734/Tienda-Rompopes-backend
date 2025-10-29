const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendContactNotification, sendNewsletterNotification } = require('../services/emailService'); // <-- Nuevo: Importa la función

// Nueva ruta para mensajes de contacto
router.post('/', async (req, res) => {
  const { nombre, email, mensaje } = req.body;
  try {
    // 1. Guardar el mensaje en la base de datos
    const result = await db.query(
      'INSERT INTO mensajes_contacto (nombre, email, mensaje) VALUES ($1, $2, $3) RETURNING *',
      [nombre, email, mensaje]
    );

    // 2. Enviar la notificación por correo electrónico
    // Llamamos a la nueva función que crearemos en emailServices.js
    await sendContactNotification(nombre, email, mensaje);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al guardar el mensaje de contacto:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// NUEVA RUTA: Newsletter (AGREGAR ESTA)
router.post('/newsletter', async (req, res) => {
  const { email } = req.body;
  try {
    // Validar email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor proporciona un email válido' 
      });
    }

    // Guardar en la base de datos (puedes usar la misma tabla o crear una nueva)
    const result = await db.query(
      'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING *',
      [email, new Date()]
    );

    // Enviar notificación por email
    await sendNewsletterNotification(email);

    res.json({ 
      success: true, 
      message: '¡Gracias por suscribirte! Te mantendremos informado.',
      subscribed: result.rows.length > 0 // true si fue nuevo, false si ya existía
    });

  } catch (error) {
    console.error('Error en suscripción al newsletter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Función de validación de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;