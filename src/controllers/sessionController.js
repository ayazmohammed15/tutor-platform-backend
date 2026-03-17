const { pool } = require('../config/database');
const SessionRequest = require('../models/SessionRequest');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const Session = require('../models/Session');
const User = require('../models/User');
const emailService = require('../services/emailService');

const createSessionRequest = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can create session requests' });
    }

    let { tutor_id, subject_id, requested_date, requested_time, notes } = req.body;
    tutor_id = parseInt(tutor_id, 10);
    subject_id = subject_id !== undefined && subject_id !== null && subject_id !== '' ? parseInt(subject_id, 10) : null;
    requested_time = String(requested_time).slice(0, 5);
    const requestedDateOnly = requested_date.split('T')[0];
    const reqDate = new Date(requestedDateOnly);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reqDate < today) return res.status(400).json({ success: false, message: 'Cannot book past dates' });

    const tutor = await User.findById(tutor_id);
    if (!tutor || tutor.role !== 'tutor') return res.status(404).json({ success: false, message: 'Tutor not found' });

    const range = await AvailabilitySlot.getRange(tutor_id);
    if (!range) return res.status(400).json({ success: false, message: 'Tutor has no availability set' });

    const startDate = new Date(range.start_date);
    const endDate = new Date(range.end_date);
    if (reqDate < startDate || reqDate > endDate) return res.status(400).json({ success: false, message: 'Selected date is outside tutor availability range' });

    const [excluded] = await connection.query(`SELECT id FROM tutor_unavailable_dates WHERE tutor_id = ? AND date = ?`, [tutor_id, requestedDateOnly]);
    if (excluded.length > 0) return res.status(400).json({ success: false, message: 'Tutor is unavailable on this date' });

    const dayOfWeek = reqDate.toLocaleString('en-US', { weekday: 'long' });
    const weeklyBlocks = await AvailabilitySlot.findByTutorId(tutor_id);
    const dayBlocks = weeklyBlocks.filter(block => block.day_of_week === dayOfWeek);

    if (dayBlocks.length === 0) return res.status(400).json({ success: false, message: 'Tutor does not work on this day' });

    let validSlots = [];
    dayBlocks.forEach(block => {
      let current = String(block.start_time).slice(0, 5);
      const end = String(block.end_time).slice(0, 5);
      const duration = block.slot_duration;
      while (current < end) {
        const [h, m] = current.split(':').map(Number);
        const nextTime = new Date(0, 0, 0, h, m + duration);
        const nextStr = nextTime.toTimeString().slice(0, 5);
        if (nextStr <= end) validSlots.push(current);
        current = nextStr;
      }
    });

    if (!validSlots.includes(requested_time)) return res.status(400).json({ success: false, message: 'Invalid time slot selected' });

    await connection.beginTransaction();

    // const [existingSession] = await connection.query(
    //   `SELECT id FROM sessions WHERE tutor_id = ? AND scheduled_date = ? AND scheduled_time = ? FOR UPDATE`,
    //   [tutor_id, requestedDateOnly, requested_time]
    // );

    // if (existingSession.length > 0) {
    //   await connection.rollback();
    //   return res.status(400).json({ success: false, message: 'This time slot is already booked' });
    // }
    const MAX_CAPACITY = 5;

    // lock rows to avoid race condition
    const [slotBookings] = await connection.query(
      `SELECT subject_id, COUNT(*) as booking_count
   FROM session_requests
   WHERE tutor_id = ?
   AND requested_date = ?
   AND requested_time = ?
   AND status IN ('pending','accepted')
   GROUP BY subject_id
   FOR UPDATE`,
      [tutor_id, requestedDateOnly, requested_time]
    );

    if (slotBookings.length > 0) {
      // Data safety: more than one subject in same tutor/date/time should never happen
      if (slotBookings.length > 1) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'This slot has conflicting bookings. Please choose another slot'
        });
      }

      const slotSubject = slotBookings[0].subject_id;
      const bookingCount = Number(slotBookings[0].booking_count);

      // Rule 1: Different subject cannot join same slot
      if (slotSubject !== subject_id) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'This slot is already reserved for another subject'
        });
      }

      // Rule 2: Slot capacity reached
      if (bookingCount >= MAX_CAPACITY) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'This slot is already full'
        });
      }
    }

    const [duplicate] = await connection.query(
      `SELECT id 
   FROM session_requests
   WHERE student_id = ?
   AND tutor_id = ?
   AND requested_date = ?
   AND requested_time = ?
   AND status IN ('pending','accepted')
   LIMIT 1`,
      [req.user.id, tutor_id, requestedDateOnly, requested_time]
    );

    if (duplicate.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already booked this slot'
      });
    }

    const [insertResult] = await connection.query(
      `INSERT INTO session_requests
       (student_id, tutor_id, subject_id, requested_date, requested_time, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, tutor_id, subject_id, requestedDateOnly, requested_time, notes]
    );
    const requestId = insertResult.insertId;

    await connection.commit();

    const sessionRequest = await SessionRequest.findById(requestId);

    // ==========================================
    // 📧 1. EMAIL TRIGGER: NEW REQUEST TO TUTOR
    // ==========================================
    try {
      const student = await User.findById(req.user.id); // Fetch student details for the email

      const emailTutorData = {
        email: tutor.email,
        first_name: `${tutor.first_name} ${tutor.last_name}`
      };

      const emailSessionData = {
        student_name: `${student.first_name} ${student.last_name}`,
        requested_date: requestedDateOnly,
        requested_time: requested_time
        // Add class_name & topic_name here if you pull them from the DB
      };

      await emailService.sendSessionRequestEmail(emailTutorData, emailSessionData);
    } catch (emailError) {
      console.error("Non-fatal: Failed to send request email to tutor:", emailError);
    }

    res.status(201).json({ success: true, message: 'Session request sent successfully', data: { sessionRequest } });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    next(error);
  } finally {
    connection.release();
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
      return res.status(403).json({ success: false, message: 'Invalid role' });
    }
    res.status(200).json({ success: true, data: { requests, count: requests.length } });
  } catch (error) {
    next(error);
  }
};

const getPendingRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ success: false, message: 'Only tutors can view pending requests' });
    const requests = await SessionRequest.getPendingByTutorId(req.user.id);
    res.status(200).json({ success: true, data: { requests, count: requests.length } });
  } catch (error) {
    next(error);
  }
};

const acceptRequest = async (req, res, next) => {
  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ success: false, message: 'Only tutors can accept requests' });

    const { requestId } = req.params;
    await connection.beginTransaction();
    transactionStarted = true;
    const [requestRows] = await connection.query(
      `SELECT * FROM session_requests WHERE id = ? FOR UPDATE`,
      [requestId]
    );
    const sessionRequest = requestRows[0];

    if (!sessionRequest) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (sessionRequest.tutor_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You can only accept your own requests' });
    }
    if (sessionRequest.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const MAX_CAPACITY = 5;
    const [slotBookings] = await connection.query(
      `SELECT subject_id, COUNT(*) as booking_count
       FROM session_requests
       WHERE tutor_id = ?
         AND requested_date = ?
         AND requested_time = ?
         AND status IN ('pending','accepted')
       GROUP BY subject_id
       FOR UPDATE`,
      [sessionRequest.tutor_id, sessionRequest.requested_date, sessionRequest.requested_time]
    );

    if (slotBookings.length > 1) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Conflicting subjects exist for this slot' });
    }

    if (slotBookings.length === 1) {
      const slotSubject = slotBookings[0].subject_id;
      const bookingCount = Number(slotBookings[0].booking_count);

      if (slotSubject !== sessionRequest.subject_id) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'This slot is reserved for another subject' });
      }

      if (bookingCount > MAX_CAPACITY) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'This slot exceeds maximum capacity' });
      }
    }

    await connection.query(
      `UPDATE session_requests SET status = 'accepted' WHERE id = ?`,
      [requestId]
    );

    const [sessionResult] = await connection.query(
      `INSERT INTO sessions
       (session_request_id, student_id, tutor_id, subject_id, scheduled_date, scheduled_time, duration_minutes, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        sessionRequest.student_id,
        sessionRequest.tutor_id,
        sessionRequest.subject_id,
        sessionRequest.requested_date,
        sessionRequest.requested_time,
        60,
        sessionRequest.notes
      ]
    );
    const sessionId = sessionResult.insertId;
    await connection.commit();
    transactionStarted = false;

    const session = await Session.findById(sessionId);
    const student = await User.findById(sessionRequest.student_id);

    // ==========================================
    // 📧 2. EMAIL TRIGGER: REQUEST ACCEPTED
    // ==========================================
    try {
      const emailStudentData = {
        email: student.email,
        first_name: `${student.first_name}`
      };

      const emailSessionData = {
        tutor_name: `${req.user.first_name} ${req.user.last_name}`, // Uses tutor's details from JWT
        scheduled_date: session.scheduled_date,
        scheduled_time: session.scheduled_time,
        duration_minutes: session.duration_minutes
      };

      await emailService.sendRequestAcceptedEmail(emailStudentData, emailSessionData);
    } catch (emailError) {
      console.error("Non-fatal: Failed to send accepted email:", emailError);
    }

    res.status(200).json({ success: true, message: 'Request accepted successfully', data: { session } });
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }
    next(error);
  } finally {
    connection.release();
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ success: false, message: 'Only tutors can reject requests' });

    const { requestId } = req.params;
    const sessionRequest = await SessionRequest.findById(requestId);

    if (!sessionRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (sessionRequest.tutor_id !== req.user.id) return res.status(403).json({ success: false, message: 'You can only reject your own requests' });
    if (sessionRequest.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    await SessionRequest.updateStatus(requestId, 'rejected');

    const student = await User.findById(sessionRequest.student_id);

    // ==========================================
    // 📧 3. EMAIL TRIGGER: REQUEST REJECTED
    // ==========================================
    try {
      const emailStudentData = {
        email: student.email,
        first_name: `${student.first_name} ${student.last_name}`
      };

      await emailService.sendRequestRejectedEmail(emailStudentData, sessionRequest);
    } catch (emailError) {
      console.error("Non-fatal: Failed to send rejected email:", emailError);
    }

    res.status(200).json({ success: true, message: 'Request rejected' });
  } catch (error) {
    next(error);
  }
};

const suggestAlternateDate = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ success: false, message: 'Only tutors can suggest alternate dates' });

    const { requestId } = req.params;
    const { suggested_date, suggested_time } = req.body;

    const sessionRequest = await SessionRequest.findById(requestId);

    if (!sessionRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (sessionRequest.tutor_id !== req.user.id) return res.status(403).json({ success: false, message: 'You can only modify your own requests' });
    if (sessionRequest.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    await SessionRequest.updateStatus(requestId, 'pending', { suggested_date, suggested_time });

    const updatedRequest = await SessionRequest.findById(requestId);
    const student = await User.findById(sessionRequest.student_id);

    // ==========================================
    // 📧 4. EMAIL TRIGGER: ALTERNATE DATE
    // ==========================================
    try {
      const emailStudentData = {
        email: student.email,
        first_name: `${student.first_name} ${student.last_name}`
      };

      await emailService.sendAlternateDateEmail(emailStudentData, updatedRequest);
    } catch (emailError) {
      console.error("Non-fatal: Failed to send alternate date email:", emailError);
    }

    res.status(200).json({ success: true, message: 'Alternate date suggested successfully', data: { sessionRequest: updatedRequest } });
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
      return res.status(403).json({ success: false, message: 'Invalid role' });
    }
    res.status(200).json({ success: true, data: { sessions, count: sessions.length } });
  } catch (error) {
    next(error);
  }
};

const getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.student_id !== req.user.id && session.tutor_id !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });

    res.status(200).json({ success: true, data: { session } });
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
