const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');

// Importar rutas
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const contactRoutes = require('./routes/contact'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS para permitir múltiples orígenes
// En tu archivo index.js del backend
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:4000' 
];

const corsOptions = {
  
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como apps móviles o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes); 
app.use('/api/contact', contactRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Conexión a la base de datos
db.connect()
  .then(() => {
    console.log('Conectado a PostgreSQL');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error conectando a la base de datos:', err);
  });