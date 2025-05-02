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

// 🔥🔥 Configuración CORS - **CRUCIAL: Primero que todo** 🔥🔥
const allowedOrigins = [
    "https://metasapp2025-production.up.railway.app",
    "http://localhost:5173"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // **Incluye OPTIONS**
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'], // **Incluye Origin, Authorization y Content-Type**
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200  // Add this for OPTIONS responses
};
app.use(cors(corsOptions)); // **Aplica el middleware CORS**
console.log("Middleware CORS aplicado.");

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
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || null;
        if (token) {
            console.log("🔑 Token encontrado para:", req.path, req.method);
        }
        return token;
    }
});

const shouldSkipJwt = (req) => {
    const skip = (req.method === 'HEAD' && req.path === '/') ||
        (req.method === 'GET' && req.path === '/') ||
        /\.(css|js|png|jpg|ico|svg)$/.test(req.path) ||
        (req.path.startsWith('/api/signup') && (req.method === 'POST' || req.method === 'OPTIONS')) ||
        (req.path.startsWith('/api/login') && (req.method === 'POST' || req.method === 'OPTIONS')) ||  //OPTIONS added
        (req.path.startsWith('/api/recuperar-clave') && req.method === 'POST');
    return skip;
};

app.use((req, res, next) => {
        console.log("➡️ Middleware ANTES de JWT para:", req.method, req.path);
        if (req.path === '/api-docs' || shouldSkipJwt(req)) {
                console.log("⏭️ Omitiendo verificación JWT para:", req.method, req.path);
                return next();
        }
        console.log("🛡️ Aplicando verificación JWT para:", req.method, req.path);
        jwtMiddleware(req, res, next);
});

app.use((err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
                console.error("❗ Error de Autenticación (JWT):", err.message, "para:", req.method, req.path);
                return res.status(401).json({ message: 'Token inválido, expirado o no proporcionado' });
        }
        next(err);
});

app.use((req, res, next) => {
        console.log("➡️ Middleware DESPUÉS de JWT para:", req.method, req.path);
        next();
});

// Rutas de la API (después de todos los middlewares generales)
app.use("/api", cuentasRouter);
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", authRouter);

// Ruta de prueba CORS (si quieres mantenerla)
app.options('/api/test-cors', (req, res) => {
    console.log('Recibida solicitud OPTIONS para /api/test-cors');
    res.header('Access-Control-Allow-Origin', 'https://metasapp2025-production.up.railway.app');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');  // Added Origin
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).send('Preflight OK');
});

app.get('/api/test-cors', (req, res) => {
    console.log('Recibida solicitud GET para /api/test-cors');
    res.send({ message: 'CORS Test Succeeded!' });
});


app.get('*', (req, res, next) => {
        console.log("app.js - Dentro de app.get(*), req.path:", req.path);
        if (req.method === 'GET' && req.accepts('html') && !req.path.startsWith('/api/')) {
                console.log(` Mapeando ruta ${req.path} a index.html`);
                res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
        } else {
                next();
        }
});

app.use(function (req, res, next) {
        console.warn(`⚠️ Recurso no encontrado (404): ${req.method} ${req.originalUrl}`);
        next(createError(404));
});

app.use((err, req, res, next) => {
        console.error("🔥 Error Global Capturado:", err.message);
        console.error("Stack:", err.stack);

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