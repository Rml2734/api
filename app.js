const cors = require('cors');
const express = require('express');
const cuentasRouter = require('./routes/cuentas'); // Importar rutas de cuentas

const app = express();

// Configuración de CORS (lo más simple posible)
const corsOptions = {
    origin: 'https://metasapp2025-production.up.railway.app', // Permitir solo el origen de producción
    credentials: true,
    methods: ['POST'], // Permitir solo POST para login
    allowedHeaders: ['Content-Type'] // Permitir solo Content-Type
};
app.use(cors(corsOptions));  // Middleware CORS

app.use(express.json());       // Para parsear el cuerpo de las peticiones POST

// Rutas
app.use('/api', cuentasRouter); // Usar el router de cuentas

// Manejador de errores global (MUY básico)
app.use((err, req, res, next) => {
    console.error("🔥 Error Global:", err);
    res.status(500).json({ error: err.message || 'Error del servidor' });
});

module.exports = app;
