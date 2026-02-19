const { pool } = require('../config/database');

class SessionRequest {

  static async create(requestData) {
    const { student_id, tutor_id, subject_id, requested_date, requested_time, notes } = requestData;

    const [result] = await pool.query(
      `INSERT INTO session_requests 
       (student_id, tutor_id, subject_id, requested_date, requested_time, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, tutor_id, subject_id, requested_date, requested_time, notes]
    );

    return result.insertId;
  }

  /* ================= FIND BY ID ================= */

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              s.email AS student_email,
              CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              t.email AS tutor_email,
              CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
              sub.subject_name
       FROM session_requests sr
       JOIN users s ON sr.student_id = s.id
       JOIN users t ON sr.tutor_id = t.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.id = ?`,
      [id]
    );

    return rows[0];
  }

  /* ================= STUDENT VIEW ================= */

  static async findByStudentId(studentId) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              t.email AS tutor_email,
              CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
              sub.subject_name
       FROM session_requests sr
       JOIN users t ON sr.tutor_id = t.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.student_id = ?
       ORDER BY sr.created_at DESC`,
      [studentId]
    );

    return rows;
  }

  /* ================= TUTOR VIEW ================= */

  static async findByTutorId(tutorId) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              s.email AS student_email,
              CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              sub.subject_name
       FROM session_requests sr
       JOIN users s ON sr.student_id = s.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.tutor_id = ?
       ORDER BY sr.created_at DESC`,
      [tutorId]
    );

    return rows;
  }

  /* ================= PENDING ONLY ================= */

  static async getPendingByTutorId(tutorId) {
    const [rows] = await pool.query(
      `SELECT sr.*,
              s.email AS student_email,
              CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              s.phone AS student_phone,
              sub.subject_name
       FROM session_requests sr
       JOIN users s ON sr.student_id = s.id
       LEFT JOIN subjects sub ON sr.subject_id = sub.id
       WHERE sr.tutor_id = ? 
         AND sr.status = 'pending'
       ORDER BY sr.created_at DESC`,
      [tutorId]
    );

    return rows;
  }

  /* ================= UPDATE STATUS ================= */

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
