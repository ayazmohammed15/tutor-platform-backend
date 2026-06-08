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
              s.subject_name,
              GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.class_order) AS classes,
              GROUP_CONCAT(DISTINCT c.id ORDER BY c.class_order) AS class_ids
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       LEFT JOIN subjects s ON tp.subject_id = s.id
       LEFT JOIN tutor_classes tc ON tc.tutor_profile_id = tp.id
       LEFT JOIN classes c ON c.id = tc.class_id
       WHERE tp.user_id = ?
       GROUP BY tp.id`,
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
              s.subject_name,
              GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.class_order) AS classes,
              GROUP_CONCAT(DISTINCT c.id ORDER BY c.class_order) AS class_ids
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       LEFT JOIN subjects s ON tp.subject_id = s.id
       LEFT JOIN tutor_classes tc ON tc.tutor_profile_id = tp.id
       LEFT JOIN classes c ON c.id = tc.class_id
       WHERE tp.id = ?
       GROUP BY tp.id`,
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
    // Normalize filters to arrays when appropriate
    const classIds = Array.isArray(filters.class_ids)
      ? filters.class_ids
      : (filters.class_id ? String(filters.class_id).split(',').map(Number) : []);

    const courseIds = Array.isArray(filters.course_ids)
      ? filters.course_ids
      : (filters.course_id ? String(filters.course_id).split(',').map(Number) : []);

    const subjectIds = Array.isArray(filters.subject_ids)
      ? filters.subject_ids
      : (filters.subject_id ? String(filters.subject_id).split(',').map(Number) : []);

    // Base select
    let selectExtras = [];
    let values = [];

    if (classIds.length > 0) {
      selectExtras.push(`SUM(CASE WHEN tcl.class_id IN (?) THEN 1 ELSE 0 END) AS class_match_count`);
      values.push(classIds);
    } else {
      selectExtras.push(`0 AS class_match_count`);
    }

    if (courseIds.length > 0) {
      selectExtras.push(`SUM(CASE WHEN tc.course_id IN (?) THEN 1 ELSE 0 END) AS course_match_count`);
      values.push(courseIds);
    } else {
      selectExtras.push(`0 AS course_match_count`);
    }

    if (subjectIds.length > 0) {
      selectExtras.push(`CASE WHEN tp.subject_id IN (?) THEN 1 ELSE 0 END AS subject_match`);
      values.push(subjectIds);
    } else {
      selectExtras.push(`0 AS subject_match`);
    }

    const query = `
SELECT 
    tp.*,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    s.subject_name,
    ${selectExtras.join(',\n    ')},
    (
      -- match_score will be computed in JS from the returned columns
      0
    ) AS match_score

FROM tutor_profiles tp

JOIN users u ON tp.user_id = u.id

LEFT JOIN tutor_courses tc ON tc.tutor_profile_id = tp.id
LEFT JOIN tutor_classes tcl ON tcl.tutor_profile_id = tp.id

LEFT JOIN subjects s ON s.id = tp.subject_id

WHERE tp.is_approved = 1
  AND tp.approval_status = 'approved'

GROUP BY tp.id
ORDER BY tp.experience_years DESC
`;

    // Note: We'll compute a match_score in JavaScript after fetching the aggregated match counts.

    const [rows] = await pool.query(query, values);

    // If no class/course/subject filters provided, return rows as-is
    if (classIds.length === 0 && courseIds.length === 0 && subjectIds.length === 0) {
      return rows;
    }

    // Compute match_score in JS based on available match columns, then sort
    const enriched = rows.map(r => {
      const classMatch = r.class_match_count ? Number(r.class_match_count) : 0;
      const courseMatch = r.course_match_count ? Number(r.course_match_count) : 0;
      const subjectMatch = r.subject_match ? Number(r.subject_match) : 0;
      return { ...r, match_score: classMatch + courseMatch + subjectMatch };
    });

    enriched.sort((a, b) => {
      if (b.match_score !== a.match_score) return b.match_score - a.match_score;
      return (b.experience_years || 0) - (a.experience_years || 0);
    });

    return enriched;
  }
}

module.exports = TutorProfile;
