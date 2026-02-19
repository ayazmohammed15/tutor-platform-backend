const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    const [users] = await pool.query(
  `SELECT id, first_name, last_name, email, role, is_active 
   FROM users WHERE id = ?`,
  [decoded.userId]
);


    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (!users[0].is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
