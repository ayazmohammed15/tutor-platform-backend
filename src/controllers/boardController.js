const { pool } = require('../config/database');

/* ========================
   GET ALL COURSES
======================== */
exports.getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT id, course_name, slug
       FROM courses
       WHERE is_active = 1`
    );

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   GET ALL BOARDS
======================== */
exports.getBoards = async (req, res) => {
  try {

    const [boards] = await pool.query(
      `SELECT id, board_name FROM boards WHERE is_active = 1`
    );

    res.json(boards);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   GET CLASSES BY BOARD
======================== */
exports.getClasses = async (req, res) => {
  try {
    const { boardId } = req.query;

    if (!boardId) {
      return res.status(400).json({ message: "boardId is required" });
    }

    const [classes] = await pool.query(
      `
      SELECT 
        c.id,
        c.class_name,
        c.class_order,
        c.slug,
        c.is_active
      FROM board_classes bc
      JOIN classes c ON bc.class_id = c.id
      WHERE bc.board_id = ? AND c.is_active = 1
      ORDER BY c.class_order ASC
      `,
      [boardId]
    );

    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   GET SUBJECTS
======================== */
exports.getSubjects = async (req, res) => {
  try {
    const { boardId, classIds } = req.body;

    if (!boardId || !classIds || !classIds.length) {
      return res.status(400).json({
        message: "boardId and classIds are required"
      });
    }

    const [subjects] = await pool.query(
      `
  SELECT 
    s.id, 
    s.subject_name, 
    s.slug,
    c.class_name
  FROM subjects s
  JOIN board_classes bc ON s.board_class_id = bc.id
  JOIN classes c ON bc.class_id = c.id
  WHERE bc.board_id = ?
    AND bc.class_id IN (?)
    AND s.is_active = 1
  ORDER BY c.class_order ASC
  `,
      [boardId, classIds]
    );

    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: error.message });
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
