var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();
const { body, validationResult } = require("express-validator");
const { pedirCuenta } = require("../db/pedidos"); // Importar solo pedirCuenta

/* POST Login (SIMPLIFICADO) */
router.post(
    "/login",
    body("usuario").isEmail(),
    body("clave").isLength({ min: 5 }),
    async function (req, res, next) {
        console.log("Entrando a /api/login");
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const login = req.body;
            console.log(`Intentando login para usuario: ${login.usuario}`);

            pedirCuenta(login.usuario, async (err, cuentaArray) => {
                if (err) {
                    console.error("Error en pedirCuenta:", err);
                    return next(err);
                }

                const cuenta = cuentaArray && cuentaArray.length > 0 ? cuentaArray[0] : null;

                if (!cuenta) {
                    console.log(`Cuenta no encontrada para ${login.usuario}`);
                    return res.status(404).send({ error: "Usuario no encontrado" });
                }

                try {
                    const result = await bcrypt.compare(login.clave, cuenta.hash);
                    if (!result) {
                        console.log(`Clave incorrecta para ${login.usuario}`);
                        return res.status(401).send({ error: "Credenciales inválidas" });
                    }
                    console.log(`Clave correcta para ${login.usuario}`);
                    res.send({ mensaje: "Login exitoso" }); // Enviar una respuesta simple
                } catch (bcryptError) {
                    console.error("Error en bcrypt.compare:", bcryptError);
                    return next(bcryptError);
                }
            });
        } catch (error) {
            console.error("Error inesperado en /api/login:", error);
            next(error);
        }
    }
);

module.exports = router;