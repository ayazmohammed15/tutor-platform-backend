const { pool } = require('../config/database');
const bcrypt = require("bcryptjs");
const TutorProfile = require('../models/TutorProfile');
const emailService = require('../services/emailService');
const User = require('../models/User');

const createProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can create tutor profiles'
      });
    }

    const existingProfile = await TutorProfile.findByUserId(req.user.id);
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Tutor profile already exists'
      });
    }

    const { bio, education, experience_years, hourly_rate, subjects } = req.body;

    const profileId = await TutorProfile.create({
      user_id: req.user.id,
      bio,
      education,
      experience_years,
      hourly_rate,
      subjects
    });

    const profile = await TutorProfile.findById(profileId);

    res.status(201).json({
      success: true,
      message: 'Tutor profile created successfully. Pending admin approval.',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await TutorProfile.findByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    // UPDATED: Destructure the new fields matching your React state
    const {
      bio,
      education,
      experience_years,
      hourly_rate,
      subject_id,
      demo_link,
      teaching_mode
    } = req.body;

    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (education !== undefined) updates.education = education;
    if (experience_years !== undefined) updates.experience_years = experience_years;
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;

    // UPDATED: Added new fields to the update object
    if (subject_id !== undefined) updates.subject_id = subject_id;
    if (demo_link !== undefined) updates.demo_link = demo_link;
    if (teaching_mode !== undefined) updates.teaching_mode = teaching_mode;

    const updated = await TutorProfile.update(req.user.id, updates);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'No changes made or profile not found'
      });
    }

    const profile = await TutorProfile.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

const getTutorsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,

        tp.id AS tutor_profile_id,
        tp.bio,
        tp.education,
        tp.experience_years,
        tp.hourly_rate,
        tp.profile_image,
        tp.resume,
        tp.teaching_mode,
        tp.approval_status,
        tp.created_at,

        s.subject_name,

        GROUP_CONCAT(DISTINCT c.class_name) AS classes,
        GROUP_CONCAT(DISTINCT co.course_name) AS courses

      FROM users u
      JOIN tutor_profiles tp ON u.id = tp.user_id

      LEFT JOIN subjects s ON tp.subject_id = s.id

      LEFT JOIN tutor_classes tc ON tp.id = tc.tutor_profile_id
      LEFT JOIN classes c ON tc.class_id = c.id

      LEFT JOIN tutor_courses tco ON tp.id = tco.tutor_profile_id
      LEFT JOIN courses co ON tco.course_id = co.id

      WHERE u.role = 'tutor'
      AND tp.approval_status = ?

      GROUP BY tp.id
    `, [status]);

    res.json({
      success: true,
      tutors: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

const crypto = require("crypto");
// const { pool } = require("../config/database");
const { sendEmail } = require("../services/emailService");

const approveTutor = async (req, res, next) => {
  try {
    const { tutorId } = req.params;

    const profile = await TutorProfile.findByUserId(tutorId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Tutor profile not found"
      });
    }

    // 1️⃣ Approve tutor profile
    await TutorProfile.approve(tutorId, req.user.id);

    // 2️⃣ Activate user (allow login)
    await pool.query(
      `UPDATE users 
       SET is_verified = 1 
       WHERE id = ?`,
      [tutorId]
    );

    // 3️⃣ Generate password setup token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users 
       SET password_reset_token = ?, 
           password_reset_expiry = ?
       WHERE id = ?`,
      [resetToken, expiry, tutorId]
    );

    const tutor = await User.findById(tutorId);

    // 4️⃣ Send password setup email
    const resetLink = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;
    console.log("RESET TOKEN:154", resetToken);
    console.log("RESET LINK:155", resetLink);
    console.log("EMAIL:156", tutor.email);

    sendEmail(
      tutor.email,
      "Your Tutor Account Has Been Approved 🎉",
      `
        <h3>Congratulations ${tutor.first_name}!</h3>
        <p>Your tutor account has been approved.</p>
        <p>Please click below to set your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 24 hours.</p>
      `
    )
      .then(() => console.log("Tutor approval email queued"))
      .catch(emailError => console.error("Non-fatal: Failed to send tutor approval email:", emailError));

    res.status(200).json({
      success: true,
      message: "Tutor approved and password setup email sent"
    });

  } catch (error) {
    next(error);
  }
};

const rejectTutor = async (req, res, next) => {
  try {
    const { tutorId } = req.params;

    const profile = await TutorProfile.findByUserId(tutorId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    const rejected = await TutorProfile.reject(tutorId, req.user.id);

    if (!rejected) {
      return res.status(400).json({
        success: false,
        message: 'Failed to reject tutor'
      });
    }

    const tutor = await User.findById(tutorId);
    emailService.sendTutorApprovalEmail(tutor, 'rejected')
      .then(() => console.log("Tutor rejection email queued"))
      .catch(emailError => console.error("Non-fatal: Failed to send tutor rejection email:", emailError));

    res.status(200).json({
      success: true,
      message: 'Tutor rejected'
    });
  } catch (error) {
    next(error);
  }
};

const searchTutors = async (req, res, next) => {
  try {
    const { course_id, class_id, subject_id } = req.query;
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    const effectiveCourseId = student.course_id;
    const effectiveClassId = student?.class_id || null;

    let subjectIds = [];

    // if subject selected manually
    if (subject_id) {

      subjectIds = [parseInt(subject_id, 10)];

    } else {

      // fetch all student subjects automatically
      const [subjects] = await pool.query(
        `SELECT subject_id 
         FROM student_subjects 
         WHERE student_id = ?`,
        [req.user.id]
      );

      subjectIds = subjects.map(s => s.subject_id);

    }

    const tutors = await TutorProfile.searchTutors({
      course_id: effectiveCourseId,
      class_id: effectiveClassId,
      subject_ids: subjectIds
    });

    res.status(200).json({
      success: true,
      data: { tutors, count: tutors.length }
    });

  } catch (error) {
    next(error);
  }
};



const getTutorDetails = async (req, res, next) => {
  try {
    const { tutorId } = req.params;

    const profile = await TutorProfile.findByUserId(tutorId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    if (!profile.is_approved) {
      return res.status(403).json({
        success: false,
        message: 'This tutor is not approved yet'
      });
    }

    res.status(200).json({
      success: true,
      data: { tutor: profile }
    });
  } catch (error) {
    next(error);
  }
};

const getGoogleConnectionStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can check Google status'
      });
    }

    const [rows] = await pool.query(
      'SELECT tutor_id FROM tutor_google_tokens WHERE tutor_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      isConnected: rows && rows.length > 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getMyProfile,
  updateProfile,
  getTutorsByStatus,
  approveTutor,
  rejectTutor,
  searchTutors,
  getTutorDetails,
  getGoogleConnectionStatus
};
