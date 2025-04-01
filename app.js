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
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", allowedOrigins);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(204).send();
});

// 📁 Servir Archivos Estáticos (Fix MIME type)
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders: (res, filePath) => {
    const mimeTypes = {
      ".css": "text/css",
      ".js": "application/javascript",
      ".png": "image/png"
    };
    const ext = path.extname(filePath);
    if (mimeTypes[ext]) {
      res.setHeader("Content-Type", mimeTypes[ext]);
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
      // Soporte para token en cookies y headers
      return req.cookies.token || req.headers.authorization?.split(' ')[1];
    }
  }).unless({
    path: [
      { url: "/api/signup", methods: ["POST"] },
      { url: "/api/login", methods: ["POST"] },
      { url: "/api/recuperar-clave", methods: ["POST", "OPTIONS"] },
      { url: "/", methods: ["GET"] },
      { url: /\.(css|js|png|jpg|ico|svg)$/, methods: ["GET"] }
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