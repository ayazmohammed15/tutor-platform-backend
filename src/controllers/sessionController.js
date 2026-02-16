const SessionRequest = require('../models/SessionRequest');
const Session = require('../models/Session');
const User = require('../models/User');
const emailService = require('../services/emailService');

const createSessionRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can create session requests'
      });
    }

    const { tutor_id, subject_id, requested_date, requested_time, notes } = req.body;

    const tutor = await User.findById(tutor_id);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    const requestId = await SessionRequest.create({
      student_id: req.user.id,
      tutor_id,
      subject_id,
      requested_date,
      requested_time,
      notes
    });

    const sessionRequest = await SessionRequest.findById(requestId);

    await emailService.sendSessionRequestEmail(tutor, sessionRequest);

    res.status(201).json({
      success: true,
      message: 'Session request sent successfully',
      data: { sessionRequest }
    });
  } catch (error) {
    next(error);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    let requests;

    if (req.user.role === 'student') {
      requests = await SessionRequest.findByStudentId(req.user.id);
    } else if (req.user.role === 'tutor') {
      requests = await SessionRequest.findByTutorId(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid role'
      });
    }

    res.status(200).json({
      success: true,
      data: { requests, count: requests.length }
    });
  } catch (error) {
    next(error);
  }
};

const getPendingRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can view pending requests'
      });
    }

    const requests = await SessionRequest.getPendingByTutorId(req.user.id);

    res.status(200).json({
      success: true,
      data: { requests, count: requests.length }
    });
  } catch (error) {
    next(error);
  }
};

const acceptRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can accept requests'
      });
    }

    const { requestId } = req.params;
    const sessionRequest = await SessionRequest.findById(requestId);

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (sessionRequest.tutor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept your own requests'
      });
    }

    if (sessionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    await SessionRequest.updateStatus(requestId, 'accepted');

    const sessionId = await Session.create({
      session_request_id: requestId,
      student_id: sessionRequest.student_id,
      tutor_id: sessionRequest.tutor_id,
      subject_id: sessionRequest.subject_id,
      scheduled_date: sessionRequest.requested_date,
      scheduled_time: sessionRequest.requested_time,
      duration_minutes: 60,
      notes: sessionRequest.notes
    });

    const session = await Session.findById(sessionId);
    const student = await User.findById(sessionRequest.student_id);

    await emailService.sendRequestAcceptedEmail(student, session);

    res.status(200).json({
      success: true,
      message: 'Request accepted successfully',
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can reject requests'
      });
    }

    const { requestId } = req.params;
    const sessionRequest = await SessionRequest.findById(requestId);

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (sessionRequest.tutor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject your own requests'
      });
    }

    if (sessionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    await SessionRequest.updateStatus(requestId, 'rejected');

    const student = await User.findById(sessionRequest.student_id);
    await emailService.sendRequestRejectedEmail(student, sessionRequest);

    res.status(200).json({
      success: true,
      message: 'Request rejected'
    });
  } catch (error) {
    next(error);
  }
};

const suggestAlternateDate = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can suggest alternate dates'
      });
    }

    const { requestId } = req.params;
    const { suggested_date, suggested_time } = req.body;

    const sessionRequest = await SessionRequest.findById(requestId);

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (sessionRequest.tutor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own requests'
      });
    }

    if (sessionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request already processed'
      });
    }

    await SessionRequest.updateStatus(requestId, 'pending', {
      suggested_date,
      suggested_time
    });

    const updatedRequest = await SessionRequest.findById(requestId);
    const student = await User.findById(sessionRequest.student_id);

    await emailService.sendAlternateDateEmail(student, updatedRequest);

    res.status(200).json({
      success: true,
      message: 'Alternate date suggested successfully',
      data: { sessionRequest: updatedRequest }
    });
  } catch (error) {
    next(error);
  }
};

const getMySessions = async (req, res, next) => {
  try {
    let sessions;

    if (req.user.role === 'student') {
      sessions = await Session.findByStudentId(req.user.id);
    } else if (req.user.role === 'tutor') {
      sessions = await Session.findByTutorId(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid role'
      });
    }

    res.status(200).json({
      success: true,
      data: { sessions, count: sessions.length }
    });
  } catch (error) {
    next(error);
  }
};

const getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.student_id !== req.user.id && session.tutor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSessionRequest,
  getMyRequests,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
  suggestAlternateDate,
  getMySessions,
  getSessionDetails
};
