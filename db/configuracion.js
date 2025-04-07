require('dotenv').config();

const initOptions = {};
const pgp = require('pg-promise')(initOptions);

console.log("Configurando conexión a la base de datos...");
console.log("PGHOST:", process.env.PGHOST);
console.log("PGPORT:", process.env.PGPORT);
console.log("POSTGRES_USER:", process.env.POSTGRES_USER);
console.log("POSTGRES_PASSWORD:", process.env.POSTGRES_PASSWORD);
console.log("POSTGRES_DB:", process.env.POSTGRES_DB);

const cn = {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: {
        rejectUnauthorized: false // Importante para Railway
    }
};

const db = pgp(cn);

module.exports = db;


//la configuracion funciona en desarrollo
/* require('dotenv').config();

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