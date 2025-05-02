// ===== ARCHIVO: cuentas.js (con POST /login SIMPLIFICADO) =====

var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
// No necesitas 'cors' aquí

var router = express.Router();
const { pedirCuenta, crear, borrar } = require("../db/pedidos");
const { body, validationResult } = require("express-validator");

// Middleware de autenticación (para otras rutas)
const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Acceso no autorizado" });
  jwt.verify(token, process.env.JWT_SECRET || "secreto", (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.usuario = { id: decoded.id, email: decoded.usuario };
    next();
  });
};

/* POST Crear cuenta */
router.post(
  "/signup",
  body("usuario").isEmail(),
  body("clave").isLength({ min: 5 }),
  async function (req, res, next) {
    console.log("-> Entrando a /api/signup");
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Errores de validación en signup:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }
      const nuevaCuenta = req.body;
      console.log("Intentando crear cuenta para:", nuevaCuenta.usuario);
      const hash = await bcrypt.hash(nuevaCuenta.clave, 12);
      crear("cuentas", { usuario: nuevaCuenta.usuario, hash }, async (err, cuenta) => {
        if (err) { console.error("Error al crear cuenta en DB:", err); return next(err); }
        if (!cuenta || !cuenta.usuario) { console.error("Error: La función 'crear' no devolvió una cuenta válida."); return next(new Error("Error al crear la cuenta")); }
        console.log("Cuenta creada, generando token para:", cuenta.usuario);
        try {
            const ficha = await crearFicha(cuenta.usuario);
            console.log("Token generado, enviando respuesta.");
            res.status(201).send({ token: ficha });
        } catch(fichaError) {
            console.error("Error al crear ficha/token después de crear cuenta:", fichaError);
            next(fichaError);
        }
      });
    } catch (error) {
      console.error("Error inesperado en /api/signup:", error);
      next(error);
    }
  }
);


/* POST Login (SIMPLIFICADO PARA DEBUG) */
router.post(
  "/login",
  // Mantenemos las validaciones por si el error estuviera ahí (poco probable)
  body("usuario").isEmail(),
  body("clave").isLength({ min: 5 }),
  // ¡¡La lógica original está reemplazada por el código de abajo!!
  async function (req, res, next) {
    // 👇 *** INICIO DEL CÓDIGO SIMPLIFICADO *** 👇
    console.log("🔥🔥🔥 HANDLER POST LOGIN SIMPLIFICADO 🔥🔥🔥");
    // ¡No hagas NADA más! Ni DB, ni bcrypt, ni JWT.
    res.status(200).send({ message: "Login handler reached (SIMPLIFIED!)" });
    // 👆 *** FIN DEL CÓDIGO SIMPLIFICADO *** 👆
  }
  // Nota: El try...catch original ya no es necesario aquí porque no hay operaciones que puedan fallar.
);


// Ruta DELETE /api/usuarios/:id para eliminar usuario autenticado
router.delete('/usuarios/:id', autenticar, async (req, res, next) => {
  if (req.usuario.id !== parseInt(req.params.id, 10)) {
      console.warn(`Intento no autorizado de borrar usuario ${req.params.id} por usuario ${req.usuario.id}`);
      return res.status(403).json({ error: "No tienes permiso para borrar este usuario" });
  }
  try {
    const usuarioId = parseInt(req.params.id, 10);
    if (isNaN(usuarioId)) { return res.status(400).json({ error: "ID de usuario inválido" }); }
    console.log(`🗑️ Intentando eliminar usuario y sus metas con ID: ${usuarioId}`);
    console.log(`   Borrando metas para cuenta_id: ${usuarioId}...`);
    await new Promise((resolve, reject) => {
       borrar("metas", { cuenta_id: usuarioId }, (err, result) => { if (err) return reject(err); console.log(`   Resultado borrado metas:`, result); resolve(); });
     });
    console.log(`   Borrando cuenta con id: ${usuarioId}...`);
    await new Promise((resolve, reject) => {
      borrar("cuentas", { id: usuarioId }, (err, result) => { if (err) return reject(err); console.log(`   Resultado borrado cuenta:`, result); resolve(); });
    });
    console.log(`✅ Usuario y metas eliminados para ID: ${usuarioId}`);
    res.status(204).end();
  } catch (error) {
    console.error("❌ Error en la ruta de eliminación /api/usuarios/:id :", error);
    next(error);
  }
});


// Función para crear el token JWT
function crearFicha(email) {
  return new Promise((resolve, reject) => {
    pedirCuenta(email, (err, [cuenta]) => {
      if (err) { console.error(`Error en pedirCuenta dentro de crearFicha para ${email}:`, err); return reject(err); }
      if (!cuenta) { console.error(`Cuenta no encontrada dentro de crearFicha para ${email}`); return reject(createError(404, "Cuenta no encontrada al crear ficha")); }
      if (!cuenta.id) { console.error("❌ Error: La cuenta recuperada no tiene ID en crearFicha"); return reject(createError(500,"Error interno del servidor: cuenta sin ID")); }
      console.log(`Creando ficha JWT para usuario: ${email}, ID: ${cuenta.id}`);
      let ficha;
      try {
          ficha = jwt.sign( { exp: Math.floor(Date.now() / 1000) + (60 * 60), usuario: email, id: cuenta.id }, process.env.JWT_SECRET || "secreto", { algorithm: 'HS256' } );
      } catch(jwtError) { console.error("Error al firmar JWT:", jwtError); return reject(createError(500, "Error al generar token")); }
      console.log("Ficha JWT creada exitosamente.");
      resolve(ficha);
    });
  });
}

module.exports = router;