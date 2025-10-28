// ===== ARCHIVO FINAL: cuentas.js (con Manejo de Resultado de pedirCuenta Mejorado) =====
/*
var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
var createError = require("http-errors"); // Asegúrate de tener esta línea si la usas (ej. en crearFicha)
var cors = require("cors"); // 🆕 Nuevo requerimiento de CORS

var router = express.Router();
// Asegúrate que las funciones importadas hagan lo que esperas
const { pedirCuenta, crear, borrar } = require("../db/pedidos");
const { body, validationResult } = require("express-validator");
const pool = require('../db/configuracion'); // ✅ Importar pool
// 🆕 Importar configuración CORS del app.js
// 🟢 IMPORTACIÓN CORRECTA 🟢
const { corsOptions } = require("../config/cors"); // 👈 Nueva importación desde config/

// 🆕 1. Manejar solicitudes OPTIONS para login
router.options("/login", cors(corsOptions), (req, res) => {
    console.log("🔥🔥🔥 MANEJANDO OPTIONS PARA /login");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin");
    res.status(200).end();
});

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
*/
/* POST Crear cuenta */
/*
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
*/

/* POST Login (Lógica Completa Restaurada + Manejo Mejorado de pedirCuenta) */
/*
router.post(
    "/login",
    cors(corsOptions), // 🆕 Aplicar CORS específicamente aquí
    body("usuario").isEmail(),
    body("clave").isLength({ min: 5 }),
    async function (req, res, next) {
        // 👇 *** Log inicial del handler *** 👇
        console.log("🔥🔥🔥 ENTRANDO AL HANDLER POST /api/login (Lógica Completa) 🔥🔥🔥");
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log("Errores de validación en login:", errors.array());
                // Asegúrate de no continuar si hay errores de validación
                return res.status(400).json({ errors: errors.array() });
            }

            const login = req.body;
            console.log(`Intentando login para usuario: ${login.usuario}`);

            // 👇 *** Log ANTES de llamar a la BD *** 👇
            console.log("PASO 1: Llamando a pedirCuenta...");
            pedirCuenta(login.usuario, async (err, cuentaArray) => {
                // 👇 *** Log DESPUÉS de llamar a la BD (o si hay error) *** 👇
                if (err) {
                    console.error(`💥 ERROR en pedirCuenta para ${login.usuario}:`, err);
                    return next(err); // Pasa el error al manejador global
                }
                console.log("PASO 2: Respuesta de pedirCuenta recibida.");
                console.log("PASO 2b: Contenido de cuentaArray:", cuentaArray); // Log para depuración

                const cuenta = cuentaArray && cuentaArray.length > 0 ? cuentaArray[0] : null;

                if (!cuenta) {
                    console.log(`Cuenta no encontrada para ${login.usuario}`);
                    // Devuelve un error claro y termina la ejecución
                    return res.status(404).send({ error: "Usuario no encontrado" });
                }
                console.log(`PASO 3: Cuenta encontrada para ${login.usuario}. ID: ${cuenta.id}. Comparando clave...`);

                // 👇 *** Log ANTES de bcrypt *** 👇
                let result;
                try {
                    console.log("PASO 4: Llamando a bcrypt.compare...");
                    result = await bcrypt.compare(login.clave, cuenta.hash);
                    // 👇 *** Log DESPUÉS de bcrypt *** 👇
                    console.log("PASO 5: bcrypt.compare completado. Resultado:", result);
                } catch (bcryptError) {
                    console.error(`💥 ERROR en bcrypt.compare para ${login.usuario}:`, bcryptError);
                    return next(bcryptError); // Pasa el error
                }

                if (!result) {
                    console.log(`Clave incorrecta para ${login.usuario}`);
                    // Devuelve un error claro y termina la ejecución
                    return res.status(401).send({ error: "Credenciales inválidas" });
                }
                console.log(`PASO 6: Clave correcta para ${login.usuario}. Creando token...`);

                // 👇 *** Log ANTES de crear ficha/token *** 👇
                try {
                    console.log("PASO 7: Llamando a crearFicha...");
                    const ficha = await crearFicha(login.usuario);
                    // 👇 *** Log DESPUÉS de crear ficha/token *** 👇
                    console.log("PASO 8: Ficha/Token creado exitosamente.");
                    console.log(`   Enviando token para ${login.usuario}.`);
                    res.send({ token: ficha }); // Envía el token real
                } catch (fichaError) {
                    console.error(`💥 ERROR al crear ficha/token para ${login.usuario}:`, fichaError);
                    next(fichaError); // Pasa el error
                }
            }); // Fin del callback de pedirCuenta
        } catch (error) {
            // Captura cualquier error síncrono inesperado al inicio del handler
            console.error("💥 Error inesperado GENERAL en POST /api/login:", error);
            next(error); // Pasa el error al manejador global
        }
    } // Fin de la función async del handler
);


// Ruta DELETE /api/usuarios/:id para eliminar usuario autenticado
router.delete('/usuarios/:id', autenticar, async (req, res, next) => {
    if (!req.usuario || req.usuario.id !== parseInt(req.params.id, 10)) {
        const userId = req.usuario ? req.usuario.id : 'desconocido';
        console.warn(`Intento no autorizado de borrar usuario ${req.params.id} por usuario ${userId}`);
        return res.status(403).json({ error: "No tienes permiso para borrar este usuario" });
    }
    try {
        const usuarioId = parseInt(req.params.id, 10);
        if (isNaN(usuarioId)) { return res.status(400).json({ error: "ID de usuario inválido" }); }
        console.log(`️🗑️ Intentando eliminar usuario y sus metas con ID: ${usuarioId}`);
        console.log(`  Borrando metas para cuenta_id: ${usuarioId}...`);

        // Importa configuracion.js en lugar de conexion.js
        const db = require('../db/configuracion');

        // Eliminar metas usando el nombre de columna correcto 'cuenta_id'
        await pool.query('DELETE FROM metas WHERE cuenta_id = $1', [usuarioId]);

        console.log(`  Borrando cuenta con id: ${usuarioId}...`);

        // Eliminar la cuenta
        await pool.query('DELETE FROM cuentas WHERE id = $1', [usuarioId]);

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

*/


var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
var createError = require("http-errors"); // Asegúrate de tener esta línea si la usas (ej. en crearFicha)
var cors = require("cors"); // 🆕 Nuevo requerimiento de CORS

var router = express.Router();
// Asegúrate que las funciones importadas hagan lo que esperas
const { pedirCuenta, crear, borrar } = require("../db/pedidos");
const { body, validationResult } = require("express-validator");
const pool = require('../db/configuracion'); // ✅ Importar pool
// 🆕 Importar configuración CORS del app.js
// 🟢 IMPORTACIÓN CORRECTA 🟢
const { corsOptions } = require("../config/cors"); // 👈 Nueva importación desde config/

// 🆕 1. Manejar solicitudes OPTIONS para login
router.options("/login", cors(corsOptions), (req, res) => {
    console.log("🔥🔥🔥 MANEJANDO OPTIONS PARA /login");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin");
    res.status(200).end();
});

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
    body("usuario").isEmail().withMessage("El formato del correo electrónico es inválido."),
    body("clave").isLength({ min: 5 }).withMessage("La clave debe tener un mínimo de 5 caracteres."), // ⬅️ CAMBIO CLAVE AQUÍ
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

/* POST Login (Lógica Completa Restaurada + Manejo Mejorado de pedirCuenta) */
router.post(
    "/login",
    cors(corsOptions), // 🆕 Aplicar CORS específicamente aquí
    body("usuario").isEmail().withMessage("El formato del correo electrónico es inválido."),
    body("clave").isLength({ min: 5 }).withMessage("La clave debe tener un mínimo de 5 caracteres."), // ⬅️ CAMBIO CLAVE AQUÍ
    async function (req, res, next) {
        // 👇 *** Log inicial del handler *** 👇
        console.log("🔥🔥🔥 ENTRANDO AL HANDLER POST /api/login (Lógica Completa) 🔥🔥🔥");
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log("Errores de validación en login:", errors.array());
                // Asegúrate de no continuar si hay errores de validación
                return res.status(400).json({ errors: errors.array() });
            }

            const login = req.body;
            console.log(`Intentando login para usuario: ${login.usuario}`);

            // 👇 *** Log ANTES de llamar a la BD *** 👇
            console.log("PASO 1: Llamando a pedirCuenta...");
            pedirCuenta(login.usuario, async (err, cuentaArray) => {
                // 👇 *** Log DESPUÉS de llamar a la BD (o si hay error) *** 👇
                if (err) {
                    console.error(`💥 ERROR en pedirCuenta para ${login.usuario}:`, err);
                    return next(err); // Pasa el error al manejador global
                }
                console.log("PASO 2: Respuesta de pedirCuenta recibida.");
                console.log("PASO 2b: Contenido de cuentaArray:", cuentaArray); // Log para depuración

                const cuenta = cuentaArray && cuentaArray.length > 0 ? cuentaArray[0] : null;

                if (!cuenta) {
                    console.log(`Cuenta no encontrada para ${login.usuario}`);
                    // Devuelve un error claro y termina la ejecución
                    return res.status(404).send({ error: "Usuario no encontrado" });
                }
                console.log(`PASO 3: Cuenta encontrada para ${login.usuario}. ID: ${cuenta.id}. Comparando clave...`);

                // 👇 *** Log ANTES de bcrypt *** 👇
                let result;
                try {
                    console.log("PASO 4: Llamando a bcrypt.compare...");
                    result = await bcrypt.compare(login.clave, cuenta.hash);
                    // 👇 *** Log DESPUÉS de bcrypt *** 👇
                    console.log("PASO 5: bcrypt.compare completado. Resultado:", result);
                } catch (bcryptError) {
                    console.error(`💥 ERROR en bcrypt.compare para ${login.usuario}:`, bcryptError);
                    return next(bcryptError); // Pasa el error
                }

                if (!result) {
                    console.log(`Clave incorrecta para ${login.usuario}`);
                    // Devuelve un error claro y termina la ejecución
                    return res.status(401).send({ error: "Credenciales inválidas" });
                }
                console.log(`PASO 6: Clave correcta para ${login.usuario}. Creando token...`);

                // 👇 *** Log ANTES de crear ficha/token *** 👇
                try {
                    console.log("PASO 7: Llamando a crearFicha...");
                    const ficha = await crearFicha(login.usuario);
                    // 👇 *** Log DESPUÉS de crear ficha/token *** 👇
                    console.log("PASO 8: Ficha/Token creado exitosamente.");
                    console.log(`   Enviando token para ${login.usuario}.`);
                    res.send({ token: ficha }); // Envía el token real
                } catch (fichaError) {
                    console.error(`💥 ERROR al crear ficha/token para ${login.usuario}:`, fichaError);
                    next(fichaError); // Pasa el error
                }
            }); // Fin del callback de pedirCuenta
        } catch (error) {
            // Captura cualquier error síncrono inesperado al inicio del handler
            console.error("💥 Error inesperado GENERAL en POST /api/login:", error);
            next(error); // Pasa el error al manejador global
        }
    } // Fin de la función async del handler
);


// Ruta DELETE /api/usuarios/:id para eliminar usuario autenticado
router.delete('/usuarios/:id', autenticar, async (req, res, next) => {
    if (!req.usuario || req.usuario.id !== parseInt(req.params.id, 10)) {
        const userId = req.usuario ? req.usuario.id : 'desconocido';
        console.warn(`Intento no autorizado de borrar usuario ${req.params.id} por usuario ${userId}`);
        return res.status(403).json({ error: "No tienes permiso para borrar este usuario" });
    }
    try {
        const usuarioId = parseInt(req.params.id, 10);
        if (isNaN(usuarioId)) { return res.status(400).json({ error: "ID de usuario inválido" }); }
        console.log(`️🗑️ Intentando eliminar usuario y sus metas con ID: ${usuarioId}`);
        console.log(`  Borrando metas para cuenta_id: ${usuarioId}...`);

        // Importa configuracion.js en lugar de conexion.js
        const db = require('../db/configuracion');

        // Eliminar metas usando el nombre de columna correcto 'cuenta_id'
        await pool.query('DELETE FROM metas WHERE cuenta_id = $1', [usuarioId]);

        console.log(`  Borrando cuenta con id: ${usuarioId}...`);

        // Eliminar la cuenta
        await pool.query('DELETE FROM cuentas WHERE id = $1', [usuarioId]);

        console.log(`✅ Usuario y metas eliminados para ID: ${usuarioId}`);
        res.status(204).end();
    } catch (error) {
        console.error("❌ Error en la ruta de eliminación /api/usuarios/:id :", error);
        next(error);
    }
});




// Función para crear el token JWT
/*
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
*/
function crearFicha(email) {
    // 🚨 ESTE CÓDIGO FUE MODIFICADO
    const EXPIRACION_TEST = '10m'; // 👈 ¡1 MINUTO PARA PRUEBAS!

    return new Promise((resolve, reject) => {
        pedirCuenta(email, (err, [cuenta]) => {
            if (err) { console.error(`Error en pedirCuenta dentro de crearFicha para ${email}:`, err); return reject(err); }
            if (!cuenta) { console.error(`Cuenta no encontrada dentro de crearFicha para ${email}`); return reject(createError(404, "Cuenta no encontrada al crear ficha")); }
            if (!cuenta.id) { console.error("❌ Error: La cuenta recuperada no tiene ID en crearFicha"); return reject(createError(500,"Error interno del servidor: cuenta sin ID")); }
            console.log(`Creando ficha JWT para usuario: ${email}, ID: ${cuenta.id}`);
            let ficha;
            try {
                // ✅ CAMBIO CLAVE: Usamos 'expiresIn' en lugar de calcular 'exp' manualmente
                ficha = jwt.sign( 
                    { usuario: email, id: cuenta.id }, 
                    process.env.JWT_SECRET || "secreto", 
                    { 
                        expiresIn: EXPIRACION_TEST, // Usamos la variable de 1 minuto
                        algorithm: 'HS256' 
                    } 
                );
            } catch(jwtError) { console.error("Error al firmar JWT:", jwtError); return reject(createError(500, "Error al generar token")); }
            console.log("Ficha JWT creada exitosamente.");
            resolve(ficha);
        });
    });
}

module.exports = router;