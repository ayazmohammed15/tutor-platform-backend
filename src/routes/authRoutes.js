const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../utils/validators');
const validate = require('../middleware/validate');

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
