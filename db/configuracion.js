//CONFIGURACION PARA PRODUCCCION

const pgp = require('pg-promise')();

console.log("Configurando conexión a la base de datos...");

const cn = process.env.DATABASE_URL; // Usar DATABASE_URL proporcionada por Railway

const db = pgp(cn);

module.exports = db;


//CONFIGURACION PARA DESARROLLO

 /*require('dotenv').config();

const initOptions = {};
const pgp = require('pg-promise')(initOptions);

const cn = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    port: 5432,
    database: 'metasapp'
};

const db = pgp(cn);

module.exports = db;  */