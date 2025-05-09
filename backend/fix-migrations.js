// Script to fix migration records
const knex = require('./knexfile');
const db = require('knex')(knex.development);

async function fixMigrations() {
  try {
    // First check if knex_migrations table exists
    const hasKnexMigrationsTable = await db.schema.hasTable('knex_migrations');
    
    if (!hasKnexMigrationsTable) {
      console.log('Creating knex_migrations table...');
      await db.schema.createTable('knex_migrations', (table) => {
        table.increments('id').primary();
        table.string('name');
        table.integer('batch');
        table.timestamp('migration_time').defaultTo(db.fn.now());
      });
    }
    
    // Skip the add_image migrations since we'll run those normally
    const completedMigrations = [
      '20250508094920_01_create_users_table.js',
      '20250508094927_02_create_products_table.js',
      '20250508094932_03_create_product_variants_table.js',
      '20250508094937_04_create_orders_table.js',
      '20250508094941_05_create_order_items_table.js',
      '20250508094946_06_create_riders_table.js',
      '20250508094951_07_create_order_riders_table.js',
      '20250508094999_08_add_price_to_order_items.js'
    ];
    
    // Insert records for completed migrations
    console.log('Adding migration records...');
    await Promise.all(completedMigrations.map(async (migration) => {
      const exists = await db('knex_migrations')
        .where('name', migration)
        .first();
        
      if (!exists) {
        await db('knex_migrations').insert({
          name: migration,
          batch: 1,
          migration_time: new Date()
        });
        console.log(`Added record for ${migration}`);
      } else {
        console.log(`Migration ${migration} already recorded`);
      }
    }));
    
    console.log('Migration records have been fixed!');
    console.log('Now run: npx knex migrate:latest');
    
    process.exit(0);
  } catch (err) {
    console.error('Error fixing migrations:', err);
    process.exit(1);
  }
}

fixMigrations(); 