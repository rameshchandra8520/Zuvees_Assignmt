/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('order_riders', (table) => {
    table.integer('order_id').unsigned().notNullable();
    table.foreign('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.integer('rider_id').unsigned().notNullable();
    table.foreign('rider_id').references('id').inTable('riders').onDelete('CASCADE');
    table.primary(['order_id', 'rider_id']);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('order_riders');
};
