const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/create-order/:sessionId', authenticate, authorize('student'), paymentController.createOrder);
router.post('/verify', authenticate, authorize('student'), paymentController.verifyPayment);

module.exports = router;
