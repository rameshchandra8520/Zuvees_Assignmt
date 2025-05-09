/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('product_variants', (table) => {
    // Add columns if they don't exist
    // We'll handle errors separately if columns already exist
    table.string('color');
    table.string('size');
  }).catch(error => {
    // Ignore errors about columns already existing
    if (error.message.includes('already exists')) {
      console.log('Columns already exist, continuing...');
      return Promise.resolve();
    }
    return Promise.reject(error);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('product_variants', (table) => {
    table.dropColumn('color');
    table.dropColumn('size');
  }).catch(error => {
    // Ignore errors about columns not existing
    if (error.message.includes('does not exist')) {
      console.log('Columns do not exist, continuing...');
      return Promise.resolve();
    }
    return Promise.reject(error);
  });
};
