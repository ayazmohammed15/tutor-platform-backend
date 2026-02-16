const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
  console.log('🚀 Starting database setup...\n');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    const schemaPath = path.join(__dirname, 'src', 'database', 'migrations', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing schema...');
    await connection.query(schema);
    console.log('✅ Database schema created successfully');

    const seedPath = path.join(__dirname, 'src', 'database', 'migrations', 'seed_subjects.sql');
    if (fs.existsSync(seedPath)) {
      const seedData = fs.readFileSync(seedPath, 'utf8');
      console.log('📝 Seeding subjects data...');
      await connection.query(seedData);
      console.log('✅ Sample subjects data inserted successfully');
    }

    await connection.end();

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n📋 Default admin account:');
    console.log('   Email: admin@tutorplatform.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Please change the admin password after first login!\n');

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. MySQL server is running');
    console.error('2. Database credentials in .env are correct');
    console.error('3. MySQL user has permission to create databases\n');
    process.exit(1);
  }
};

setupDatabase();
