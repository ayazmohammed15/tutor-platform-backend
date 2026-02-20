const bcrypt = require("bcryptjs");
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const emailService = require('../services/emailService');
const { pool } = require('../config/database');


const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // 🔒 HARD-CODE ROLE HERE (Student Only)
    const userId = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role: "student"   // ← always student
    });

    const user = await User.findById(userId);

    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: "Student registration successful",
      data: {
        user,
        token
      }
    });

  } catch (error) {
    next(error);
  }
};



const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("🔹 Login attempt for:", email);

    const user = await User.findByEmail(email);

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log("✅ User found:", user.email);
    console.log("Stored password:", user.password);

    const isValidPassword = await User.verifyPassword(password, user.password);

    console.log("Password match result:", isValidPassword);

    if (!isValidPassword) {
      console.log("❌ Password incorrect");
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.is_active) {
      console.log("❌ User is inactive");
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    console.log("🎉 Login successful");

    // ✅ FIXED CODE: Add the names to the token payload!
    const token = generateToken({ 
      userId: user.id, 
      role: user.role,
      first_name: user.first_name, 
      last_name: user.last_name,
      email: user.email // It's usually good practice to put the email in the token too
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error("🔥 Login error:", error);
    next(error);
  }
};

const setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    console.log(password);

    const [users] = await pool.query(
      `SELECT * FROM users 
       WHERE password_reset_token = ? 
       AND password_reset_expiry > NOW()`,
      [token]
    );

    if (!users.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users 
       SET password = ?, 
           password_reset_token = NULL,
           password_reset_expiry = NULL
       WHERE id = ?`,
      [hashedPassword, users[0].id]
    );

    res.json({
      success: true,
      message: "Password set successfully. You can now login."
    });

  } catch (error) {
    console.error("SET PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const updates = {};

    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (phone) updates.phone = phone;

    const updated = await User.update(req.user.id, updates);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'No changes made'
      });
    }

    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const completeRegistration = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      token,
      firstName,
      lastName,
      phone,
      qualification,
      university,
      graduationYear,
      experienceYears,
      boardId,
      classId,
      teachingMode,
      expectedFee,
      about,
      demoLink,
      subjects
    } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token required"
      });
    }

    const [invites] = await connection.query(
  "SELECT * FROM tutor_invites WHERE token = ?",
  [token]
);

if (invites.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid registration link"
  });
}

const invite = invites[0];

// 🔥 Check if already used
if (invite.status === "registered") {
  return res.status(400).json({
    success: false,
    message: "This registration link has already been used."
  });
}

// 🔥 Check if expired
if (new Date(invite.token_expiry) < new Date()) {
  return res.status(400).json({
    success: false,
    message: "This registration link has expired."
  });
}


const [existingUser] = await connection.query(
  "SELECT id FROM users WHERE email = ?",
  [invite.email]
);

if (existingUser.length > 0) {
  return res.status(400).json({
    success: false,
    message: "User already registered"
  });
}

    // 2️⃣ Insert into USERS (without password)
    const [userResult] = await connection.query(
      `INSERT INTO users 
      (first_name, last_name, email, phone, role, is_verified)
      VALUES (?, ?, ?, ?, 'tutor', 0)`,
      [
        firstName,
        lastName,
        invite.email,
        phone
      ]
    );

    const userId = userResult.insertId;

    // Handle files
    const profileImage =
      req.files?.profilePhoto?.[0]?.filename || null;

    const resumeFile =
      req.files?.resume?.[0]?.filename || null;

    const education = `${qualification} - ${university} (${graduationYear})`;

    // 3️⃣ Insert into tutor_profiles
    const [profileResult] = await connection.query(
      `INSERT INTO tutor_profiles
      (user_id, bio, education, experience_years, hourly_rate,
       board_id, class_id, teaching_mode, demo_link,
       profile_image, resume, approval_status, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [
        userId,
        about,
        education,
        experienceYears || 0,
        expectedFee || null,
        boardId || null,
        classId || null,
        teachingMode || null,
        demoLink || null,
        profileImage,
        resumeFile
      ]
    );

    const tutorProfileId = profileResult.insertId;

    // Insert subjects
    if (subjects) {
      let subjectArray =
        typeof subjects === "string"
          ? JSON.parse(subjects)
          : subjects;

      for (const subjectId of subjectArray) {
        await connection.query(
          `INSERT INTO tutor_subjects
          (tutor_profile_id, subject_id)
          VALUES (?, ?)`,
          [tutorProfileId, subjectId]
        );
      }
    }

    // Update invite
    await connection.query(
      "UPDATE tutor_invites SET status = 'registered' WHERE id = ?",
      [invite.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Registration submitted. Await admin approval."
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  setPassword,
  completeRegistration
};
