// 🔥🔥 Configuración CORS - LO MÁS TEMPRANO POSIBLE
// config/cors.js
const allowedOrigins = [
    "https://metasapp2025-production.up.railway.app",
    "http://localhost:5173",
    "http://localhost:4000"
];

const corsOptions = {
    origin: function (origin, callback) {
        console.log(`\n=== CORS Check ===`);
        console.log(`Origen recibido: ${origin}`);
        console.log(`Lista permitida:`, allowedOrigins);
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origen no permitido por CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    optionsSuccessStatus: 200
};

module.exports = { corsOptions }; // 👈 Exportación directa