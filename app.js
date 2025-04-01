const cors = require("cors");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { expressjwt: jwt } = require("express-jwt");

// Routers
const indexRouter = require("./routes/index");
const metasRouter = require("./routes/metas");
const cuentasRouter = require("./routes/cuentas");
const authRouter = require("./routes/auth");

const app = express();

// 🔥🔥 Configuración CORS Definitiva
const allowedOrigins = [
  "https://metasapp2025.onrender.com",
  "http://localhost:5173"
];

// 🔥 Middleware CORS mejorado
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// 🛡️ Headers Manuales para CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://metasapp2025.onrender.com");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  
  // Manejar preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }
  next();
});

// 📁 Servir Archivos Estáticos (Fix MIME type)
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders: (res, filePath) => {
    const mimeTypes = {
      ".css": "text/css",
      ".js": "application/javascript",
      ".png": "image/png",
      ".svg": "image/svg+xml"
    };
    const ext = path.extname(filePath).toLowerCase();
    if (mimeTypes[ext]) {
      res.setHeader("Content-Type", mimeTypes[ext]);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache para producción
    }
  }
}));

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 🔐 Configuración JWT Actualizada
app.use(
  jwt({
    secret: process.env.JWT_SECRET || "secreto",
    algorithms: ["HS256"],
    requestProperty: "auth",
    getToken: (req) => {
      // Buscar token en cookies, headers y query params
      return req.cookies?.token 
        || req.headers.authorization?.split(' ')[1] 
        || req.query.token;
    }
  }).unless({
    path: [
      { url: /\/api\/(signup|login)/, methods: ["POST"] }, // Rutas públicas
      { url: /\.(css|js|png|jpg|ico|svg)$/ }, // Archivos estáticos
      { url: "/", methods: ["GET"] }
    ]
  })
);

// Rutas
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", cuentasRouter);
app.use("/api", authRouter);

// 🚨 Manejador de Errores Mejorado
app.use((err, req, res, next) => {
  console.error("🔥 Error Global:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// 🚀 Iniciar Servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Servidor en puerto ${PORT}`);
});

module.exports = app;