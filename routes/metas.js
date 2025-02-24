var express = require('express');
var router = express.Router();


/* GET Lista de metas */
router.get('/', function (req, res, next) {
  res.send('responder con metas');
});

module.exports = router;


