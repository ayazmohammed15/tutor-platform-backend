const { pool } = require('../config/database');

class AvailabilitySlot {

  // Delete all weekly slots
  static async deleteAllByTutor(tutorId) {
    await pool.query(
      'DELETE FROM availability_slots WHERE tutor_id = ?',
      [tutorId]
    );
  }

  // Save weekly block
  static async create(slotData) {
    const { tutor_id, day_of_week, start_time, end_time, slot_duration } = slotData;

    const [result] = await pool.query(
      `INSERT INTO availability_slots 
       (tutor_id, day_of_week, start_time, end_time, slot_duration) 
       VALUES (?, ?, ?, ?, ?)`,
      [tutor_id, day_of_week, start_time, end_time, slot_duration]
    );

    return result.insertId;
  }

  static async findByTutorId(tutorId) {
    const [rows] = await pool.query(
      `SELECT * FROM availability_slots 
       WHERE tutor_id = ? 
       ORDER BY FIELD(day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), start_time`,
      [tutorId]
    );
    return rows;
  }

  // ===== MONTH RANGE =====

  static async saveRange(tutorId, startDate, endDate) {
    await pool.query(
      'DELETE FROM tutor_availability_range WHERE tutor_id = ?',
      [tutorId]
    );

    await pool.query(
      'INSERT INTO tutor_availability_range (tutor_id, start_date, end_date) VALUES (?, ?, ?)',
      [tutorId, startDate, endDate]
    );
  }

  static async getRange(tutorId) {
    const [rows] = await pool.query(
      'SELECT * FROM tutor_availability_range WHERE tutor_id = ?',
      [tutorId]
    );
    return rows[0];
  }

  // ===== EXCLUDED DATES =====

  static async deleteExcludedByTutor(tutorId) {
    await pool.query(
      'DELETE FROM tutor_unavailable_dates WHERE tutor_id = ?',
      [tutorId]
    );
  }

  static async addExcludedDate(tutorId, date) {
    await pool.query(
      'INSERT INTO tutor_unavailable_dates (tutor_id, date) VALUES (?, ?)',
      [tutorId, date]
    );
  }

  static async getExcludedDates(tutorId) {
    const [rows] = await pool.query(
      'SELECT date FROM tutor_unavailable_dates WHERE tutor_id = ?',
      [tutorId]
    );
    return rows;
  }
}

module.exports = AvailabilitySlot;
