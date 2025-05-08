/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
      .createTable('cuentas', (table) => {
        table.increments('id').primary();
        table.string('usuario').notNullable().unique();
        table.string('clave').notNullable();
        table.string('correo').notNullable().unique();
      })
      .createTable('metas', (table) => {
        table.increments('id').primary();
        table.text('detalles').notNullable();
        table.date('plazo').notNullable();
        table.string('periodo').notNullable();
        table.integer('eventos').notNullable();
        table.string('icono').notNullable();
        table.integer('meta').notNullable();
        table.integer('completado').notNullable();
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