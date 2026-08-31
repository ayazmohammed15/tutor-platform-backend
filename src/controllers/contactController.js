const { pool } = require('../config/database');

exports.createContactInquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      userType,
      subjectInterest,
      message
    } = req.body;

    // Basic validation
    if (!name || !email || !phone || !userType || !subjectInterest) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, user type and course/exam focus are required'
      });
    }

    // Generate ticket ID
    const ticketId = `SE-${Math.floor(100000 + Math.random() * 900000)}`;

    const [result] = await pool.query(
      `
      INSERT INTO contact_inquiries
      (
        ticket_id,
        name,
        email,
        phone,
        user_type,
        subject_interest,
        message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        ticketId,
        name.trim(),
        email.trim(),
        phone.trim(),
        userType,
        subjectInterest,
        message?.trim() || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Contact inquiry submitted successfully',
      data: {
        id: result.insertId,
        ticket_id: ticketId
      }
    });

  } catch (error) {
    console.error('Create contact inquiry error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact inquiry'
    });
  }
};