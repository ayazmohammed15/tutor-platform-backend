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
    const classIds = Array.isArray(filters.class_ids) ? filters.class_ids.filter(Boolean) : [];
    const courseIds = Array.isArray(filters.course_ids) ? filters.course_ids.filter(Boolean) : [];
    const subjectIds = Array.isArray(filters.subject_ids) ? filters.subject_ids.filter(Boolean) : [];
    const search = filters.search?.trim() || null;
    const qualification = filters.qualification?.trim() || null;
    const minExperience = filters.min_experience ? Number(filters.min_experience) : null;

    const conditions = [
      `tp.is_approved = 1`,
      `tp.approval_status = 'approved'`,
    ];
    const values = [];

    // Course filter — tutor must teach this course (tutor_courses junction table)
    if (courseIds.length > 0) {
      conditions.push(
        `EXISTS (SELECT 1 FROM tutor_courses tc WHERE tc.tutor_profile_id = tp.id AND tc.course_id IN (?))`
      );
      values.push(courseIds);
    }

    // Class filter — tutor must teach this class (tutor_classes junction table)
    if (classIds.length > 0) {
      conditions.push(
        `EXISTS (SELECT 1 FROM tutor_classes tcl WHERE tcl.tutor_profile_id = tp.id AND tcl.class_id IN (?))`
      );
      values.push(classIds);
    }

    // Subject filter — tutor's primary subject must match (tutor_profiles.subject_id)
    if (subjectIds.length > 0) {
      conditions.push(`tp.subject_id IN (?)`);
      values.push(subjectIds);
    }

    // Search — name OR email (case-insensitive LIKE)
    if (search) {
      const like = `%${search}%`;
      conditions.push(
        `(u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.email LIKE ?)`
      );
      values.push(like, like, like, like);
    }

    // Qualification — matches education field
    if (qualification) {
      conditions.push(`tp.education LIKE ?`);
      values.push(`%${qualification}%`);
    }

    // Minimum experience
    if (minExperience !== null && !isNaN(minExperience)) {
      conditions.push(`tp.experience_years >= ?`);
      values.push(minExperience);
    }

    const query = `
SELECT
    tp.*,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    s.subject_name
FROM tutor_profiles tp
JOIN users u ON tp.user_id = u.id
LEFT JOIN subjects s ON s.id = tp.subject_id
WHERE ${conditions.join('\n  AND ')}
ORDER BY tp.experience_years DESC
`;

    const [rows] = await pool.query(query, values);
    return rows;
  }

  static async getPublicTutors(filters = {}) {
    const limit = Number(filters.limit) > 0 ? Math.min(Number(filters.limit), 50) : 6;
    const subjectId = Number(filters.subject_id) || null;
    const classId = Number(filters.class_id) || null;
    const search = filters.search?.trim() || null;

    const conditions = [
      `tp.is_approved = 1`,
      `tp.approval_status = 'approved'`,
      `u.role = 'tutor'`,
      `u.is_active = 1`
    ];
    const values = [];

    if (subjectId) {
      conditions.push(`tp.subject_id = ?`);
      values.push(subjectId);
    }

    if (classId) {
      conditions.push(
        `EXISTS (
          SELECT 1
          FROM tutor_classes tc_filter
          WHERE tc_filter.tutor_profile_id = tp.id
          AND tc_filter.class_id = ?
        )`
      );
      values.push(classId);
    }

    if (search) {
      const like = `%${search}%`;
      conditions.push(
        `(u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR s.subject_name LIKE ?)`
      );
      values.push(like, like, like, like);
    }

    values.push(limit);

    const query = `
      SELECT
        tp.id AS tutor_profile_id,
        tp.user_id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        tp.bio,
        tp.education,
        tp.experience_years,
        tp.hourly_rate,
        tp.profile_image,
        tp.teaching_mode,
        tp.demo_link,
        s.id AS subject_id,
        s.subject_name,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.class_order SEPARATOR ', ') AS classes,
        GROUP_CONCAT(DISTINCT co.course_name ORDER BY co.id SEPARATOR ', ') AS exam_focus
      FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      LEFT JOIN subjects s ON s.id = tp.subject_id
      LEFT JOIN tutor_classes tc ON tc.tutor_profile_id = tp.id
      LEFT JOIN classes c ON c.id = tc.class_id
      LEFT JOIN tutor_courses tco ON tco.tutor_profile_id = tp.id
LEFT JOIN courses co ON co.id = tco.course_id
      WHERE ${conditions.join('\n        AND ')}
      GROUP BY
        tp.id,
        tp.user_id,
        u.first_name,
        u.last_name,
        tp.bio,
        tp.education,
        tp.experience_years,
        tp.hourly_rate,
        tp.profile_image,
        tp.teaching_mode,
        tp.demo_link,
        s.id,
        s.subject_name
      ORDER BY tp.created_at DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, values);
    return rows;
  }
}

module.exports = TutorProfile;
