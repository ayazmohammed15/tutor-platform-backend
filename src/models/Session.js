const { pool } = require('../config/database');

class Session {

  static async create(sessionData) {
    const {
      session_request_id,
      student_id,
      tutor_id,
      subject_id,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      notes
    } = sessionData;

    const [result] = await pool.query(
      `INSERT INTO sessions 
       (session_request_id, student_id, tutor_id, subject_id, scheduled_date, scheduled_time, duration_minutes, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [session_request_id, student_id, tutor_id, subject_id, scheduled_date, scheduled_time, duration_minutes, notes]
    );

    return result.insertId;
  }

  /* ================= FIND BY ID ================= */

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT s.*,
              st.email AS student_email,
              CONCAT(st.first_name, ' ', st.last_name) AS student_name,
              st.phone AS student_phone,
              t.email AS tutor_email,
              CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
              t.phone AS tutor_phone,
              sub.subject_name
       FROM sessions s
       JOIN users st ON s.student_id = st.id
       JOIN users t ON s.tutor_id = t.id
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.id = ?`,
      [id]
    );

    return rows[0];
  }

  /* ================= STUDENT VIEW ================= */

  static async findByStudentId(studentId) {
    const [rows] = await pool.query(
      `SELECT s.*,
              t.email AS tutor_email,
              CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
              sub.subject_name
       FROM sessions s
       JOIN users t ON s.tutor_id = t.id
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.student_id = ?
       ORDER BY s.scheduled_date DESC, s.scheduled_time DESC`,
      [studentId]
    );

    return rows;
  }

  /* ================= TUTOR VIEW ================= */

  static async findByTutorId(tutorId) {
    const [rows] = await pool.query(
      `SELECT s.*,
              st.email AS student_email,
              CONCAT(st.first_name, ' ', st.last_name) AS student_name,
              sub.subject_name
       FROM sessions s
       JOIN users st ON s.student_id = st.id
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.tutor_id = ?
       ORDER BY s.scheduled_date DESC, s.scheduled_time DESC`,
      [tutorId]
    );

    return rows;
  }

  /* ================= UPDATE ================= */

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
      `UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateStatus(id, status) {
    const [result] = await pool.query(
      `UPDATE sessions SET status = ? WHERE id = ?`,
      [status, id]
    );

    return result.affectedRows > 0;
  }

  static async addZoomDetails(id, zoomData) {
    const { zoom_meeting_link, zoom_meeting_id, zoom_password } = zoomData;

    const [result] = await pool.query(
      `UPDATE sessions 
       SET zoom_meeting_link = ?, zoom_meeting_id = ?, zoom_password = ?
       WHERE id = ?`,
      [zoom_meeting_link, zoom_meeting_id, zoom_password, id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = Session;
