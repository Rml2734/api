var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');

var router = express.Router();
const { pedirCuenta, crear } = require("../db/pedidos");
const { body, validationResult } = require("express-validator");

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


/* POST Login */
router.post(
  "/login",
  body("usuario").isEmail(),
  body("clave").isLength({ min: 5 }),
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

  
  function crearFicha(email) {
    return new Promise((resolve, reject) => {
      pedirCuenta(email, (err, [cuenta]) => {
        if (err) return reject(err);
        if (!cuenta) return reject(new Error("Cuenta no encontrada"));
  
        let ficha = jwt.sign(
          {
            exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hora
            usuario: email,
            id: cuenta.id, // Agregar el ID de la cuenta
          },
          "secreto"
        );
        resolve(ficha);
      });
    });
  }
  

module.exports = router;
