const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, first_name, last_name, phone, role } = userData;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users 
      (first_name, last_name, email, password, phone, role) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, hashedPassword, phone, role]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, 
              is_verified, is_active, created_at 
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async verifyPassword(plainPassword, storedPassword) {
    return await bcrypt.compare(plainPassword, storedPassword);
  }

  static async getAllByRole(role) {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, 
              is_verified, is_active, created_at 
       FROM users WHERE role = ?`,
      [role]
    );
    return rows;
  }
}

module.exports = User;
