/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable();
    table.foreign('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.integer('product_id').unsigned().notNullable();
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.integer('variant_id').unsigned();
    table.foreign('variant_id').references('id').inTable('product_variants').onDelete('SET NULL');
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('order_items');
};
