const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Asumiendo que tu archivo de conexión se llama 'database.js'

// Importar db/pool si no lo tienes importado
// const pool = require('../config/database'); 

// GET: Obtener todas las reseñas
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM reseñas ORDER BY fecha_creacion DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener reseñas:', err.message);
        res.status(500).send('Error del servidor');
    }
});

// POST: Crear una nueva reseña
router.post('/', async (req, res) => {
    const { nombre, texto, calificacion } = req.body;

    if (!nombre || !texto || !calificacion) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, texto o calificacion.' });
    }

    // Generar una imagen de perfil aleatoria
    const imagen = `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`;

    try {
        const result = await db.query(
            'INSERT INTO reseñas (nombre, texto, calificacion, imagen) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, texto, calificacion, imagen]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al guardar la reseña:', err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;