const bcrypt = require("bcryptjs");
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const emailService = require('../services/emailService');
const { pool } = require('../config/database');


const register = async (req, res, next) => {
  try {
    // 1. Updated req.body: removed board_id, replaced subject_id with subjects array
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      course,
      class_id,
      subjects // This is now an array of IDs from your React frontend
    } = req.body;


    console.log(req.body);

    console.log("🔹 Registration attempt for:", email);

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Validate subjects array
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one subject."
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

    // 2. Create User (Only Single Values go in the users table now)
    const userId = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role: "student",
      course,
      class_id
    });

    // 3. Insert into the student_subjects link table
    // We map over the array to create bulk insert values: [[userId, sub1], [userId, sub2]]
    const subjectValues = subjects.map(subjectId => [userId, subjectId]);

    await pool.query(
      `INSERT INTO student_subjects (student_id, subject_id) VALUES ?`,
      [subjectValues]
    );

    // Fetch the complete user object
    const user = await User.findById(userId);

    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    // 📧 ==========================================
    // TRIGGER STUDENT WELCOME EMAIL HERE
    // ==========================================
    if (user.role === 'student') {
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error("Non-fatal error: Failed to send welcome email:", emailError);
      }
    }
    // ==========================================

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

    if (user.role === "tutor") {
      const [profile] = await pool.query(
        "SELECT approval_status FROM tutor_profiles WHERE user_id = ?",
        [user.id]
      );

      if (!profile.length || profile[0].approval_status !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Your account is under review. Please wait for admin approval."
        });
      }
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
          role: user.role,
          course_id: user.course_id,
          board_id: user.board_id,
          class_id: user.class_id,
          subject_id: user.subject_id
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
        message: "User not found"
      });
    }

    user.subjects = user.subjects
      ? user.subjects.split(",").map(Number)
      : [];

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
      courseIds,      // Array of Multiple Courses
      classIds,       // Array of Multiple Classes
      teachingMode,
      expectedFee,
      about,
      demoLink,
      subjectId       // Single ID (Tutor expertise)
    } = req.body;

    // 1️⃣ Validation Logic
    if (!token) return res.status(400).json({ success: false, message: "Token required" });

    const [invites] = await connection.query("SELECT * FROM tutor_invites WHERE token = ?", [token]);
    if (invites.length === 0) return res.status(400).json({ success: false, message: "Invalid link" });

    const invite = invites[0];
    if (invite.status === "registered") return res.status(400).json({ success: false, message: "Link already used" });
    if (new Date(invite.token_expiry) < new Date()) return res.status(400).json({ success: false, message: "Link expired" });

    const [existingUser] = await connection.query("SELECT id FROM users WHERE email = ?", [invite.email]);
    if (existingUser.length > 0) return res.status(400).json({ success: false, message: "User already registered" });

    // 2️⃣ Insert into users table
    // 🔥 FIX: Added a temporary password because your schema strictly requires it (NOT NULL)
    const [userResult] = await connection.query(
      `INSERT INTO users (first_name, last_name, email, phone, role, is_verified) VALUES (?, ?, ?, ?, 'tutor', 0)`,
      [firstName, lastName, invite.email, phone]
    );
    const userId = userResult.insertId;

    // Handle File Uploads
    const profileImage = req.files?.profilePhoto?.[0]?.filename || null;
    const resumeFile = req.files?.resume?.[0]?.filename || null;
    const education = `${qualification} - ${university} (${graduationYear})`;

    // 3️⃣ Insert into tutor_profiles 
    // 🔥 CHANGED: Added subject_id directly into this insert query based on your schema update
    const [profileResult] = await connection.query(
      `INSERT INTO tutor_profiles
      (user_id, bio, education, experience_years, hourly_rate, teaching_mode, demo_link, profile_image, resume, approval_status, is_approved, subject_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
      [userId, about, education, experienceYears || 0, expectedFee || null, teachingMode || null, demoLink || null, profileImage, resumeFile, subjectId]
    );
    const tutorProfileId = profileResult.insertId;

    // 🔥 REMOVED: The step 4 that inserted into tutor_subjects is gone, as it is now handled in step 3.

    // 4️⃣ Insert MULTIPLE Courses (tutor_courses) - Junction Table
    if (courseIds) {
      const courseArray = typeof courseIds === "string" ? JSON.parse(courseIds) : courseIds;
      if (courseArray.length > 0) {
        // Create an array of arrays for bulk insert: [[profileId, courseId1], [profileId, courseId2]]
        const courseValues = courseArray.map(cId => [tutorProfileId, cId]);
        await connection.query("INSERT INTO tutor_courses (tutor_profile_id, course_id) VALUES ?", [courseValues]);
      }
    }

    // 5️⃣ Insert MULTIPLE Classes (tutor_classes) - Junction Table
    if (classIds) {
      const classArray = typeof classIds === "string" ? JSON.parse(classIds) : classIds;
      if (classArray.length > 0) {
        const classValues = classArray.map(clId => [tutorProfileId, clId]);
        await connection.query("INSERT INTO tutor_classes (tutor_profile_id, class_id) VALUES ?", [classValues]);
      }
    }

    // 6️⃣ Update Invite Status
    await connection.query("UPDATE tutor_invites SET status = 'registered' WHERE id = ?", [invite.id]);

    await connection.commit();
    res.json({ success: true, message: "Registration submitted successfully!" });

  } catch (error) {
    await connection.rollback();
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
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
