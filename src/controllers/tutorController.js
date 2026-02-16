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
    const { bio, education, experience_years, hourly_rate, subjects } = req.body;
    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (education !== undefined) updates.education = education;
    if (experience_years !== undefined) updates.experience_years = experience_years;
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;
    if (subjects !== undefined) updates.subjects = subjects;

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

const getPendingTutors = async (req, res, next) => {
  try {
    const tutors = await TutorProfile.getAllPending();

    res.status(200).json({
      success: true,
      data: { tutors, count: tutors.length }
    });
  } catch (error) {
    next(error);
  }
};

const approveTutor = async (req, res, next) => {
  try {
    const { tutorId } = req.params;

    const profile = await TutorProfile.findByUserId(tutorId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    const approved = await TutorProfile.approve(tutorId, req.user.id);

    if (!approved) {
      return res.status(400).json({
        success: false,
        message: 'Failed to approve tutor'
      });
    }

    const tutor = await User.findById(tutorId);
    await emailService.sendTutorApprovalEmail(tutor, 'approved');

    res.status(200).json({
      success: true,
      message: 'Tutor approved successfully'
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
    await emailService.sendTutorApprovalEmail(tutor, 'rejected');

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
    const { class_name, chapter_name, topic_name } = req.query;

    const tutors = await TutorProfile.searchTutors({
      class_name,
      chapter_name,
      topic_name
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

module.exports = {
  createProfile,
  getMyProfile,
  updateProfile,
  getPendingTutors,
  approveTutor,
  rejectTutor,
  searchTutors,
  getTutorDetails
};
