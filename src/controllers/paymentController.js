const Payment = require('../models/Payment');
const Session = require('../models/Session');
const TutorProfile = require('../models/TutorProfile');
const razorpayService = require('../services/razorpayService');
// const zoomService = require('../services/zoomService');
const googleMeetService = require('../services/googleMeetService');
const { pool } = require('../config/database');
const emailService = require('../services/emailService');
const User = require('../models/User');

const getPaymentMethod = (payload = {}) => payload.payment_method || payload.paymentMethod || null;

const getTutorPayments = async (req, res, next) => {
  try {
    const payments = await Payment.findCompletedByTutorId(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        payments,
        count: payments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const paymentMethod = getPaymentMethod(req.body);

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (session.status === 'paid' || session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    const existingPayment = await Payment.findLatestBySessionId(sessionId);

    if (existingPayment) {
      if (existingPayment.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Payment already completed' });
      }

      if (existingPayment.status === 'pending') {
        if (paymentMethod && existingPayment.payment_method !== paymentMethod) {
          await Payment.updatePaymentMethod(existingPayment.razorpay_order_id, paymentMethod);
        }

        return res.json({
          success: true,
          data: {
            orderId: existingPayment.razorpay_order_id,
            amount: existingPayment.amount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID
          }
        });
      }
    }

    const tutorProfile = await TutorProfile.findByUserId(session.tutor_id);
    const amount = tutorProfile.hourly_rate || 500;

    let order;

    if (process.env.PAYMENT_MODE === 'mock') {
      order = { id: "mock_order_" + Date.now() };
    } else {
      order = await razorpayService.createOrder(
        amount,
        'INR',
        `session_${sessionId}_${Date.now()}`
      );
    }

    await Payment.create({
      session_id: sessionId,
      student_id: req.user.id,
      amount,
      currency: 'INR',
      razorpay_order_id: order.id,
      payment_method: paymentMethod
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;
    const paymentMethod = getPaymentMethod(req.body);

    let isValid = true;

    if (process.env.PAYMENT_MODE !== 'mock') {
      isValid = razorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Verification failed' });
    }

    const payment = await Payment.findByOrderId(razorpay_order_id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status === 'completed') {
      return res.json({ success: true, message: 'Already verified' });
    }

    await Payment.updatePaymentStatus(razorpay_order_id, {
      razorpay_payment_id,
      razorpay_signature,
      status: 'completed',
      payment_method: paymentMethod
    });

    await Session.updateStatus(payment.session_id, 'paid');

    const session = await Session.findById(payment.session_id);
    try {
      const meetLink = await googleMeetService.createMeetLink(
        session.tutor_id,
        session
      );

      // save meet link
      await pool.query(
        "UPDATE sessions SET zoom_meeting_link = ? WHERE id = ?",
        [meetLink, payment.session_id]
      );

      const updatedSession = await Session.findById(payment.session_id);
      const student = await User.findById(session.student_id);
      const tutor = await User.findById(session.tutor_id);

      emailService.sendPaymentSuccessEmail(student, updatedSession)
        .then(() => console.log("Payment success email queued"))
        .catch(emailError => console.error("Non-fatal: Failed to send payment success email:", emailError));

      emailService.sendSessionConfirmationEmail(tutor, updatedSession)
        .then(() => console.log("Session confirmation email queued"))
        .catch(emailError => console.error("Non-fatal: Failed to send session confirmation email:", emailError));

      res.json({ success: true, message: 'Payment successful', data: updatedSession });

    } catch (err) {
      console.error("Google Meet error:", err);

      const updatedSession = await Session.findById(payment.session_id);
      const message = err.message.includes('Google Calendar')
        ? 'Payment successful, but tutor has not connected Google Calendar yet.'
        : 'Payment successful (Google Meet could not be created).';

      res.json({
        success: true,
        message,
        data: updatedSession
      });
    }

  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getTutorPayments };
