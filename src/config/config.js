require('dotenv').config();

module.exports = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: process.env.DB_PORT
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d'
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
  },

  zoom: {
    apiKey: process.env.ZOOM_API_KEY,
    apiSecret: process.env.ZOOM_API_SECRET,
    accountId: process.env.ZOOM_ACCOUNT_ID,
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};
