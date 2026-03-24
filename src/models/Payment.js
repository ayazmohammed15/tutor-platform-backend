const { pool } = require('../config/database');

class Payment {
  static async create(paymentData) {
    const { session_id, student_id, amount, currency, razorpay_order_id } = paymentData;

    const [result] = await pool.query(
      'INSERT INTO payments (session_id, student_id, amount, currency, razorpay_order_id) VALUES (?, ?, ?, ?, ?)',
      [session_id, student_id, amount, currency, razorpay_order_id]
    );

    return result.insertId;
  }

  static async findByOrderId(orderId) {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE razorpay_order_id = ?',
      [orderId]
    );
    return rows[0];
  }

  static async findLatestBySessionId(sessionId) {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );
    return rows[0];
  }

  static async updatePaymentStatus(orderId, paymentData) {
    const { razorpay_payment_id, razorpay_signature, status } = paymentData;

    const [result] = await pool.query(
      'UPDATE payments SET razorpay_payment_id = ?, razorpay_signature = ?, status = ? WHERE razorpay_order_id = ?',
      [razorpay_payment_id, razorpay_signature, status, orderId]
    );

    return result.affectedRows > 0;
  }
}

module.exports = Payment;