var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
// NO necesitas importar 'cors' aquí si se aplica globalmente en app.js

var router = express.Router();
const { pedirCuenta, crear, borrar } = require("../db/pedidos"); // Importar borrar aquí
const { body, validationResult } = require("express-validator");
// const { borrar } = require("../db/pedidos"); // Ya importado arriba

// NO necesitas definir corsOptions aquí si se define y aplica globalmente en app.js

// Añadir middleware de autenticación (esto está bien si solo se usa aquí)
const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Acceso no autorizado" });

  jwt.verify(token, process.env.JWT_SECRET || "secreto", (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });

    // Guarda la información decodificada en req.usuario para usarla en rutas protegidas
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
    // No aplicar CORS aquí, ya está globalmente
    console.log("-> Entrando a /api/signup"); // Log de entrada
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
        if (err) {
           console.error("Error al crear cuenta en DB:", err);
           return next(err); // Pasar error al manejador global
        }
        if (!cuenta || !cuenta.usuario) {
           console.error("Error: La función 'crear' no devolvió una cuenta válida.");
           return next(new Error("Error al crear la cuenta"));
        }

        console.log("Cuenta creada, generando token para:", cuenta.usuario);
        try {
            const ficha = await crearFicha(cuenta.usuario);
            console.log("Token generado, enviando respuesta.");
            res.status(201).send({ token: ficha }); // Usar 201 Created
        } catch(fichaError) {
            console.error("Error al crear ficha/token después de crear cuenta:", fichaError);
            // Considera si quieres borrar la cuenta recién creada si el token falla
            next(fichaError);
        }
      });
    } catch (error) {
      console.error("Error inesperado en /api/signup:", error);
      next(error); // Pasar error al manejador global
    }
  }
);

// ELIMINADO: router.options('/login', ...) - Dejar que el middleware global lo maneje

/* POST Login */
router.post(
  "/login",
  body("usuario").isEmail(),
  body("clave").isLength({ min: 5 }),
  // NO aplicar CORS aquí, ya está globalmente
  async function (req, res, next) {
    // 👇 *** Log añadido al inicio del handler *** 👇
    console.log("🔥🔥🔥 ENTRANDO AL HANDLER POST /api/login (en cuentas.js) 🔥🔥🔥");
    try { // Envuelve toda la lógica en try...catch
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Errores de validación en login:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const login = req.body;
      console.log(`Intentando login para usuario: ${login.usuario}`);

      pedirCuenta(login.usuario, async (err, [cuenta]) => {
        // Es crucial manejar errores aquí también
        if (err) {
            console.error(`Error en pedirCuenta para ${login.usuario}:`, err);
            return next(err); // Pasar error al manejador global
        }
        if (!cuenta) {
            console.log(`Cuenta no encontrada para ${login.usuario}`);
            return res.status(404).send({ error: "Usuario no encontrado" }); // Enviar 404
        }

        console.log(`Cuenta encontrada para ${login.usuario}, comparando clave...`);
        const result = await bcrypt.compare(login.clave, cuenta.hash);

        if (!result) {
            console.log(`Clave incorrecta para ${login.usuario}`);
            return res.status(401).send({ error: "Credenciales inválidas" }); // Enviar 401
        }

        console.log(`Clave correcta para ${login.usuario}, creando token...`);
        try {
            const ficha = await crearFicha(login.usuario);
            console.log(`Token creado para ${login.usuario}, enviando respuesta.`);
            res.send({ token: ficha }); // Envía el token
        } catch (fichaError) {
             console.error(`Error al crear ficha/token para ${login.usuario}:`, fichaError);
             next(fichaError); // Pasar error al manejador global
        }
      });
    } catch (error) {
      // Captura cualquier error síncrono inesperado al inicio
      console.error("💥 Error inesperado DENTRO DEL HANDLER POST /api/login:", error);
      next(error); // Pasar error al manejador global
    }
  }
);

// Ruta DELETE /api/usuarios/:id para eliminar usuario autenticado
// Asegúrate que "/api" ya está prefijado en app.js al montar este router
router.delete('/usuarios/:id', autenticar, async (req, res, next) => { // Añadir next
  // Verificar que el ID del usuario autenticado coincide con el ID a borrar (o si es admin)
  // Esto es una medida de seguridad importante
  if (req.usuario.id !== parseInt(req.params.id, 10)) {
      console.warn(`Intento no autorizado de borrar usuario ${req.params.id} por usuario ${req.usuario.id}`);
      return res.status(403).json({ error: "No tienes permiso para borrar este usuario" });
  }

  try {
    const usuarioId = parseInt(req.params.id, 10); // Asegúrate que es un número
    if (isNaN(usuarioId)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
    }
    console.log(`🗑️ Intentando eliminar usuario y sus metas con ID: ${usuarioId}`);

    // 1. Borrar metas asociadas (usando la tabla "metas" y cuenta_id)
    // Asumiendo que la función borrar toma ('nombreTabla', {condicionWhere})
    // NECESITAS AJUSTAR ESTO A CÓMO FUNCIONA REALMENTE TU FUNCIÓN `borrar`
    // Si `borrar` solo toma ID, necesitas una función específica para borrar por cuenta_id
    console.log(`   Borrando metas para cuenta_id: ${usuarioId}...`);
    // EJEMPLO - ADAPTAR A TU FUNCIÓN `borrar` o crear una nueva `borrarMetasPorCuentaId`
    // await new Promise((resolve, reject) => {
    //   db.query('DELETE FROM metas WHERE cuenta_id = $1', [usuarioId], (err, result) => {
    //      if (err) return reject(err);
    //      console.log(`   Metas borradas: ${result.rowCount}`);
    //      resolve();
    //   });
    // });
    // O si tu función borrar funciona con { whereClause }:
     await new Promise((resolve, reject) => {
       borrar("metas", { cuenta_id: usuarioId }, (err, result) => { // Asumiendo que borrar acepta un objeto como condición
         if (err) return reject(err);
         console.log(`   Resultado borrado metas:`, result); // Loguea el resultado
         resolve();
       });
     });


    // 2. Borrar usuario (tabla "cuentas", usando el ID)
    console.log(`   Borrando cuenta con id: ${usuarioId}...`);
    await new Promise((resolve, reject) => {
      // Asumiendo que borrar por ID funciona así:
      borrar("cuentas", { id: usuarioId }, (err, result) => { // Asumiendo que borrar acepta un objeto como condición
        if (err) return reject(err);
         console.log(`   Resultado borrado cuenta:`, result); // Loguea el resultado
        resolve();
      });
    });

    console.log(`✅ Usuario y metas eliminados para ID: ${usuarioId}`);
    res.status(204).end(); // 204 No Content es apropiado para DELETE exitoso

  } catch (error) {
    console.error("❌ Error en la ruta de eliminación /api/usuarios/:id :", error);
    next(error); // Pasa el error al manejador global
  }
});


// Función para crear el token JWT
// (Sin cambios respecto a tu versión, parece correcta)
function crearFicha(email) {
  return new Promise((resolve, reject) => {
    pedirCuenta(email, (err, [cuenta]) => {
      if (err) {
        console.error(`Error en pedirCuenta dentro de crearFicha para ${email}:`, err);
        return reject(err);
      }
      if (!cuenta) {
        console.error(`Cuenta no encontrada dentro de crearFicha para ${email}`);
        // Es importante devolver un error claro aquí, quizás 404 o 500
        return reject(createError(404, "Cuenta no encontrada al crear ficha"));
      }

      // Verificación adicional del ID
      if (!cuenta.id) {
        console.error("❌ Error: La cuenta recuperada no tiene ID en crearFicha");
        return reject(createError(500,"Error interno del servidor: cuenta sin ID"));
      }

      console.log(`Creando ficha JWT para usuario: ${email}, ID: ${cuenta.id}`);
      let ficha;
      try {
          ficha = jwt.sign(
            {
              exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora de expiración
              usuario: email,
              id: cuenta.id // Incluye el ID en el payload
            },
            process.env.JWT_SECRET || "secreto",
            { algorithm: 'HS256' } // Especificar algoritmo es buena práctica
          );
      } catch(jwtError) {
          console.error("Error al firmar JWT:", jwtError);
          return reject(createError(500, "Error al generar token"));
      }
      console.log("Ficha JWT creada exitosamente.");
      resolve(ficha);
    });
  });
}

module.exports = router;