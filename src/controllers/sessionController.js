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

    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const course_id = student.course_id ? parseInt(student.course_id, 10) : null;
    const class_id = student.class_id ? parseInt(student.class_id, 10) : null;

    // Build tutor eligibility query dynamically to allow students without a configured course
    let eligibilitySql = `SELECT tp.id
       FROM tutor_profiles tp
       JOIN tutor_courses tc ON tc.tutor_profile_id = tp.id
       WHERE tp.user_id = ?
         AND tp.is_approved = 1
         AND tp.approval_status = 'approved'`;
    const eligibilityParams = [tutor_id];

    if (course_id !== null) {
      eligibilitySql += ` AND tc.course_id = ?`;
      eligibilityParams.push(course_id);
    }

    if (subject_id !== null) {
      eligibilitySql += ` AND tp.subject_id = ?`;
      eligibilityParams.push(subject_id);
    }

    eligibilitySql += ` LIMIT 1`;

    const [tutorEligibility] = await connection.query(eligibilitySql, eligibilityParams);

    if (tutorEligibility.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This tutor is not available for your course or subject'
      });
    }

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

  const SESSION_DURATION = block.slot_duration; // 60
  const GAP = 15; // minutes

  while (true) {
    const [h, m] = current.split(':').map(Number);

    // session end time
    const sessionEnd = new Date(0, 0, 0, h, m + SESSION_DURATION);
    const sessionEndStr = sessionEnd.toTimeString().slice(0, 5);

    if (sessionEndStr > end) break;

    validSlots.push(current);
    // next slot = session end + gap
    const nextStart = new Date(0, 0, 0, h, m + SESSION_DURATION + GAP);
    current = nextStart.toTimeString().slice(0, 5);
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
  `SELECT 
  sr.subject_id,
  sr.course_id,
  co.course_name,
  COUNT(*) as booking_count
FROM session_requests sr
LEFT JOIN courses co ON sr.course_id = co.id
WHERE sr.tutor_id = ?
AND sr.requested_date = ?
AND sr.requested_time = ?
AND sr.status IN ('pending','accepted')
GROUP BY sr.subject_id, sr.course_id
FOR UPDATE`,
  [tutor_id, requestedDateOnly, requested_time]
);

      if (slotBookings.length > 0) {
        if (slotBookings.length > 1) {
    await connection.rollback();
    return res.status(400).json({
      success: false,
      message: 'This slot has conflicting bookings. Please choose another slot'
    });
  }
        const slot = slotBookings[0]; // ✅ IMPORTANT

        const slotSubject = slot.subject_id;
        const bookingCount = Number(slot.booking_count);

        // subject check: if the incoming subject is null, only allow if slot also has null
        if (subject_id === null) {
          if (slotSubject !== null) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'This slot is already reserved for another subject'
            });
          }
        } else {
          if (slotSubject !== subject_id) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'This slot is already reserved for another subject'
            });
          }
        }

        // course check: if student has no course, only allow if slot's course is also null
        if (course_id === null) {
          if (slot.course_id !== null) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: `This slot is already booked for ${slot.course_name}`
            });
          }
        } else {
          if (slot.course_id !== course_id) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
               message: `This slot is already booked for ${slot.course_name}`
            });
          }
        }

        // capacity check
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

    console.log("INSERT VALUES:", {
  class_id,
  course_id,
  subject_id,
  type_class: typeof class_id,
  type_course: typeof course_id
});

    const [insertResult] = await connection.query(
      `INSERT INTO session_requests
(student_id, tutor_id, subject_id, class_id, course_id, requested_date, requested_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, tutor_id, subject_id, class_id, course_id, requestedDateOnly, requested_time, notes]
    );
    const requestId = insertResult.insertId;

    await connection.commit();

    const sessionRequest = await SessionRequest.findById(requestId);

    // ==========================================
    // 📧 1. EMAIL TRIGGER: NEW REQUEST TO TUTOR
    // ==========================================
    try {
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

      emailService.sendSessionRequestEmail(emailTutorData, emailSessionData)
        .then(() => console.log("Tutor request email queued"))
        .catch(emailError => console.error("Non-fatal: Failed to send request email to tutor:", emailError));
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
      `SELECT subject_id, course_id, COUNT(*) as booking_count
       FROM session_requests
       WHERE tutor_id = ?
         AND requested_date = ?
         AND requested_time = ?
         AND status IN ('pending','accepted')
       GROUP BY subject_id, course_id
       FOR UPDATE`,
      [sessionRequest.tutor_id, sessionRequest.requested_date, sessionRequest.requested_time]
    );

    if (slotBookings.length > 1) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Conflicting subjects exist for this slot' });
    }

    if (slotBookings.length === 1) {
      const slotSubject = slotBookings[0].subject_id;
      const slotCourse = slotBookings[0].course_id;
      const bookingCount = Number(slotBookings[0].booking_count);

      // subject check: sessionRequest.subject_id may be null
      if (sessionRequest.subject_id === null) {
        if (slotSubject !== null) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'This slot is reserved for another subject' });
        }
      } else {
        if (slotSubject !== sessionRequest.subject_id) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'This slot is reserved for another subject' });
        }
      }

      // course check: sessionRequest.course_id may be null
      if (sessionRequest.course_id === null) {
        if (slotCourse !== null) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'This slot is reserved for another course' });
        }
      } else {
        if (slotCourse !== sessionRequest.course_id) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'This slot is reserved for another course' });
        }
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

      emailService.sendRequestAcceptedEmail(emailStudentData, emailSessionData)
        .then(() => console.log("Accepted email queued"))
        .catch(emailError => console.error("Non-fatal: Failed to send accepted email:", emailError));
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

      emailService.sendRequestRejectedEmail(emailStudentData, sessionRequest)
        .then(() => console.log("Rejected email queued"))
        .catch(emailError => console.error("Non-fatal: Failed to send rejected email:", emailError));
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

      emailService.sendAlternateDateEmail(emailStudentData, updatedRequest)
        .then(() => console.log("Alternate date email queued"))
        .catch(emailError => console.error("Non-fatal: Failed to send alternate date email:", emailError));
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
