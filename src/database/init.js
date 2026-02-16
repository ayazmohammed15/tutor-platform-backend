const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, 'migrations', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    return false;
  }
};

module.exports = { initializeDatabase };
