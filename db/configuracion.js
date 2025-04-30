//CONFIGURACION PARA PRODUCCCION

//const pgp = require('pg-promise')();

//console.log("Configurando conexión a la base de datos...");

//const cn = process.env.DATABASE_URL;

//console.log("URL de conexión:", cn); // Imprimir la URL de conexión

//const db = pgp(cn);

//module.exports = db;  


//CONFIGURACION PARA DESARROLLO

//require('dotenv').config();

//const initOptions = {};
//const pgp = require('pg-promise')(initOptions);

//const cn = {
  //  user: process.env.DB_USER,
  //  password: process.env.DB_PASSWORD,
  //  host: 'localhost',
  //  port: 5432,
  //  database: 'metasapp'
//};

//const db = pgp(cn);

//module.exports = db;  


//Aquí te muestro cómo puedes refactorizar tu archivo configuracion.js para que maneje tanto el entorno de desarrollo como el de producción de manera más limpia y eficiente:require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const initOptions = {};
const pgp = require('pg-promise')(initOptions);

let cn;

if (process.env.NODE_ENV === 'production') {
  // Configuración para producción (Railway, Heroku, etc.)
  cn = {
    connectionString: process.env.DATABASE_URL, // Usa la variable de entorno DATABASE_URL
    ssl: {
      rejectUnauthorized: false // Importante para Railway y otros proveedores en la nube
    }
  };
  console.log("Configurando conexión a la base de datos en PRODUCCIÓN con DATABASE_URL:", process.env.DATABASE_URL);
} else {
  // Configuración para desarrollo (local)
  cn = {
    user: process.env.DB_USER || 'tu_usuario_por_defecto', //Proporciona un valor por defecto
    password: process.env.DB_PASSWORD || 'tu_contraseña_por_defecto', //Proporciona un valor por defecto
    host: process.env.DB_HOST || 'localhost',        // Valor por defecto
    port: process.env.DB_PORT || 5432,            // Valor por defecto
    database: process.env.DB_NAME || 'metasapp'     // Valor por defecto
  };
  console.log("Configurando conexión a la base de datos en DESARROLLO:", cn);
}

const db = pgp(cn);
module.exports = db;
