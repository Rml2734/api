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

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization,Origin,X-Requested-With",
  optionsSuccessStatus: 204
}));

// 🛡️ Headers Manuales para CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://metasapp2025.onrender.com");
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