const crypto = require("crypto");
const { pool } = require('../config/database');
const { sendEmail } = require("../services/emailService");

const sendTutorInvite = async (req, res) => {
  try {
    const { full_name, email, description } = req.body;
    console.log("Request body:", req.body);
    console.log("Email value:", email);


    // 1️⃣ Check if already user exists
    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "User already registered"
      });
    }

    // 2️⃣ Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3️⃣ Insert into tutor_invites
    await pool.query(
      `INSERT INTO tutor_invites 
      (full_name, email, description, token, token_expiry, created_by)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        description,
        token,
        tokenExpiry,
        req.user.id
      ]
    );

    // 4️⃣ Create Registration Link
    const registrationLink = `${process.env.FRONTEND_URL}/tutor-register?token=${token}`;
    console.log("Email value:", email);
    console.log("Registration Link:", registrationLink);
    // 5️⃣ Send Email
    sendEmail(
      email,
      "Tutor Registration Invite",
      `
        <h3>Hello ${full_name},</h3>
        <p>You have been invited to register as a tutor.</p>
        <a href="${registrationLink}">${registrationLink}</a>
        <p>This link expires in 24 hours.</p>
      `
    )
      .then(() => console.log("Tutor invite email queued"))
      .catch(emailError => console.error("Non-fatal: Failed to send tutor invite email:", emailError));


    res.status(200).json({
      message: "Registration link sent successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// exports.getPendingTutors = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       "SELECT * FROM users WHERE role = 'tutor' AND is_verified = 0"
//     );

//     res.json({
//       success: true,
//       tutors: rows
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };

const getStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        is_verified,
        is_active,
        created_at
      FROM users
      WHERE role = 'student'
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      students: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
};

const getCourses = async (req, res) => {
  try {

    const { type } = req.query;

    console.log("REQ QUERY:", req.query);
    console.log("TYPE:", type);

    let query = `
      SELECT *
      FROM courses
      WHERE is_active = 1
    `;

    const params = [];

    if (type) {
      query += ` AND course_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY id DESC`;

    const [courses] = await pool.query(query, params);

    res.json(courses);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch courses"
    });
  }
};

const createCourse = async (req, res) => {
  try {

    const { course_name, course_type } = req.body;

    const slug = course_name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    await pool.query(
      `
      INSERT INTO courses
      (course_name, slug, course_type)
      VALUES (?, ?, ?)
      `,
      [course_name, slug, course_type]
    );

    res.status(201).json({
      success: true,
      message: "Course created successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to create course"
    });
  }
};

const updateCourse = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      course_name,
      course_type

    } = req.body;

    const slug = course_name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    await pool.query(
      `
      UPDATE courses
      SET course_name=?,
          slug=?,
          course_type=?
      WHERE id=?
      `,
      [course_name, slug, course_type, id]
    );

    res.json({
      success: true,
      message: "Course updated successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to update course"
    });
  }
};

const getSubjects = async (req, res) => {
  try {

    const [subjects] = await pool.query(`
      SELECT *
      FROM subjects
      WHERE is_active = 1
      ORDER BY subject_name ASC
    `);

    res.json(subjects);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const createSubject = async (req, res) => {
  try {

    const { subject_name } = req.body;

    const slug = subject_name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    await pool.query(
      `
      INSERT INTO subjects
      (subject_name, slug)
      VALUES (?, ?)
      `,
      [subject_name, slug]
    );

    res.json({
      success: true
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const getCourseSubjects = async (req, res) => {

  try {

    const { courseId } = req.query;

    const [rows] = await pool.query(
      `
      SELECT subject_id
      FROM course_subjects
      WHERE course_id = ?
      `,
      [courseId]
    );

    res.json(
      rows.map(row => row.subject_id)
    );

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const saveCourseSubjects = async (req, res) => {

  try {

    const {
      courseId,
      subjectIds
    } = req.body;

    await pool.query(
      `
      DELETE FROM course_subjects
      WHERE course_id = ?
      `,
      [courseId]
    );

    for (const subjectId of subjectIds) {

      await pool.query(
        `
        INSERT INTO course_subjects
        (course_id, subject_id)
        VALUES (?, ?)
        `,
        [courseId, subjectId]
      );

    }

    res.json({
      success: true
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  getStudents,
  sendTutorInvite,
  getCourses,
  createCourse,
  updateCourse,
  getSubjects,
  createSubject,
  getCourseSubjects,
  saveCourseSubjects
};