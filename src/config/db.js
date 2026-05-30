const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'github_analyzer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
    return true;
  } catch (err) {
    console.warn('⚠️ Warning: MySQL connection failed on startup:', err.message);
    console.warn('👉 Make sure MySQL is running and your credentials in .env are correct.');
    return false;
  }
}

module.exports = { pool, testConnection };
