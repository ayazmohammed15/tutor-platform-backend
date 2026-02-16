const Payment = require('../models/Payment');
const Session = require('../models/Session');
const TutorProfile = require('../models/TutorProfile');
const razorpayService = require('../services/razorpayService');
const zoomService = require('../services/zoomService');
const emailService = require('../services/emailService');
const User = require('../models/User');

const createOrder = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can make payments'
      });
    }

    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own sessions'
      });
    }

    if (session.status === 'paid' || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Session already paid'
      });
    }

    const existingPayment = await Payment.findBySessionId(sessionId);
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this session'
      });
    }

    const tutorProfile = await TutorProfile.findByUserId(session.tutor_id);
    const amount = tutorProfile.hourly_rate || 500;

    const order = await razorpayService.createOrder(
      amount,
      'INR',
      `session_${sessionId}_${Date.now()}`
    );

    await Payment.create({
      session_id: sessionId,
      student_id: req.user.id,
      amount: amount,
      currency: 'INR',
      razorpay_order_id: order.id
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const payment = await Payment.findByOrderId(razorpay_order_id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    await Payment.updatePaymentStatus(razorpay_order_id, {
      razorpay_payment_id,
      razorpay_signature,
      status: 'completed'
    });

    await Session.updateStatus(payment.session_id, 'paid');

    const session = await Session.findById(payment.session_id);

    try {
      const zoomMeeting = await zoomService.createMeeting({
        topic: `${session.class_name || 'Tutoring'} - ${session.topic_name || 'Session'}`,
        scheduled_date: session.scheduled_date,
        scheduled_time: session.scheduled_time,
        duration_minutes: session.duration_minutes
      });

      await Session.addZoomDetails(payment.session_id, {
        zoom_meeting_link: zoomMeeting.join_url,
        zoom_meeting_id: zoomMeeting.meeting_id.toString(),
        zoom_password: zoomMeeting.password
      });

      const updatedSession = await Session.findById(payment.session_id);
      const student = await User.findById(session.student_id);
      const tutor = await User.findById(session.tutor_id);

      await emailService.sendPaymentSuccessEmail(student, updatedSession);
      await emailService.sendSessionConfirmationEmail(tutor, updatedSession);

      res.status(200).json({
        success: true,
        message: 'Payment verified and session confirmed',
        data: { session: updatedSession }
      });
    } catch (zoomError) {
      console.error('Zoom meeting creation failed:', zoomError);

      res.status(200).json({
        success: true,
        message: 'Payment verified. Zoom meeting will be created shortly.',
        data: { session }
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
