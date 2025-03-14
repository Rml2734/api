var express = require('express');
var router = express.Router();
const { pedirTodas, pedir, crear, actualizar, borrar } = require('../db/pedidos');
 const { body, validationResult } = require('express-validator');

// let metas = [
//   {
//     "id": "1",
//     "detalles": "Correr por 30 minutos",
//     "plazo": "día",
//     "frecuencia": 1,
//     "icono": "🏃‍♂️",
//     "meta": 365,
//     "fecha_límite": "2030-01-01",
//     "completado": 5
//   },
//   {
//     "id": "2",
//     "detalles": "Leer libros",
//     "plazo": "año",
//     "frecuencia": 6,
//     "icono": "📚",
//     "meta": 12,
//     "fecha_límite": "2030-01-01",
//     "completado": 0
//   },
//   {
//     "id": "3",
//     "detalles": "Viajar a nuevos lugares",
//     "plazo": "mes",
//     "frecuencia": 1,
//     "icono": "✈️",
//     "meta": 60,
//     "fecha_límite": "2030-01-01",
//     "completado": 40
//   }
// ];

/* GET Lista de metas */
router.get('/', function (req, res, next) {
  // res.send(metas);
  pedirTodas('metas', req.auth.id, (err, metas) => {
    if (err) {
      return next(err);
    }
    //console.log(metas)
    res.send(metas);
  });
});

/* GET Meta con id */
router.get('/:id', function (req, res, next) {
   //const id = req.params.id;
   //const meta = metas.find(item => item.id === id);
   //if (!meta) {
     //return res.sendStatus(404);
   //}
   //res.send(meta);
  const id = req.params.id;
  pedir('metas', id, (err, meta) => {
    if (err) {
      return next(err);
    }
    if (!meta.length) {
      return res.sendStatus(404);
    }
    res.send(meta);
  });
});

/* POST Crear meta */
router.post('/', 
  body('detalles').isLength({ min: 5 }),
  body('periodo').not().isEmpty(),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
     //const meta = req.body;
     //metas.push(meta);
     //res.status(201);
     //res.send(meta);
    const nuevaMeta = req.body;
    crear('metas', nuevaMeta, (err, meta) => {
      if (err) {
        return next(err);
      }
      res.send(meta);
    });
  });

  router.put("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      let { detalles, periodo, eventos, icono, meta, plazo, completado, cuenta_id } = req.body;
  
      // 🔥 Convertir `cuenta_id` a null si es un string "null" o undefined
      if (!cuenta_id || cuenta_id === "null") {
        cuenta_id = null;
      } else {
        cuenta_id = parseInt(cuenta_id, 10);
        if (isNaN(cuenta_id)) cuenta_id = null;
      }
  
      // 🔥 Convertir valores numéricos correctamente
      eventos = parseInt(eventos, 10) || null;
      meta = parseInt(meta, 10) || null;
      completado = parseInt(completado, 10) || null;
  
      // 🔥 Validar formato de fecha
      if (plazo) {
        const fechaValida = new Date(plazo);
        if (isNaN(fechaValida.getTime())) {
          return res.status(400).json({ error: "Formato de fecha inválido en 'plazo'" });
        }
        plazo = fechaValida.toISOString().split("T")[0];
      }
  
      // 🔥 Verificar si el ID existe
      const resultado = await pool.query("SELECT * FROM metas WHERE id = $1", [id]);
      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: "Meta no encontrada" });
      }
  
      // 🔥 Ejecutar la actualización correctamente
      const query = `
        UPDATE metas 
        SET detalles = $1, periodo = $2, eventos = $3, icono = $4, meta = $5, plazo = $6, completado = $7, cuenta_id = $8
        WHERE id = $9
        RETURNING *;
      `;
  
      const values = [detalles, periodo, eventos, icono, meta, plazo, completado, cuenta_id, id];
  
      const updateResult = await pool.query(query, values);
      res.json(updateResult.rows[0]);
  
    } catch (error) {
      console.error("🔥 Error al actualizar meta:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  

/* DELETE Borrar meta */
router.delete('/:id', function (req, res, next) {
   //const id = req.params.id;
   //const indice = metas.findIndex(item => item.id === id);
   //if (indice === -1) {
     //return res.sendStatus(404);
   //}
   //metas.splice(indice, 1);
   //res.sendStatus(204);
  const id = req.params.id;
  pedir('metas', id, (err, meta) => {
    if (err) {
      return next(err);
    }
    if (!meta.length) {
      return res.sendStatus(404);
    }
    borrar('metas', id, (err) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(204);
    });
  });
});

module.exports = router;


