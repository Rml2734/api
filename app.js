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

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization,Origin,X-Requested-With",
  optionsSuccessStatus: 204
}));

app.options("*", cors()); // 🔥 Importante para preflight CORS

// 🛡️ Headers Manuales para CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://metasapp2025.onrender.com", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Authorization");
  next();
});

// 📁 Servir Archivos Estáticos (Fix MIME type)
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css");
    }
    // Añade otros tipos MIME si es necesario
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

// 🚨 Manejador de Errores Mejorado
app.use(function (err, req, res, next) {
  console.error("🔥 Error en el backend:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    detalles: req.app.get("env") === "development" ? err.stack : undefined,
  });
});

// 🚀 Iniciar Servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Servidor en puerto ${PORT}`);
});

module.exports = app;
