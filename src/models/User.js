const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {

  static async create(userData) {

    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      role
    } = userData;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `
      INSERT INTO users
      (
        first_name,
        last_name,
        email,
        phone,
        password,
        role
      )
      VALUES (?, ?,?, ?, ?, ?)
      `,
      [
        first_name,
        last_name,
        email,
        phone,
        hashedPassword,
        role
      ]
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
      `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.role,
      u.is_verified,
      u.is_active,
      u.created_at,
      u.updated_at,
      sp.course_id,
      sp.class_id,
      sp.student_category
    FROM users u
    LEFT JOIN student_profiles sp
      ON u.id = sp.user_id
    WHERE u.id = ?
    `,
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
      `SELECT id, first_name, last_name, email, phone, role, is_verified, is_active, created_at 
       FROM users WHERE role = ?`,
      [role]
    );
    return rows;
  }
}

module.exports = User;
