/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('product_variants', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('color');
    table.string('size');
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock').defaultTo(0);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('product_variants');
};
