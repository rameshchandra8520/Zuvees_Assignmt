const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);

async function main() {
  try {
    // Check which tables exist
    console.log('Checking database tables...');
    
    const tables = await knex.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables:', tables.rows.map(row => row.table_name).join(', '));
    
    // Check products table columns
    if (tables.rows.some(row => row.table_name === 'products')) {
      console.log('\nProducts table columns:');
      const columns = await knex.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'products'
        ORDER BY ordinal_position;
      `);
      
      for (const col of columns.rows) {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      }
    }
    
    // Check product_variants table columns
    if (tables.rows.some(row => row.table_name === 'product_variants')) {
      console.log('\nProduct_variants table columns:');
      const columns = await knex.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'product_variants'
        ORDER BY ordinal_position;
      `);
      
      for (const col of columns.rows) {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

main(); 