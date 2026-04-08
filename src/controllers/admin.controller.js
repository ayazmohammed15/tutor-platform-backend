const crypto = require("crypto");
const { pool } = require('../config/database');
const {sendEmail} = require("../services/emailService");

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

module.exports = {
  getStudents,
  sendTutorInvite
};