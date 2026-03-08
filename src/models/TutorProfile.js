// const { pool } = require('../config/database');

// class TutorProfile {
//   static async create(profileData) {
//     const { user_id, bio, education, experience_years, hourly_rate, subjects } = profileData;

//     const [result] = await pool.query(
//       'INSERT INTO tutor_profiles (user_id, bio, education, experience_years, hourly_rate, subjects) VALUES (?, ?, ?, ?, ?, ?)',
//       [user_id, bio, education, experience_years, hourly_rate, subjects]
//     );

//     return result.insertId;
//   }

//   static async findByUserId(userId) {
//     const [rows] = await pool.query(
//       `SELECT tp.*, u.email, u.full_name, u.phone
//        FROM tutor_profiles tp
//        JOIN users u ON tp.user_id = u.id
//        WHERE tp.user_id = ?`,
//       [userId]
//     );
//     return rows[0];
//   }

//   static async findById(id) {
//     const [rows] = await pool.query(
//       `SELECT tp.*, u.email, u.full_name, u.phone
//        FROM tutor_profiles tp
//        JOIN users u ON tp.user_id = u.id
//        WHERE tp.id = ?`,
//       [id]
//     );
//     return rows[0];
//   }

//   static async update(userId, updates) {
//     const fields = [];
//     const values = [];

//     for (const [key, value] of Object.entries(updates)) {
//       if (value !== undefined) {
//         fields.push(`${key} = ?`);
//         values.push(value);
//       }
//     }

//     if (fields.length === 0) return false;

//     values.push(userId);
//     const [result] = await pool.query(
//       `UPDATE tutor_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
//       values
//     );

//     return result.affectedRows > 0;
//   }

//   static async getAllPending() {
//     const [rows] = await pool.query(
//       `SELECT tp.*, u.email, u.full_name, u.phone
//        FROM tutor_profiles tp
//        JOIN users u ON tp.user_id = u.id
//        WHERE tp.approval_status = 'pending'
//        ORDER BY tp.created_at DESC`
//     );
//     return rows;
//   }

//   static async getAllApproved() {
//     const [rows] = await pool.query(
//       `SELECT tp.*, u.email, u.full_name, u.phone
//        FROM tutor_profiles tp
//        JOIN users u ON tp.user_id = u.id
//        WHERE tp.approval_status = 'approved' AND tp.is_approved = TRUE
//        ORDER BY tp.created_at DESC`
//     );
//     return rows;
//   }

//   static async approve(tutorId, adminId) {
//     const [result] = await pool.query(
//       `UPDATE tutor_profiles
//        SET approval_status = 'approved', is_approved = TRUE, approved_by = ?, approved_at = NOW()
//        WHERE user_id = ?`,
//       [adminId, tutorId]
//     );

//     return result.affectedRows > 0;
//   }

//   static async reject(tutorId, adminId) {
//     const [result] = await pool.query(
//       `UPDATE tutor_profiles
//        SET approval_status = 'rejected', is_approved = FALSE, approved_by = ?, approved_at = NOW()
//        WHERE user_id = ?`,
//       [adminId, tutorId]
//     );

//     return result.affectedRows > 0;
//   }

//   static async searchTutors(filters) {
//     let query = `
//       SELECT DISTINCT tp.*, u.email, u.full_name, u.phone
//       FROM tutor_profiles tp
//       JOIN users u ON tp.user_id = u.id
//       WHERE tp.is_approved = TRUE AND tp.approval_status = 'approved'
//     `;

//     const values = [];

//     if (filters.class_name || filters.chapter_name || filters.topic_name) {
//       query += ` AND tp.user_id IN (
//         SELECT DISTINCT ts.tutor_id
//         FROM tutor_subjects ts
//         JOIN subjects s ON ts.subject_id = s.id
//         WHERE 1=1
//       `;

//       if (filters.class_name) {
//         query += ' AND s.class_name = ?';
//         values.push(filters.class_name);
//       }

//       if (filters.chapter_name) {
//         query += ' AND s.chapter_name = ?';
//         values.push(filters.chapter_name);
//       }

//       if (filters.topic_name) {
//         query += ' AND s.topic_name = ?';
//         values.push(filters.topic_name);
//       }

//       query += ')';
//     }

//     query += ' ORDER BY tp.created_at DESC';

//     const [rows] = await pool.query(query, values);
//     return rows;
//   }
// }

// module.exports = TutorProfile;



const { pool } = require('../config/database');

class TutorProfile {
  static async create(profileData) {
    const { user_id, bio, education, experience_years, hourly_rate, subjects } = profileData;

    const [result] = await pool.query(
      'INSERT INTO tutor_profiles (user_id, bio, education, experience_years, hourly_rate, subjects) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, bio, education, experience_years, hourly_rate, subjects]
    );

    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT tp.*, 
              u.email, 
              u.first_name, 
              u.last_name, 
              u.phone
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT tp.*, 
              u.email, 
              u.first_name, 
              u.last_name, 
              u.phone
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getAllPending() {
    const [rows] = await pool.query(
      `SELECT tp.*, 
              u.email, 
              u.first_name, 
              u.last_name, 
              u.phone
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.approval_status = 'pending'
       ORDER BY tp.created_at DESC`
    );
    return rows;
  }

  static async getAllApproved() {
    const [rows] = await pool.query(
      `SELECT tp.*, 
              u.email, 
              u.first_name, 
              u.last_name, 
              u.phone
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.approval_status = 'approved' 
       AND tp.is_approved = TRUE
       ORDER BY tp.created_at DESC`
    );
    return rows;
  }

  static async update(userId, updates) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(userId);

    const [result] = await pool.query(
      `UPDATE tutor_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async approve(tutorId, adminId) {
    const [result] = await pool.query(
      `UPDATE tutor_profiles
       SET approval_status = 'approved', 
           is_approved = TRUE, 
           approved_by = ?, 
           approved_at = NOW()
       WHERE user_id = ?`,
      [adminId, tutorId]
    );

    return result.affectedRows > 0;
  }

  static async reject(tutorId, adminId) {
    const [result] = await pool.query(
      `UPDATE tutor_profiles
       SET approval_status = 'rejected', 
           is_approved = FALSE, 
           approved_by = ?, 
           approved_at = NOW()
       WHERE user_id = ?`,
      [adminId, tutorId]
    );

    return result.affectedRows > 0;
  }

  static async searchTutors(filters) {
    let query = `
                SELECT DISTINCT tp.*, 
            u.first_name,
            u.last_name,
            u.email,
            u.phone
      FROM tutor_profiles tp
      JOIN users u ON tp.user_id = u.id
      JOIN tutor_classes tc ON tc.tutor_profile_id = tp.id
      JOIN tutor_subjects ts ON ts.tutor_profile_id = tp.id
      JOIN subjects s ON s.id = ts.subject_id
      JOIN board_classes bc ON bc.id = s.board_class_id
      WHERE tp.is_approved = 1
      AND tp.approval_status = 'approved'
  `;

    const values = [];

    if (filters.course_id) {
      query += ` AND tp.course_id = ?`;
      values.push(filters.course_id);
    }
    if (filters.board_id) {
      query += ` AND tp.board_id = ?`;
      values.push(filters.board_id);
    }

    if (filters.class_id) {
      query += ` AND tc.class_id = ?`;
      values.push(filters.class_id);
    }

    if (filters.subject_id) {
      query += ` AND ts.subject_id = ?`;
      values.push(filters.subject_id);
    }

    query += ` ORDER BY tp.created_at DESC`;

    const [rows] = await pool.query(query, values);
    return rows;
  }
}

module.exports = TutorProfile;
