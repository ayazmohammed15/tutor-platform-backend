const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const emailService = require('../services/emailService');

const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const userId = await User.create({
      email,
      password,
      full_name,
      phone,
      role: role || 'student'
    });

    const user = await User.findById(userId);

    await emailService.sendWelcomeEmail(user);

    const token = generateToken({ userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
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

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
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
    const { full_name, phone } = req.body;
    const updates = {};

    if (full_name) updates.full_name = full_name;
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
