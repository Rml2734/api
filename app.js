// ...otros require...
const cors = require("cors");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { expressjwt: jwt } = require("express-jwt");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const indexRouter = require("./routes/index");
const metasRouter = require("./routes/metas");
const cuentasRouter = require("./routes/cuentas");
const authRouter = require("./routes/auth");

const app = express();

console.log("--- Aplicación Iniciándose ---");

// 🔥🔥 NUEVO: Middleware CORS **más permisivo temporalmente**
// ⛔ ADVERTENCIA: No dejes esto así en producción final
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*"); // NUEVA LÍNEA - permite cualquier origen
  res.setHeader("Access-Control-Allow-Credentials", "true");               // NUEVA LÍNEA - permite credenciales
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"); // NUEVA LÍNEA
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization"); // NUEVA LÍNEA
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // NUEVA LÍNEA - responde rápido a preflight
  }
  next(); // NUEVA LÍNEA - pasa al siguiente middleware
});

// 🔁 OPCIONAL: Puedes mantener o comentar esta configuración previa específica de CORS:
/*
const allowedOrigins = [
  "https://metasapp2025-production.up.railway.app/login",
  "http://localhost:5173"
];
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`CORS Check: Recibido origin = ${origin}`);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ Origen NO PERMITIDO: ${origin}`);
      callback(new Error("Origen no permitido"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin"],
  optionsSuccessStatus: 200
};
console.log("Aplicando middleware CORS global (configuración específica)...");
app.use(cors(corsOptions));
console.log("Middleware CORS global aplicado.");
*/

// 🎯 El resto se mantiene igual...
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 🔐 JWT...
// (todo esto queda igual como ya lo tenías)

// 📌 Rutas de la API
app.use("/api", cuentasRouter);
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", authRouter);
console.log("app.js - Antes de app.get(*)");

// 📦 Sirviendo frontend si aplica
app.get("*", (req, res, next) => {
  console.log("app.js - Dentro de app.get(*), req.path:", req.path);
  if (req.method === "GET" && req.accepts("html") && !req.path.startsWith("/api/")) {
    console.log(` Mapeando ruta ${req.path} a index.html`);
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  } else {
    next();
  }
});

// 🛑 404 handler
app.use(function (req, res, next) {
  console.warn(`⚠️ Recurso no encontrado (404): ${req.method} ${req.originalUrl}`);
  next(createError(404));
});

// 🔥 Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error Global Capturado:", err.message);
  console.error("Stack:", err.stack);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  if (req.accepts("json")) {
    res.status(err.status || 500).json({
      error: {
        message: err.message || "Error interno del servidor"
      }
    });
  } else {
    res.status(err.status || 500).send(`Error: ${err.message}`);
  }
});

console.log("app.js - Antes de app.listen()");
//const PORT = process.env.PORT || 10000;
//console.log("app.js - Valor de PORT:", PORT);
//app.listen(PORT, () => {
  //console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  //console.log(` Modo de entorno: ${process.env.NODE_ENV || "development"}`);
//});

module.exports = app;
