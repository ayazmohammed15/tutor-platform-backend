const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {

  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      role,
      course, // This comes in as the slug (e.g., 'iit-jee')
      class_id,
    } = userData;

    // 1. Find the real numeric ID for the course slug
    let realCourseId = null;
    if (course) {
      const [courseRows] = await pool.query(
        `SELECT id FROM courses WHERE slug = ?`,
        [course]
      );
      if (courseRows.length > 0) {
        realCourseId = courseRows[0].id;
      }
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert into the users table using the real numeric ID
    const [result] = await pool.query(
      `INSERT INTO users 
      (first_name, last_name, email, password, phone, role, course_id, class_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        phone,
        role,
        realCourseId || null, // Use the fetched integer ID here
        class_id || null
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
      u.course_id,
      u.class_id,
      GROUP_CONCAT(ss.subject_id) AS subjects
    FROM users u
    LEFT JOIN student_subjects ss 
      ON ss.student_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
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