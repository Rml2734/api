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

console.log("--- Aplicación Iniciándose ---"); // Log muy temprano

// 🔥🔥 Configuración CORS - LO MÁS TEMPRANO POSIBLE
const allowedOrigins = [
    "https://metasapp2025-production.up.railway.app", // Origen Frontend Producción
    "http://localhost:5173"                       // Origen Frontend Desarrollo (Opcional)
];

const corsOptions = {
    origin: function (origin, callback) {
        // Loguear el origen recibido para depurar
        console.log(`CORS Check: Recibido origin = ${origin} (Tipo: ${typeof origin})`);
        // Permite solicitudes sin origen (como Postman) O si el origen está en la lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            console.log(`CORS Check: PERMITIENDO origen = ${origin}`);
            callback(null, true); // Permite este origen específico
        } else {
            console.error(`❌ Origen NO PERMITIDO por CORS: ${origin}`); // Log si un origen es rechazado
            callback(new Error(`Origen no permitido por CORS: ${origin}`));
        }
    },
    credentials: true, // IMPORTANTE: Necesario para 'credentials: "include"' en fetch
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Incluye OPTIONS
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'], // Headers necesarios
    optionsSuccessStatus: 200 // Para compatibilidad
};

console.log("Aplicando middleware CORS global (configuración específica)...");
// 👇 *** ESTE ES EL CAMBIO CLAVE: Volver a usar corsOptions *** 👇
app.use(cors(corsOptions));
// 👆 *** FIN DEL CAMBIO CLAVE *** 👆
console.log("Middleware CORS global aplicado (configuración específica).");


// 👇 ** Opcional: Puedes eliminar estos manejadores OPTIONS explícitos ** 👇
// El middleware global app.use(cors(corsOptions)) debería manejarlos ahora.
/*
app.options('/api/login', cors(corsOptions), (req, res) => {
    console.log("🔥 EXPERIMENTO: Recibida solicitud OPTIONS para /api/login en app.js");
    res.sendStatus(200);
});

app.options('/api/test-cors', cors(corsOptions), (req, res) => {
    console.log("🧪 Recibida solicitud OPTIONS para /api/test-cors en app.js");
    res.sendStatus(200);
});
*/
// 👆 ** Fin de sección opcional a eliminar ** 👆


// 📁 Servir Archivos Estáticos (Si tu backend también sirve el frontend compilado, si no, puedes quitarlo)
//app.use(express.static(path.join(__dirname, 'dist'), {
//     setHeaders: (res, filePath) => {
//         if (filePath.endsWith('.css')) {
//             res.setHeader('Content-Type', 'text/css');
//         } else if (filePath.endsWith('.js')) {
//             res.setHeader('Content-Type', 'application/javascript');
//         }
//     }
//}));


// Middlewares estándar (después de CORS)
app.use(logger("dev")); // Morgan logger
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: false })); // Para parsear application/x-www-form-urlencoded
app.use(cookieParser()); // Para parsear cookies


// 🔐 Configuración JWT con Middleware Condicional (después de CORS y parsers)
const jwtMiddleware = jwt({
    secret: process.env.JWT_SECRET || "secreto", // Usa una variable de entorno segura!
    algorithms: ["HS256"],
    requestProperty: "auth", // Nombre de la propiedad en req donde se guarda el payload decodificado
    getToken: (req) => {
        // Extrae token de cookies o cabecera Authorization
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || null;
        // Log reducido para no llenar tanto, solo si se encontró o no
        if (token) {
            console.log("🔑 Token encontrado para:", req.path, req.method);
        } else {
            // console.log("🔑 No se encontró token para:", req.path, req.method); // Descomenta si necesitas más detalle
        }
        return token;
    }
});

// Función para determinar si saltar la verificación JWT
const shouldSkipJwt = (req) => {
    const skip = (req.method === 'HEAD' && req.path === '/') ||
        (req.method === 'GET' && req.path === '/') ||
        /\.(css|js|png|jpg|ico|svg)$/.test(req.path) || // Archivos estáticos
        (req.path.startsWith('/api/signup') && (req.method === 'POST' || req.method === 'OPTIONS')) ||
        (req.path.startsWith('/api/login') && (req.method === 'POST' || req.method === 'OPTIONS')) ||
        (req.path.startsWith('/api/recuperar-clave') && req.method === 'POST'); // 👈 **AÑADIDA ESTA LÍNEA**
    // Log si se salta
    // if (skip) console.log(`⏭️ Omitiendo JWT para: ${req.method} ${req.path}`);
    return skip;
};

// Middleware condicional para aplicar JWT
app.use((req, res, next) => {
    console.log("➡️ Middleware ANTES de JWT para:", req.method, req.path);
    if (req.path === '/api-docs' || shouldSkipJwt(req)) {
        console.log("⏭️ Omitiendo verificación JWT para:", req.method, req.path);
        return next(); // Salta la verificación
    }
    console.log("🛡️ Aplicando verificación JWT para:", req.method, req.path);
    jwtMiddleware(req, res, next); // Aplica la verificación
});

// Middleware para manejar errores específicos de JWT (después de aplicarlo)
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        console.error("❗ Error de Autenticación (JWT):", err.message, "para:", req.method, req.path);
        return res.status(401).json({ message: 'Token inválido, expirado o no proporcionado' });
    }
    // Si no es un error de JWT, pasa al siguiente manejador de errores
    next(err);
});

// Middleware simple para loguear después de pasar JWT (si no hubo error)
app.use((req, res, next) => {
    console.log("➡️ Middleware DESPUÉS de JWT (si pasó) para:", req.method, req.path);
    next();
});


// Rutas de la API (después de todos los middlewares generales)
app.use("/api", cuentasRouter);
app.use("/", indexRouter); // Usar indexRouter para la raíz '/'
app.use("/api/metas", metasRouter);
app.use("/api", authRouter); // Aquí estarán /api/login y /api/signup

// Ruta de prueba CORS
app.options('/api/test-cors', (req, res) => {
    console.log('Recibida solicitud OPTIONS para /api/test-cors');
    res.header('Access-Control-Allow-Origin', 'https://metasapp2025-production.up.railway.app');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).send('Preflight OK'); // Importante: Enviar un status 200 para OPTIONS
});

app.get('/api/test-cors', (req, res) => {
    console.log('Recibida solicitud GET para /api/test-cors');
    res.send({ message: 'CORS Test Succeeded!' });
});


console.log("app.js - Antes de app.get(*)"); // NUEVO LOG

// Sirve index.html para cualquier ruta GET no manejada por la API (si tu backend también sirve el frontend compilado, si no, puedes quitarlo)
// Asegúrate que esto vaya DESPUÉS de todas las rutas API
app.get('*', (req, res, next) => {
    console.log("app.js - Dentro de app.get(*), req.path:", req.path); // NUEVO LOG
    // Solo intercepta peticiones GET que acepten HTML, para no interferir con API calls que no coincidan
    if (req.method === 'GET' && req.accepts('html') && !req.path.startsWith('/api/')) {
        console.log(` Mapeando ruta ${req.path} a index.html`);
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    } else {
        next(); // Pasa a los siguientes manejadores (como el 404)
    }
});


// Manejador para errores 404 (Not Found) - Debe ir casi al final
app.use(function (req, res, next) {
    console.warn(`⚠️ Recurso no encontrado (404): ${req.method} ${req.originalUrl}`);
    next(createError(404));
});

// 🚨 Manejador de Errores Global (Debe ser el ÚLTIMO middleware)
app.use((err, req, res, next) => {
    console.error("🔥 Error Global Capturado:", err.message);
    console.error("Stack:", err.stack); // Loguea el stack completo para depuración

    // Establece locals, solo proporciona error en desarrollo
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {}; // No exponer stack en producción

    // Responde con JSON si la solicitud esperaba JSON, de lo contrario renderiza una página de error (si tienes una)
    if (req.accepts('json')) {
        res.status(err.status || 500).json({
            error: {
                message: err.message || "Error interno del servidor",
                // Puedes añadir más detalles si es seguro hacerlo
            }
        });
    } else {
        // Renderiza la página de error (si tienes una vista 'error')
        // res.status(err.status || 500);
        // res.render('error');
        // O una respuesta de texto simple:
        res.status(err.status || 500).send(`Error: ${err.message}`);
    }
});
console.log("app.js - Antes de app.listen()"); // NUEVO LOG
// 🚀 INICIAR SERVIDOR LOCAL
//const PORT = process.env.PORT || 10000;
//console.log("app.js - Valor de PORT:", PORT);  // NUEVO LOG
//app.listen(PORT, () => {
// console.log(`✅ Servidor escuchando en puerto ${PORT}`);
// console.log(` Modo de entorno: ${process.env.NODE_ENV || 'development'}`); // Muestra el modo
//});

module.exports = app; // Exporta app (útil para tests)
