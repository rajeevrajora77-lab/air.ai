const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const MIGRATIONS_DIR = path.join(__dirname, '../src/database/migrations');

async function rollbackMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting migration rollback...\n');

    // Get down migrations
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('_down.sql'))
      .sort()
      .reverse(); // Rollback in reverse order

    if (files.length === 0) {
      console.log('ℹ️  No down migrations found');
      return;
    }

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`⏪ Rolling back: ${file}`);
      await client.query(sql);
      console.log(`✅ Rolled back: ${file}\n`);
    }

    console.log('✅ All migrations rolled back successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration rollback failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

rollbackMigrations();