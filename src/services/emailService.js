const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: config.email.from,
      to: to,
      subject: subject,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to ScienceEdu!';
  const html = `
    <h2>Welcome ${user.first_name}! 👋</h2>
    <p>Thank you for registering on our platform.</p>
    <p>Your student account is now active. You can start browsing subjects, viewing tutor profiles, and booking your first session right away!</p>
    <br/>
    <p>Best regards,<br>The ScienceEdu Team</p>
  `;
  console.log("Sending welcome email to:", user.email);

  return await sendEmail(user.email, subject, html);
};

const sendTutorApprovalEmail = async (tutor, status) => {
  const subject = status === 'approved' ? 'Profile Approved!' : 'Profile Status Update';
  const html = `
    <h2>Hello ${tutor.first_name},</h2>
    <p>Your tutor profile has been <strong>${status}</strong>.</p>
    ${status === 'approved' ? '<p>You can now start receiving booking requests from students!</p>' : '<p>Please contact support for more information.</p>'}
    <p>Best regards,<br>Tutor Booking Team</p>
  `;

  return await sendEmail(tutor.email, subject, html);
};

const sendSessionRequestEmail = async (tutor, sessionRequest) => {
  const subject = 'New Session Request';
  const html = `
    <h2>Hello ${tutor.first_name},</h2>
    <p>You have received a new session request from <strong>${sessionRequest.student_name}</strong>.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Date: ${sessionRequest.requested_date}</li>
      <li>Time: ${sessionRequest.requested_time}</li>
      ${sessionRequest.class_name ? `<li>Subject: ${sessionRequest.class_name} - ${sessionRequest.topic_name}</li>` : ''}
    </ul>
    <p>Please log in to your dashboard to accept, reject, or suggest an alternate date.</p>
    <p>Best regards,<br>Tutor Booking Team</p>
  `;

  return await sendEmail(tutor.email, subject, html);
};

const sendRequestAcceptedEmail = async (student, session) => {
  const subject = 'Session Request Accepted!';
  const html = `
    <h2>Great News ${student.first_name}!</h2>
    <p>Your session request has been <strong>accepted</strong> by ${session.tutor_name}.</p>
    <p><strong>Session Details:</strong></p>
    <ul>
      <li>Date: ${session.scheduled_date}</li>
      <li>Time: ${session.scheduled_time}</li>
      <li>Duration: ${session.duration_minutes} minutes</li>
    </ul>
    <p>Please proceed to payment to confirm your session.</p>
    <p>Best regards,<br>Tutor Booking Team</p>
  `;

  return await sendEmail(student.email, subject, html);
};

const sendRequestRejectedEmail = async (student, sessionRequest) => {
  const subject = 'Session Request Update';
  const html = `
    <h2>Hello ${student.first_name},</h2>
    <p>Unfortunately, your session request for ${sessionRequest.requested_date} at ${sessionRequest.requested_time} has been declined by the tutor.</p>
    <p>Please try booking with another tutor or choose a different time slot.</p>
    <p>Best regards,<br>Tutor Booking Team</p>
  `;

  return await sendEmail(student.email, subject, html);
};

const sendAlternateDateEmail = async (student, sessionRequest) => {
  const subject = 'Alternate Date Suggested';
  const html = `
    <h2>Hello ${student.first_name},</h2>
    <p>The tutor has suggested an alternate date for your session:</p>
    <ul>
      <li>Suggested Date: ${sessionRequest.suggested_date}</li>
      <li>Suggested Time: ${sessionRequest.suggested_time}</li>
    </ul>
    <p>Please review and respond accordingly.</p>
    <p>Best regards,<br>Tutor Booking Team</p>
  `;

  return await sendEmail(student.email, subject, html);
};

const sendPaymentSuccessEmail = async (student, session) => {
  const subject = 'Payment Successful - Session Confirmed';
  const html = `
    <h2>Payment Confirmed ${student.first_name}!</h2>
    <p>Your payment has been processed successfully.</p>
    <p><strong>Session Details:</strong></p>
    <ul>
      <li>Tutor: ${session.tutor_name}</li>
      <li>Date: ${session.scheduled_date}</li>
      <li>Time: ${session.scheduled_time}</li>
      <li>Duration: ${session.duration_minutes} minutes</li>
      ${session.zoom_meeting_link ? `<li>Zoom Link: <a href="${session.zoom_meeting_link}">Join Meeting</a></li>` : ''}
      ${session.zoom_password ? `<li>Meeting Password: ${session.zoom_password}</li>` : ''}
    </ul>
    <p>Please join the meeting at the scheduled time.</p>
    <p>Best regards,<br>Tutor Booking Team</p>
  `;

  return await sendEmail(student.email, subject, html);
};

const sendSessionConfirmationEmail = async (tutor, session) => {
  const subject = 'Session Payment Confirmed';
  const html = `
    <h2>Hello ${tutor.first_name},</h2>
    <p>The student has completed payment for the upcoming session.</p>
    <p><strong>Session Details:</strong></p>
    <ul>
      <li>Student: ${session.student_name}</li>
      <li>Date: ${session.scheduled_date}</li>
      <li>Time: ${session.scheduled_time}</li>
      <li>Duration: ${session.duration_minutes} minutes</li>
      ${session.zoom_meeting_link ? `<li>Zoom Link: <a href="${session.zoom_meeting_link}">Start Meeting</a></li>` : ''}
      ${session.zoom_password ? `<li>Meeting Password: ${session.zoom_password}</li>` : ''}
    </ul>
    <p>Please be ready to start the session at the scheduled time.</p>
    <p>Best regards,<br>Tutor Booking Team</p>
  `;

  return await sendEmail(tutor.email, subject, html);
};

module.exports = {
  sendWelcomeEmail,
  sendTutorApprovalEmail,
  sendSessionRequestEmail,
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
  sendAlternateDateEmail,
  sendPaymentSuccessEmail,
  sendSessionConfirmationEmail,
  sendEmail
};
