const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function initDatabase() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../sql/schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../../sql/seed.sql'), 'utf8');
    console.log('Running schema.sql...');
    await pool.query(schemaSql);
    console.log('Running seed.sql...');
    await pool.query(seedSql);
    console.log('Database initialized and seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
}

initDatabase();
