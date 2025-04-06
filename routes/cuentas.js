var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
const cors = require('cors'); // Importa CORS

var router = express.Router();
const { pedirCuenta, crear } = require("../db/pedidos");
const { body, validationResult } = require("express-validator");
const { borrar } = require("../db/pedidos"); // Asegúrate de importar la función de eliminación

// 🔥 Importa la configuración de CORS (asegúrate de que coincida con tu app.js)
const corsOptions = {
  origin: ["https://metasapp2025.onrender.com"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization',  'Origin'],
  optionsSuccessStatus: 200
};

// Añadir middleware de autenticación
const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Acceso no autorizado" });

  jwt.verify(token, process.env.JWT_SECRET || "secreto", (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });

    req.usuario = {
      id: decoded.id,
      email: decoded.usuario
    };
    next();
  });
};

/* POST Crear cuenta */
router.post(
  "/signup",
  body("usuario").isEmail(),
  body("clave").isLength({ min: 5 }),
  async function (req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const nuevaCuenta = req.body;
      const hash = await bcrypt.hash(nuevaCuenta.clave, 12);
      crear("cuentas", { usuario: nuevaCuenta.usuario, hash }, async (err, cuenta) => {
        if (err) return next(err);

        const ficha = await crearFicha(cuenta.usuario);
        res.send({ token: ficha });
      });
    } catch (error) {
      next(error);
    }
  }
);

/* OPTIONS para /login */
router.options('/login', cors(corsOptions), (req, res) => { // 🔥 Añade el manejador OPTIONS
  res.sendStatus(200);
});

/* POST Login */
router.post(
  "/login",
  body("usuario").isEmail(),
  body("clave").isLength({ min: 5 }),
  cors(corsOptions), // 🔥 Aplica CORS específicamente a esta ruta también (por si acaso)
  async function (req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const login = req.body;
      pedirCuenta(login.usuario, async (err, [cuenta]) => {
        if (err) return next(err);
        if (!cuenta) return res.sendStatus(404);

        const result = await bcrypt.compare(login.clave, cuenta.hash);
        if (!result) return res.sendStatus(401);

        const ficha = await crearFicha(login.usuario);
        res.send({ token: ficha });
      });
    } catch (error) {
      next(error);
    }
  }
);

// Ruta DELETE /api/usuarios para eliminar usuario autenticado
router.delete('/usuarios/:id', autenticar, async (req, res) => {
  try {
    const usuarioId = req.params.id;
    console.log(`🗑 Eliminando usuario con ID: ${usuarioId}`);

    // 1. Borrar metas asociadas (usando la tabla "metas")
    await new Promise((resolve, reject) => {
      borrar("metas", usuarioId, (err) => { // 🔥 Usar función borrar de pedidos.js
        if (err) return reject(err);
        resolve();
      });
    });

    // 2. Borrar usuario
    await new Promise((resolve, reject) => {
      borrar("cuentas", usuarioId, (err) => { // 🔥 Tabla "cuentas"
        if (err) return reject(err);
        resolve();
      });
    });

    res.status(204).end();
  } catch (error) {
    console.error("❌ Error en eliminación:", error);
    res.status(500).json({ error: "Error eliminando usuario y datos relacionados" });
  }
});


// En la función crearFicha:
function crearFicha(email) {
  return new Promise((resolve, reject) => {
    pedirCuenta(email, (err, [cuenta]) => {
      if (err) return reject(err);
      if (!cuenta) return reject(new Error("Cuenta no encontrada"));

      // 🔥 Verificación adicional del ID
      if (!cuenta.id) {
        console.error("❌ Error: La cuenta no tiene ID");
        return reject(new Error("Error en el servidor"));
      }

      let ficha = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hora
          usuario: email,
          id: cuenta.id
        },
        process.env.JWT_SECRET || "secreto", // 🔥 Usa la variable de entorno
        { algorithm: 'HS256' } // 🔥 Especifica el algoritmo
      );
      resolve(ficha);
    });
  });
}

module.exports = router;