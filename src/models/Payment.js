const { pool } = require('../config/database');

class Payment {
  static async create(paymentData) {
    const {
      session_id,
      student_id,
      amount,
      currency,
      razorpay_order_id,
      payment_method = null
    } = paymentData;

    const [result] = await pool.query(
      'INSERT INTO payments (session_id, student_id, amount, currency, razorpay_order_id, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [session_id, student_id, amount, currency, razorpay_order_id, payment_method]
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
    const {
      razorpay_payment_id,
      razorpay_signature,
      status,
      payment_method = null
    } = paymentData;

    const [result] = await pool.query(
      'UPDATE payments SET razorpay_payment_id = ?, razorpay_signature = ?, status = ?, payment_method = COALESCE(?, payment_method) WHERE razorpay_order_id = ?',
      [razorpay_payment_id, razorpay_signature, status, payment_method, orderId]
    );

    return result.affectedRows > 0;
  }

  static async updatePaymentMethod(orderId, paymentMethod) {
    const [result] = await pool.query(
      'UPDATE payments SET payment_method = ? WHERE razorpay_order_id = ?',
      [paymentMethod, orderId]
    );

    return result.affectedRows > 0;
  }
}

module.exports = Payment;
