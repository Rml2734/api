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
  "https://metasapp2025.onrender.com"
];

// 🔥 Middleware CORS mejorado
const corsOptions = {
  origin: ["https://metasapp2025.onrender.com"], // ✅ Usa la lista de orígenes permitidos
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization',  'Origin'],
  optionsSuccessStatus: 200 // 🔥 Necesario para algunas configuraciones
};

app.use(cors(corsOptions));  // ✅ Aplica solo esta configuración


// 📁 Servir Archivos Estáticos (Fix MIME type)
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript'); // ✅ Previene errores futuros
    }
  }
}));

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 🔐 Configuración JWT Actualizada
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET || "secreto",
  algorithms: ["HS256"],
  requestProperty: "auth",
  getToken: (req) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || null;
    console.log("🔑 Intentando obtener token:", token, "para la ruta:", req.path, "método:", req.method); // Log
    return token;
  }
}).unless({
  path: [
    { url: /\/api\/(signup|login)/, methods: ["POST", "OPTIONS"] },
    { url: /\.(css|js|png|jpg|ico|svg)$/ },
    { url: "/", methods: ["GET"] }
  ]
});

app.use((req, res, next) => {
  console.log("➡️ Middleware antes de JWT para la ruta:", req.path, "método:", req.method); // Log
  next();
});

app.use(jwtMiddleware);

app.use((err, req, res, next) => {
  console.log("❗ Error después de JWT para la ruta:", req.path, "método:", req.method, "Error:", err.message); // Log
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Token inválido o no proporcionado' });
  }
  next(err);
});

app.use((req, res, next) => {
  console.log("➡️ Middleware después de JWT (si no hubo error) para la ruta:", req.path, "método:", req.method); // Log
  next();
});

// Rutas
app.use("/", indexRouter);
app.use("/api/metas", metasRouter);
app.use("/api", cuentasRouter);
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