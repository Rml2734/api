var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { expressjwt: jwt } = require('express-jwt');
const cors = require('cors');

var indexRouter = require('./routes/index');
var metasRouter = require('./routes/metas');
var cuentasRouter = require('./routes/cuentas');
var authRouter = require('./routes/auth'); // 🔥 Importamos auth.js

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticación JWT, excluyendo rutas públicas
app.use(jwt({ secret: 'secreto', algorithms: ['HS256'] }).unless({
  path: ['/api/signup', '/api/login', '/api/recuperar-clave' ]})); // 🔥 Permitimos la recuperación de clave sin autenticación

app.use('/', indexRouter);
app.use('/api/metas', metasRouter);
app.use('/api', cuentasRouter);
app.use('/api', authRouter); // 🔥 Agregamos la ruta de autenticación
app.use(cors({
  origin: 'http://localhost:5173', // Debe coincidir con el puerto de tu frontend
  credentials: true
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  //console.error("🔥 Error en el backend:", err); // Agrega este log para ver el error real
  res.locals.message = err.message;
  //console.log(err);
  res.locals.error = req.app.get('env') === 'development' ? err : {};


   console.error("🔥 Error en el backend:", err); // Log de errores en consola

  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.send('error');
});

module.exports = app;
