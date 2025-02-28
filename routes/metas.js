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

/* PUT Actualizar meta */
router.put('/:id',
  body('detalles').isLength({ min: 5 }),
  body('periodo').not().isEmpty(),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
     //const meta = req.body;
     //const id = req.params.id;
     //if (meta.id !== id) {
       //return res.sendStatus(409);
     //}
     //const indice = metas.findIndex(item => item.id === id);
     //if (indice === -1) {
       //return res.sendStatus(404);
     //}
     //metas[indice] = meta;
     //res.send(meta);
    const body = req.body;
    const id = req.params.id;
    if (body.id !== +id) {
      return res.sendStatus(409);
    }
    pedir('metas', id, (err, meta) => {
      if (err) { 
      return next(err);
      }
      if (!meta.length) {
        return res.sendStatus(404);
      }
      actualizar('metas', id, body, (err, actualizada) => {
        if (err) {
          return next(err);
        }
        res.send(actualizada);
      });
    });
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


