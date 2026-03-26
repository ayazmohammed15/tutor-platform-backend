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
              u.phone,
              s.subject_name  -- ADDED THIS
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       LEFT JOIN subjects s ON tp.subject_id = s.id  -- ADDED THIS JOIN
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
              u.phone,
              s.subject_name  -- ADDED THIS
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       LEFT JOIN subjects s ON tp.subject_id = s.id  -- ADDED THIS JOIN
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
SELECT 
    tp.*,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    s.subject_name,

    MAX(
        CASE
            WHEN tc.course_id = ? AND tcl.class_id = ? THEN 3
            WHEN tc.course_id = ? THEN 2
            ELSE 1
        END
    ) AS match_score

FROM tutor_profiles tp

JOIN users u 
    ON tp.user_id = u.id

LEFT JOIN tutor_courses tc 
    ON tc.tutor_profile_id = tp.id

LEFT JOIN tutor_classes tcl 
    ON tcl.tutor_profile_id = tp.id

LEFT JOIN subjects s
    ON s.id = tp.subject_id

WHERE tp.is_approved = 1
AND tp.approval_status = 'approved'
`;

    const values = [
      filters.course_id,
      filters.class_id,
      filters.course_id
    ];


    // MULTIPLE SUBJECT FILTER
    if (filters.subject_ids && filters.subject_ids.length > 0) {
      query += ` AND tp.subject_id IN (?)`;
      values.push(filters.subject_ids);
    }


    query += `
GROUP BY tp.id
ORDER BY match_score DESC, tp.experience_years DESC
`;

    const [rows] = await pool.query(query, values);

    return rows;

  }
}

module.exports = TutorProfile;
