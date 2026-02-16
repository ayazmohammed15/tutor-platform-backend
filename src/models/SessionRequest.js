const { pool } = require('../config/database');

class SessionRequest {
  static async create(requestData) {
    const { student_id, tutor_id, subject_id, requested_date, requested_time, notes } = requestData;

    const [result] = await pool.query(
      'INSERT INTO session_requests (student_id, tutor_id, subject_id, requested_date, requested_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, tutor_id, subject_id, requested_date, requested_time, notes]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              s.email as student_email, s.full_name as student_name,
              t.email as tutor_email, t.full_name as tutor_name,
              sub.class_name, sub.chapter_name, sub.topic_name
       FROM session_requests sr
       JOIN users s ON sr.student_id = s.id
       JOIN users t ON sr.tutor_id = t.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByStudentId(studentId) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              t.email as tutor_email, t.full_name as tutor_name,
              sub.class_name, sub.chapter_name, sub.topic_name
       FROM session_requests sr
       JOIN users t ON sr.tutor_id = t.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.student_id = ?
       ORDER BY sr.created_at DESC`,
      [studentId]
    );
    return rows;
  }

  static async findByTutorId(tutorId) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              s.email as student_email, s.full_name as student_name,
              sub.class_name, sub.chapter_name, sub.topic_name
       FROM session_requests sr
       JOIN users s ON sr.student_id = s.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.tutor_id = ?
       ORDER BY sr.created_at DESC`,
      [tutorId]
    );
    return rows;
  }

  static async getPendingByTutorId(tutorId) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              s.email as student_email, s.full_name as student_name, s.phone as student_phone,
              sub.class_name, sub.chapter_name, sub.topic_name
       FROM session_requests sr
       JOIN users s ON sr.student_id = s.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.tutor_id = ? AND sr.status = 'pending'
       ORDER BY sr.created_at DESC`,
      [tutorId]
    );
    return rows;
  }

  static async updateStatus(id, status, additionalData = {}) {
    const updates = { status, ...additionalData };
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    values.push(id);
    const [result] = await pool.query(
      `UPDATE session_requests SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }
}

module.exports = SessionRequest;
