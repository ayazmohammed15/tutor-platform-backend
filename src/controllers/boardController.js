const { pool } = require('../config/database');

/* ========================
   GET ALL MASTER SUBJECTS
   (Used by Tutors in Step 1)
======================== */
exports.getAllSubjects = async (req, res) => {
  try {
    const [subjects] = await pool.query(
      `SELECT id, subject_name, slug FROM subjects WHERE is_active = 1 ORDER BY subject_name ASC`
    );
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ========================
   GET ALL COURSES
   (Used to show Goals like "CBSE", "Foundation", "IIT-JEE")
======================== */
exports.getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT id, course_name, slug FROM courses WHERE is_active = 1 ORDER BY id ASC`
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ========================
   GET SUBJECTS BY COURSE
   (Used by Students in Step 3 after picking a Course)
======================== */
/* ========================
   GET SUBJECTS BY COURSE
======================== */
exports.getSubjectsByCourse = async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const [subjects] = await pool.query(
      `
      SELECT s.id, s.subject_name, s.slug
      FROM subjects s
      JOIN course_subjects cs ON s.id = cs.subject_id
      WHERE cs.course_id = ? AND s.is_active = 1
      ORDER BY s.subject_name ASC
      `,
      [courseId]
    );

    res.json(subjects);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCoursesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "subjectId is required",
      });
    }

    const [courses] = await pool.query(
      `
      SELECT c.id, c.course_name, c.slug
      FROM courses c
      JOIN course_subjects cs ON c.id = cs.course_id
      JOIN subjects s ON s.id = cs.subject_id
      WHERE s.id = ? AND c.is_active = 1
      ORDER BY c.course_name ASC
      `,
      [subjectId]
    );

    res.json(courses);

  } catch (error) {
    console.error("Error fetching courses by subject:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ========================
   GET ALL CLASSES
   (Used for Multi-select in Tutor/Student forms)
======================== */
exports.getAllClasses = async (req, res) => {
  try {
    const [classes] = await pool.query(
      `SELECT id, class_name, slug FROM classes WHERE is_active = 1 ORDER BY class_order ASC`
    );
    res.json(classes);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ========================
   GET CHAPTERS
======================== */
exports.getChapters = async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required" });
    }

    const [chapters] = await pool.query(
      `SELECT id, chapter_name, slug
       FROM chapters
       WHERE subject_id = ? AND is_active = 1
       ORDER BY chapter_order ASC`,
      [subjectId]
    );

    res.json(chapters);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};