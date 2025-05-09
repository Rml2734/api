/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
      .createTable('cuentas', (table) => {
        table.increments('id').primary();
        table.string('usuario').notNullable().unique();
        table.string('hash').notNullable();
        table.string('correo').notNullable().unique(); // 🔥 Campo obligatorio
      })
      .createTable('metas', (table) => {
        table.increments('id').primary();
        table.text('detalles').notNullable();
        table.date('plazo').notNullable(); // Añadido
        table.string('periodo').notNullable(); // Añadido
        table.integer('eventos').notNullable(); // Añadido
        table.string('icono').notNullable(); // Añadido
        table.integer('meta').notNullable(); // Añadido
        table.integer('completado').notNullable(); // Añadido
        table.integer('cuenta_id').references('id').inTable('cuentas');
      });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema
      .dropTable('metas')
      .dropTable('cuentas');
  };