const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/tutor', authenticate, authorize('tutor'), paymentController.getTutorPayments);
router.post('/create-order/:sessionId', authenticate, authorize('student'), paymentController.createOrder);
router.post('/verify', authenticate, authorize('student'), paymentController.verifyPayment);

module.exports = router;
