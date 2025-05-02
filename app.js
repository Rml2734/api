const cors = require("cors");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { expressjwt: jwt } = require("express-jwt");

// Importar Swagger UI y configuración
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger"); // Importa la configuración de Swagger

// Routers
const indexRouter = require("./routes/index");
const metasRouter = require("./routes/metas");
const cuentasRouter = require("./routes/cuentas");
const authRouter = require("./routes/auth");

const app = express();

console.log("--- Aplicación Iniciándose ---");

// 🔥🔥 Configuración CORS - LO MÁS TEMPRANO POSIBLE
const allowedOrigins = [
    "https://metasapp2025-production.up.railway.app", // Origen Frontend Producción
    "http://localhost:5173",                       // Origen Frontend Desarrollo
    // Agrega aquí cualquier otro origen permitido, incluyendo el de Swagger si es necesario
    "https://api-production-bf05.up.railway.app"  // <- Añade esto si Swagger está en el mismo dominio
];

const corsOptions = {
    origin: function (origin, callback) {
        // Loguear el origen recibido para depurar
        console.log(`CORS Check: Recibido origin = ${origin} (Tipo: ${typeof origin})`);
        // Permite solicitudes sin origen (como Postman) O si el origen está en la lista
        if (!origin || allowedOrigins.includes(origin)) { // Usar includes() para mejor legibilidad
            console.log(`CORS Check: PERMITIENDO origen = ${origin}`);
            callback(null, true); // Permite este origen
        } else {
            console.error(`❌ Origen NO PERMITIDO por CORS: ${origin}`);
            callback(new Error(`Origen no permitido por CORS: ${origin}`));
        }
    },
    credentials: true, // Necesario para 'credentials: "include"' en fetch y cookies
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Especifica los métodos permitidos
    allowedHeaders: 'Content-Type,Authorization,Origin,X-Requested-With,Accept', // Amplía los headers permitidos
    exposedHeaders: 'Set-Cookie', // Si necesitas que el navegador acceda a Set-Cookie
    preflightContinue: false, //  <--  Añade esto
    optionsSuccessStatus: 204  // <-- Y esto:  Respuesta para OPTIONS sin cuerpo (204 No Content)
};

console.log("Aplicando middleware CORS global (configuración específica)...");
app.use(cors(corsOptions));
console.log("Middleware CORS global aplicado (configuración específica).");


// Middlewares estándar (después de CORS)
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// 🔐 Configuración JWT con Middleware Condicional (después de CORS y parsers)
const jwtMiddleware = jwt({
    secret: process.env.JWT_SECRET || "secreto",
    algorithms: ["HS256"],
    requestProperty: "auth",
    getToken: (req) => {
        // Extrae token de cookies o cabecera Authorization (más robusto)
        let token = null;
        if (req && req.cookies) {
            token = req.cookies.token;
        } else if (req && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') { // Mejorar validación del esquema
                token = parts[1];
            }
        }
        // Log reducido
        if (token) {
            console.log("🔑 Token encontrado para:", req.method, req.path);
        }
        return token;
    }
});

// Función para determinar si saltar la verificación JWT
const shouldSkipJwt = (req) => {
    const skip = (req.method === 'HEAD' && req.path === '/') ||
        (req.method === 'GET' && req.path === '/') ||
        /\.(css|js|png|jpg|ico|svg)$/.test(req.path) ||
        (req.path.startsWith('/api/signup') && (req.method === 'POST' || req.method === 'OPTIONS')) || // Incluir OPTIONS
        (req.path.startsWith('/api/login') && (req.method === 'POST' || req.method === 'OPTIONS')) ||  // Incluir OPTIONS
        (req.path.startsWith('/api/recuperar-clave') && req.method === 'POST');
    return skip;
};

// Middleware condicional para aplicar JWT
app.use((req, res, next) => {
    console.log("➡️ Middleware ANTES de JWT para:", req.method, req.path);
    if (req.path === '/api-docs' || shouldSkipJwt(req)) {
        console.log("⏭️ Omitiendo verificación JWT para:", req.method, req.path);
        return next();
    }
    console.log("🛡️ Aplicando verificación JWT para:", req.method, req.path);
    jwtMiddleware(req, res, next);
});

// Middleware para manejar errores específicos de JWT
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        console.error("❗ Error de Autenticación (JWT):", err.message, "para:", req.method, req.path);
        return res.status(401).json({ message: 'Token inválido, expirado o no proporcionado' });
    }
    next(err);
});

// Middleware simple para loguear después de pasar JWT
app.use((req, res, next) => {
    console.log("➡️ Middleware DESPUÉS de JWT para:", req.method, req.path);
    next();
});


// Rutas de la API
app.use("/api", cuentasRouter);
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", authRouter);
console.log("app.js - Antes de app.get(*)");

// Manejo de rutas no manejadas (SPA catch-all)
app.get('*', (req, res, next) => {
    console.log("app.js - Dentro de app.get(*), req.path:", req.path);
    if (req.method === 'GET' && req.accepts('html') && !req.path.startsWith('/api/')) {
        console.log(` Mapeando ruta ${req.path} a index.html`);
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    } else {
        next();
    }
});


// Manejador para errores 404
app.use(function (req, res, next) {
    console.warn(`⚠️ Recurso no encontrado (404): ${req.method} ${req.originalUrl}`);
    next(createError(404));
});

// 🚨 Manejador de Errores Global
app.use((err, req, res, next) => {
    console.error("🔥 Error Global Capturado:", err.message);
    console.error(" Stack:", err.stack);

    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    if (req.accepts('json')) {
        res.status(err.status || 500).json({
            error: {
                message: err.message || "Error interno del servidor",
            }
        });
    } else {
        res.status(err.status || 500).send(`Error: ${err.message}`);
    }
});
console.log("app.js - Antes de app.listen()");

module.exports = app;
