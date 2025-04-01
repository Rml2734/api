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
var authRouter = require("./routes/auth");

var app = express();

// 🔥 Configuración CORS con opciones mejoradas
const allowedOrigins = [
  "http://localhost:5173",
  "https://metasapp2025.onrender.com",
  "https://api-lays.onrender.com"
];

app.use(
  cors({
    origin: allowedOrigins, // Lista de dominios permitidos
    credentials: true, // Permite cookies y encabezados de autenticación
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

app.options("*", cors()); // 🔥 Importante para preflight CORS

// 🔥 Servir archivos estáticos correctamente
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css");
    }
  }
}));
app.use(express.static(path.join(__dirname, "dist")));

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 🔐 Middleware de autenticación JWT
app.use(
  jwt({
    secret: "secreto",
    algorithms: ["HS256"],
    requestProperty: "auth",
  }).unless({
    path: [
      { url: "/", methods: ["GET", "HEAD", "OPTIONS"] },
      { url: "/api/signup", methods: ["POST", "OPTIONS"] },
      { url: "/api/login", methods: ["POST", "OPTIONS"] },
      { url: "/api/recuperar-clave", methods: ["POST", "OPTIONS"] },
      { url: /^\/public\/.*/, methods: ["GET"] }
    ],
  })
);

// Rutas
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", cuentasRouter);
app.use("/api", authRouter);

// 🔥 Manejador de errores mejorado
app.use(function (err, req, res, next) {
  console.error("🔥 Error en el backend:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    detalles: req.app.get("env") === "development" ? err.stack : undefined,
  });
});

// 🔥 Iniciar servidor
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Servidor activo en puerto ${port}`);
});

module.exports = app;
