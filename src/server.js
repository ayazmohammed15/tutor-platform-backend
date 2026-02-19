const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const config = require('./config/config');
const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/admin.routes');
const boardRoutes = require('./routes/boardRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use("/uploads", express.static("uploads"));


app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student-Tutor Booking Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tutors: '/api/tutors',
      availability: '/api/availability',
      sessions: '/api/sessions',
      payments: '/api/payments'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/sessions', sessionRoutes);
// app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/boards', boardRoutes);



app.use(notFound);
app.use(errorHandler);

const PORT = config.port || 5000;

const startServer = async () => {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${config.node_env}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/\n`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
