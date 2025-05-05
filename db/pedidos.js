/*const db = require('./configuracion');

// Definir todas las funciones primero
function pedirTodas(tabla, cuenta_id, callback) {
  db.any(`SELECT * FROM ${tabla} WHERE cuenta_id = $1`, [cuenta_id])
    .then(resultado => {
      console.log("📌 Consulta ejecutada: SELECT * FROM", tabla, "WHERE cuenta_id =", cuenta_id);
      callback(null, resultado);
    })
    .catch(error => {
      console.error("❌ Error en pedirTodas:", error);
      callback(error);
    });
}



function pedir(tabla, id, callback) {
  db.any(`SELECT * FROM ${tabla} WHERE id = ${id}`)
    .then(resultado => {
      callback(null, resultado);
    })
    .catch(error => {
      callback(error);
    });
}

const pedirCuenta = (usuario, callback) => {
  console.log("pedirCuenta llamado para:", usuario);
  db.any('SELECT * FROM cuentas WHERE usuario = $1', usuario)
      .then(data => {
          console.log("pedirCuenta resultado:", data);
          callback(null, data);
      })
      .catch(err => {
          console.error("pedirCuenta error:", err);
          callback(err, null);
      });
};

// En la función crear (pedidos.js)
function crear(tabla, item, callback) {
  const keys = Object.keys(item);
  const propiedades = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  // 🔥 Usar parámetros seguros ($1, $2, ...)
  db.any(
    `INSERT INTO ${tabla} (${propiedades}) VALUES(${placeholders}) RETURNING *`,
    Object.values(item)
  )
    .then(([resultado]) => {
      callback(null, resultado);
    })
    .catch(error => {
      callback(error);
    });
}

function actualizar(tabla, id, item, callback) {
  const keys = Object.keys(item);
  const actualizaciones = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = Object.values(item);
  const sql = `UPDATE ${tabla} SET ${actualizaciones} WHERE id = $${keys.length + 1} returning *`;
  db.any(sql, [...values, id])
      .then(([resultado]) => {
          callback(null, resultado);
      })
      .catch(error => {
          callback(error);
      });
}

function borrar(tabla, id, callback) {
  db.any(`DELETE FROM ${tabla} WHERE id = $1`, [id]) // 🔥 Usar $1 para parámetros
    .then(() => callback(null))
    .catch(error => callback(error));
}

// Exportar todas las funciones al final
module.exports = {
  pedirTodas,
  pedir,
  pedirCuenta,
  crear,
  actualizar,
  borrar
};  */

// db/pedidos.js - Versión Final Funcional
const { pool } = require('./configuracion');

// ==============================================
// Funciones Principales de Acceso a la Base de Datos
// ==============================================

function pedirTodas(tabla, cuenta_id, callback) {
    const query = `SELECT * FROM ${tabla} WHERE cuenta_id = $1`;
    console.log("📋 Ejecutando consulta:", query);
    
    pool.query(query, [cuenta_id], (err, res) => {
        if (err) {
            console.error(`❌ Error en pedirTodas (${tabla}):`, err);
            return callback(err);
        }
        console.log(`✅ ${res.rows.length} registros encontrados en ${tabla}`);
        callback(null, res.rows);
    });
}

function pedir(tabla, id, callback) {
    const query = `SELECT * FROM ${tabla} WHERE id = $1`;
    console.log("🔍 Buscando registro con ID:", id);
    
    pool.query(query, [id], (err, res) => {
        if (err) {
            console.error(`❌ Error en pedir (${tabla}):`, err);
            return callback(err);
        }
        if (res.rows.length === 0) {
            console.log("⚠️ Registro no encontrado");
            return callback(null, null);
        }
        callback(null, res.rows[0]);
    });
}

const pedirCuenta = (usuario, callback) => {
    const query = 'SELECT * FROM cuentas WHERE usuario = $1';
    console.log("🔐 Buscando cuenta para:", usuario);
    
    pool.query(query, [usuario], (err, res) => {
        if (err) {
            console.error("💥 ERROR CRÍTICO en pedirCuenta:", err);
            return callback(err, null);
        }
        if (res.rows.length === 0) {
            console.log("⚠️ Cuenta no encontrada");
            return callback(null, null);
        }
        console.log("✅ Cuenta encontrada. ID:", res.rows[0].id);
        callback(null, res.rows);
    });
};

function crear(tabla, item, callback) {
    const keys = Object.keys(item);
    const propiedades = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tabla} (${propiedades}) VALUES(${placeholders}) RETURNING *`;

    console.log("🆕 Creando registro en", tabla);
    console.log("Datos:", item);

    pool.query(query, Object.values(item), (err, res) => {
        if (err) {
            console.error(`💥 Error al crear en ${tabla}:`, err);
            return callback(err);
        }
        console.log("🆗 Registro creado exitosamente");
        callback(null, res.rows[0]);
    });
}

function actualizar(tabla, id, item, callback) {
    const keys = Object.keys(item);
    const actualizaciones = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = Object.values(item);
    const query = `UPDATE ${tabla} SET ${actualizaciones} WHERE id = $${keys.length + 1} RETURNING *`;

    console.log("🔄 Actualizando registro en", tabla, "ID:", id);
    console.log("Cambios:", item);

    pool.query(query, [...values, id], (err, res) => {
        if (err) {
            console.error(`💥 Error al actualizar en ${tabla}:`, err);
            return callback(err);
        }
        if (res.rows.length === 0) {
            console.log("⚠️ Registro no encontrado para actualizar");
            return callback(null, null);
        }
        console.log("🆗 Registro actualizado");
        callback(null, res.rows[0]);
    });
}

function borrar(tabla, id, callback) {
    const query = `DELETE FROM ${tabla} WHERE id = $1`;
    console.log("🗑️ Eliminando registro de", tabla, "ID:", id);
    
    pool.query(query, [id], (err) => {
        if (err) {
            console.error(`💥 Error al borrar de ${tabla}:`, err);
            return callback(err);
        }
        console.log("🆗 Registro eliminado exitosamente");
        callback(null);
    });
}

// ==============================================
// Exportación de Funciones
// ==============================================
module.exports = {
    pedirTodas,
    pedir,
    pedirCuenta,
    crear,
    actualizar,
    borrar
};