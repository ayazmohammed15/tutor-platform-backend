const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/config');

const razorpayInstance = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret
});

const createOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: receipt
    };

    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    throw new Error(`Razorpay order creation failed: ${error.message}`);
  }
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(text)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    return false;
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature
};
