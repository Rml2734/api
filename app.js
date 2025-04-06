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

// 🔥🔥 Configuración CORS - LO MÁS TEMPRANO POSIBLE
const allowedOrigins = [
  "https://metasapp2025.onrender.com",
  "https://api-lqys.onrender.com"
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization',  'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));   // ✅ Aplica CORS como el primer middleware

// 🔥🔥 NUEVO EXPERIMENTO: Manejar OPTIONS para /api/login directamente
app.options('/api/login', cors(corsOptions), (req, res) => {
  console.log("🔥 EXPERIMENTO: Recibida solicitud OPTIONS para /api/login en app.js");
  res.sendStatus(200);
});

// 🔥🔥 NUEVO: Ruta OPTIONS de prueba directamente en app.js
app.options('/api/test-cors', cors(corsOptions), (req, res) => {
  console.log("🧪 Recibida solicitud OPTIONS para /api/test-cors en app.js");
  res.sendStatus(200);
});

// 📁 Servir Archivos Estáticos
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 🔐 Configuración JWT con Middleware Condicional
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET || "secreto",
  algorithms: ["HS256"],
  requestProperty: "auth",
  getToken: (req) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || null;
    console.log("🔑 Intentando obtener token:", token, "para la ruta:", req.path, "método:", req.method);
    return token;
  }
});

const shouldSkipJwt = (req) => {
  return (req.method === 'HEAD' && req.path === '/') ||
         (req.method === 'GET' && req.path === '/') ||
         /\.(css|js|png|jpg|ico|svg)$/.test(req.path) ||
         (req.path.startsWith('/api/signup') && req.method === 'POST') ||
         (req.path.startsWith('/api/login') && req.method === 'POST') ||
         (req.path.startsWith('/api/signup') && req.method === 'OPTIONS') ||
         (req.path.startsWith('/api/login') && req.method === 'OPTIONS');
};

app.use((req, res, next) => {
  console.log("➡️ Middleware antes de JWT para la ruta:", req.path, "método:", req.method);
  if (shouldSkipJwt(req)) {
    console.log("⏭️ Omitiendo verificación JWT para la ruta:", req.path, "método:", req.method);
    return next();
  }
  jwtMiddleware(req, res, next);
});

app.use((err, req, res, next) => {
  console.log("❗ Error después de JWT para la ruta:", req.path, "método:", req.method, "Error:", err.message);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Token inválido o no proporcionado' });
  }
  next(err);
});

app.use((req, res, next) => {
  console.log("➡️ Middleware después de JWT (si no hubo error) para la ruta:", req.path, "método:", req.method);
  next();
});

// Rutas
app.use("/api", cuentasRouter);
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", authRouter);

// Sirve index.html para cualquier ruta no manejada por el API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

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