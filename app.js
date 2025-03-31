const cors = require("cors");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { expressjwt: jwt } = require("express-jwt");

var indexRouter = require("./routes/index");
var metasRouter = require("./routes/metas");
var cuentasRouter = require("./routes/cuentas");
var authRouter = require("./routes/auth"); // 🔥 Importamos auth.js

var app = express();

// 🔥 Middleware CORS debe estar al inicio
// 🔥 Configuración CORS actualizada
const allowedOrigins = [
  "http://localhost:5173", //Desarrollo
  "https://metasapp2025.onrender.com", // Tu frontend en producción
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite solicitudes sin origen (como apps móviles o curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origen no permitido por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



app.options('*', cors()); // 🔥 ¡Clave para preflight!

// 🔥 Middlewares de Express (después de CORS)
app.use(express.static(path.join(__dirname, "public")));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//🔐 Middleware de autenticación JWT, excluyendo rutas públicas
app.use(
  jwt({
    secret: "secreto",
    algorithms: ["HS256"],
    requestProperty: "auth",
  }).unless({
    path: [
      { url: '/', methods: ['GET', 'HEAD', 'OPTIONS'] },
      { url: '/api/signup', methods: ['POST', 'OPTIONS'] }, // 🔥 Agrega OPTIONS
      { url: '/api/login', methods: ['POST', 'OPTIONS'] },    // 🔥 Agrega OPTIONS
      { url: '/api/recuperar-clave', methods: ['POST', 'OPTIONS'] },
      { url: '*', methods: ['OPTIONS'] } // 🔥 ¡Permite OPTIONS en todas las rutas!
    ],
  })
); // 🔥 Permitimos la recuperación de clave sin autenticación

// Rutas
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", cuentasRouter);
app.use("/api", authRouter); // 🔥 Agregamos la ruta de autenticación

// 🔥 Manejador de errores mejorado (todo en JSON)
app.use(function (err, req, res, next) {
  console.error("🔥 Error en el backend:", err);

  // Respuesta estructurada
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    detalles: req.app.get("env") === "development" ? err.stack : undefined,
  });
});

// 🔥 Agrega esto al final (antes de module.exports):
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Servidor activo en puerto ${port}`);
});

module.exports = app;
