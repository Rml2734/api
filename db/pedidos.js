const db = require('./configuracion');

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

function pedirCuenta(usuario, callback) {
  // 🔥 Usar parámetros seguros ($1) para evitar SQL injection y errores
  db.any("SELECT * FROM cuentas WHERE usuario = $1", [usuario])
    .then(resultado => callback(null, resultado))
    .catch(error => callback(error));
}

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
};