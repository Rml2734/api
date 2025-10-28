
const sgMail = require('@sendgrid/mail'); // API de SendGrid
const express = require("express");
const router = express.Router();
const db = require("../db/configuracion"); // Conexión a Postgres (usamos 'db')
const jwt = require('jsonwebtoken'); 
const bcrypt = require("bcrypt"); 

// --- CONFIGURACIÓN DE SENDGRID API ---
// Usa process.env.EMAIL_PASSWORD, que DEBE contener tu API Key de SendGrid (SG.xxxx)
sgMail.setApiKey(process.env.EMAIL_PASSWORD);

const saltRounds = 12; // Número de rondas de hash para bcrypt

// =========================================================================
// RUTA: RESTABLECER CLAVE (Verifica código en DB)
// =========================================================================
router.post("/restablecer-clave", async (req, res) => {
    const { email, codigo, nuevaClave } = req.body;

    if (!email || !codigo || !nuevaClave) {
        return res.status(400).json({ error: "Faltan datos requeridos (email, código, nueva clave)." });
    }
    
    try {
        const resultado = await db.query(
            "SELECT * FROM cuentas WHERE usuario = $1 AND codigo_recuperacion = $2", 
            [email, codigo]
        );

        const cuenta = resultado.rows[0];

        if (!cuenta) {
            return res.status(400).json({ error: "Código de recuperación o correo incorrecto." });
        }

        if (new Date() > new Date(cuenta.recuperacion_expira)) {
            await db.query("UPDATE cuentas SET codigo_recuperacion = NULL, recuperacion_expira = NULL WHERE usuario = $1", [email]);
            return res.status(400).json({ error: "El código de recuperación ha expirado." });
        }

        const nuevoHash = await bcrypt.hash(nuevaClave, saltRounds);

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
        const result = await db.query('SELECT * FROM cuentas WHERE usuario = $1', [usuario]);

        if (result.rows.length === 0) {
            console.log(`❌ Usuario no encontrado: ${usuario}`);
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

        // 5. Enviar el correo usando la API de SendGrid (HTTPS, evita el firewall)
        await sgMail.send(msg);

        console.log(`✅ Correo de recuperación enviado al usuario: ${cuenta.usuario}`);
        res.status(200).json({ 
            msg: 'Correo de recuperación enviado con éxito. Revisa tu bandeja de entrada.',
            success: true 
        });

    } catch (error) {
        // Si ves un error aquí, es un error de la API Key o del remitente.
        console.error('🔥 Error en /recuperar-clave (SendGrid API):', error);
        
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
