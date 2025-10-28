/*
const express = require("express");
const router = express.Router();
const db = require("../db/configuracion"); // Asegúrate de que la conexión a la BD esté bien configurada
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken'); // Importamos jwt para manejar la autenticación

// Ruta para solicitar recuperación de contraseña
router.post("/recuperar-clave", async (req, res) => {
    const { email } = req.body;

    try {
        // Verificar si el usuario existe
        console.log("Ejecutando consulta:", "SELECT * FROM cuentas WHERE usuario = $1", [email]);
        const resultado = await db.query("SELECT * FROM cuentas WHERE usuario = $1", [email]);
        console.log("Resultado de la consulta:", resultado); // Agrega esta línea

        if (resultado.rows.length === 0) {
            return res.status(400).json({ error: "No existe un usuario con ese correo." });
        }

        // Generar un código de recuperación aleatorio
        const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000);
        await db.query("UPDATE cuentas SET codigo_recuperacion = $1 WHERE usuario = $2", [codigoRecuperacion, email]);

        // 🔥 Configuración real de Nodemailer (usa variables de entorno)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER, // Ej: "tuapp@gmail.com"
                pass: process.env.GMAIL_APP_PASSWORD // Contraseña de aplicación
            }
        });

        // Enviar el correo con el código de recuperación
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Recuperación de contraseña",
            text: `Tu código de recuperación es: ${codigoRecuperacion}`
        });

        res.json({ mensaje: "Correo enviado con éxito." });
    } catch (error) {
        console.error("🔥 Error en /recuperar-clave:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
});

// Endpoint para refrescar el token
router.post("/refresh-token", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(403).json({ error: "Refresh token requerido" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token: newToken });
    });
});

module.exports = router;
*/

/*
const sgMail = require('@sendgrid/mail');
const express = require("express");
const router = express.Router();
const db = require("../db/configuracion"); 
//const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken'); 

// Asume que ya tienes 'bcrypt' instalado e importado
const bcrypt = require("bcrypt"); 
const saltRounds = 12; // Número de rondas de hash para bcrypt

// Ruta para restablecer la contraseña usando el código de recuperación
router.post("/restablecer-clave", async (req, res) => {
    // 1. Recibir datos: email, código y nueva contraseña
    const { email, codigo, nuevaClave } = req.body;

    // Validación básica
    if (!email || !codigo || !nuevaClave) {
        return res.status(400).json({ error: "Faltan datos requeridos (email, código, nueva clave)." });
    }
    
    // Opcional: Validar longitud/complejidad de la nueva clave aquí

    try {
        // 2. Buscar usuario y verificar código y expiración
        const resultado = await db.query(
            "SELECT * FROM cuentas WHERE usuario = $1 AND codigo_recuperacion = $2", 
            [email, codigo]
        );

        const cuenta = resultado.rows[0];

        if (!cuenta) {
            return res.status(400).json({ error: "Código de recuperación o correo incorrecto." });
        }

        // 3. Verificar si el código ha expirado
        // La columna recuperacion_expira contiene un timestamp
        if (new Date() > new Date(cuenta.recuperacion_expira)) {
            // Si el código expira, lo limpiamos de la base de datos por seguridad
            await db.query("UPDATE cuentas SET codigo_recuperacion = NULL, recuperacion_expira = NULL WHERE usuario = $1", [email]);
            return res.status(400).json({ error: "El código de recuperación ha expirado." });
        }

        // 4. Hashear la nueva contraseña
        const nuevoHash = await bcrypt.hash(nuevaClave, saltRounds);

        // 5. Actualizar la base de datos con la nueva contraseña y limpiar los campos de recuperación
        await db.query(
            "UPDATE cuentas SET hash = $1, codigo_recuperacion = NULL, recuperacion_expira = NULL WHERE usuario = $2", 
            [nuevoHash, email]
        );

        res.json({ mensaje: "Contraseña restablecida con éxito. Ya puedes iniciar sesión." });
    } catch (error) {
        console.error("🔥 Error en /restablecer-clave:", error);
        res.status(500).json({ error: "Error en el servidor al restablecer la clave." });
    }
});

// Ruta para solicitar recuperación de contraseña
router.post("/recuperar-clave", async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Verificar si el usuario existe
        console.log("Ejecutando consulta:", "SELECT * FROM cuentas WHERE usuario = $1", [email]);
        const resultado = await db.query("SELECT * FROM cuentas WHERE usuario = $1", [email]);

        if (resultado.rows.length === 0) {
            return res.status(400).json({ error: "No existe un usuario con ese correo." });
        }

        // 2. Generar y guardar un código de recuperación
        const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000);
        // Generar tiempo de expiración (ej. 1 hora a partir de ahora)
        const recuperacionExpira = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora
        
        await db.query(
            "UPDATE cuentas SET codigo_recuperacion = $1, recuperacion_expira = $2 WHERE usuario = $3", 
            [codigoRecuperacion, recuperacionExpira, email]
        );

        // 3. Configuración de Nodemailer (¡CORREGIDO!)
        // Ahora usa EMAIL_HOST, EMAIL_USER y EMAIL_PASSWORD
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // Usamos la variable EMAIL_HOST de .env
            port: 465, // Puerto estándar y seguro para Gmail
            secure: true, // true para 465, false para otros puertos
            auth: {
                user: process.env.EMAIL_USER, // CORREGIDO: Usa EMAIL_USER
                pass: process.env.EMAIL_PASSWORD // CORREGIDO: Usa EMAIL_PASSWORD
            },
            // ✅ SOLUCIÓN SEGURA: Desactiva solo en DEV, pero mantiene TRUE en producción.
            tls: {
                // Desactiva la verificación de certificado SOLAMENTE si no estamos en producción.
                //lo usaremos para desarrollo local
                rejectUnauthorized: process.env.NODE_ENV !== 'production' ? false : true 

                
            }
        });

        // 4. Enviar el correo
await transporter.sendMail({
    // 🚨 CAMBIO CLAVE AQUÍ: Agregar el nombre de tu aplicación
    from: `"Soporte MetasApp" <${process.env.EMAIL_USER}>`, 
    // Ahora aparecerá: "Soporte MetasApp" <robml2734@gmail.com>
    
    to: email,
    subject: "MetasApp: Restablece tu contraseña", // Mejora el asunto también
    html: `
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Si no solicitaste esto, ignora este correo.</p>
        <p style="font-size: 20px; font-weight: bold; color: #3498db;">Tu código de recuperación es: ${codigoRecuperacion}</p>
        <p>Este código expira en una hora.</p>
    `
});

        res.json({ mensaje: "Correo enviado con éxito." });
    } catch (error) {
        console.error("🔥 Error en /recuperar-clave:", error);
        // Si falla el login de Nodemailer o la conexión, devuelve un error 500
        res.status(500).json({ error: "Error al enviar el correo. Verifica las credenciales." });
    }
});



// Endpoint para refrescar el token
router.post("/refresh-token", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(403).json({ error: "Refresh token requerido" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        // 🚨 CAMBIO AQUÍ: '1h' (1 hora) a '1m' (1 minuto) para pruebas rápidas
        const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '10m' });
        res.json({ token: newToken });
    });
});

module.exports = router;
*/

// Importaciones requeridas
const sgMail = require('@sendgrid/mail'); // Cliente de la API de SendGrid
const express = require("express");
const router = express.Router();
const db = require("../db/configuracion"); // Asume que 'db' es tu objeto de conexión a Postgres
const jwt = require('jsonwebtoken'); 
const bcrypt = require("bcrypt"); 

// --- CONFIGURACIÓN DE SENDGRID API ---
// Usa process.env.EMAIL_PASSWORD, que debe contener tu API Key de SendGrid (SG.xxxx)
sgMail.setApiKey(process.env.EMAIL_PASSWORD);

const saltRounds = 12; // Número de rondas de hash para bcrypt

// =========================================================================
// RUTA: RESTABLECER CLAVE (Usando Código de la base de datos)
// =========================================================================
router.post("/restablecer-clave", async (req, res) => {
    // 1. Recibir datos: email, código y nueva contraseña
    const { email, codigo, nuevaClave } = req.body;

    // Validación básica
    if (!email || !codigo || !nuevaClave) {
        return res.status(400).json({ error: "Faltan datos requeridos (email, código, nueva clave)." });
    }
    
    try {
        // 2. Buscar usuario y verificar código y expiración
        const resultado = await db.query(
            "SELECT * FROM cuentas WHERE usuario = $1 AND codigo_recuperacion = $2", 
            [email, codigo]
        );

        const cuenta = resultado.rows[0];

        if (!cuenta) {
            return res.status(400).json({ error: "Código de recuperación o correo incorrecto." });
        }

        // 3. Verificar si el código ha expirado
        if (new Date() > new Date(cuenta.recuperacion_expira)) {
            // Limpiamos el código expirado
            await db.query("UPDATE cuentas SET codigo_recuperacion = NULL, recuperacion_expira = NULL WHERE usuario = $1", [email]);
            return res.status(400).json({ error: "El código de recuperación ha expirado." });
        }

        // 4. Hashear la nueva contraseña
        const nuevoHash = await bcrypt.hash(nuevaClave, saltRounds);

        // 5. Actualizar la base de datos con la nueva contraseña y limpiar los campos de recuperación
        await db.query(
            "UPDATE cuentas SET hash = $1, codigo_recuperacion = NULL, recuperacion_expira = NULL WHERE usuario = $2", 
            [nuevoHash, email]
        );

        res.json({ mensaje: "Contraseña restablecida con éxito. Ya puedes iniciar sesión." });
    } catch (error) {
        console.error("🔥 Error en /restablecer-clave:", error);
        res.status(500).json({ error: "Error en el servidor al restablecer la clave." });
    }
});


// =========================================================================
// RUTA: RECUPERAR CLAVE (Usando la API de SendGrid)
// =========================================================================
router.post('/recuperar-clave', async (req, res) => {
    const { usuario } = req.body;

    try {
        console.log(`Ejecutando consulta: SELECT * FROM cuentas WHERE usuario = $1 [ '${usuario}' ]`);
        
        // 1. Buscar el usuario en la base de datos
        // Usamos 'db' en lugar de 'pool' para consistencia con tu importación
        const result = await db.query('SELECT * FROM cuentas WHERE usuario = $1', [usuario]);

        if (result.rows.length === 0) {
            console.log(`❌ Usuario no encontrado: ${usuario}`);
            // Siempre devuelve 200/éxito para no dar pistas sobre la existencia de la cuenta
            return res.status(200).json({ 
                msg: 'Si la dirección de correo electrónico está registrada, se enviará un enlace de restablecimiento.',
                success: true
            });
        }

        const cuenta = result.rows[0];

        // 2. Generar el token de recuperación (válido por 1 hora)
        const resetToken = jwt.sign(
            { id: cuenta.id, usuario: cuenta.usuario },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 3. Crear el enlace de recuperación (URL de tu frontend)
        const frontendUrl = 'https://metasapp2025-production.up.railway.app';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        // 4. Configurar el correo con el cliente de la API de SendGrid
        const msg = {
            to: cuenta.usuario, // Correo del destinatario
            from: process.env.EMAIL_USER, // Correo del remitente (debe estar verificado en SendGrid)
            subject: 'Recuperación de Clave para MetasApp',
            text: `Has solicitado recuperar tu clave. Haz clic en el siguiente enlace: ${resetUrl}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333;">Recuperación de Clave</h2>
                    <p>Hola,</p>
                    <p>Recibimos una solicitud para restablecer la clave de tu cuenta.</p>
                    <p>Por favor, haz clic en el siguiente botón para continuar:</p>
                    <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Restablecer Clave
                    </a>
                    <p style="margin-top: 20px; font-size: 0.9em; color: #777;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                </div>
            `,
        };

        // 5. Enviar el correo usando la API de SendGrid (HTTPS)
        await sgMail.send(msg);

        console.log(`✅ Correo de recuperación enviado al usuario: ${cuenta.usuario}`);
        res.status(200).json({ 
            msg: 'Correo de recuperación enviado con éxito. Revisa tu bandeja de entrada.',
            success: true 
        });

    } catch (error) {
        // Aquí capturaremos errores 401/403 de SendGrid o errores de red.
        // Si ves un error aquí, **probablemente es un problema con la API Key (EMAIL_PASSWORD)**.
        console.error('🔥 Error en /recuperar-clave (SendGrid API):', error);
        
        // Manejo de errores específicos de SendGrid (si aplica)
        let errorMessage = 'Error al enviar el correo. Por favor, revisa tu API Key de SendGrid.';
        
        if (error.response && error.response.body) {
            console.error('Detalles del error de SendGrid:', error.response.body);
            errorMessage = `Error de SendGrid: ${error.response.body.errors[0].message || 'Error desconocido'}`;
        }

        res.status(500).json({ 
            msg: errorMessage,
            success: false 
        });
    }
});


// Endpoint para refrescar el token
router.post("/refresh-token", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(403).json({ error: "Refresh token requerido" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '10m' });
        res.json({ token: newToken });
    });
});

module.exports = router;
