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