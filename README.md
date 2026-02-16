# Student-Tutor Booking Platform Backend

A complete production-ready backend for a Student-Tutor Booking Platform built with Node.js, Express.js, and MySQL. This system supports three user roles (student, tutor, and admin) with JWT authentication, session booking, payment processing, and automated Zoom meeting generation.

## Features

- **Multi-Role Authentication**: Student, Tutor, and Admin roles with JWT-based authentication
- **Tutor Management**: Admin approval system for tutors before they appear in search
- **Advanced Search**: Filter tutors by class, chapter, and topic
- **Availability Management**: Tutors can set their available time slots
- **Booking Workflow**: Complete session request flow with accept/reject/suggest alternate date
- **Payment Integration**: Razorpay payment gateway with signature verification
- **Zoom Integration**: Automatic meeting link generation after payment
- **Email Notifications**: Automated emails for registration, booking updates, and payment confirmation
- **Session Management**: Complete session lifecycle from request to completion

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT + bcrypt
- **Payment**: Razorpay
- **Video Conferencing**: Zoom API
- **Email**: Nodemailer
- **Validation**: express-validator

## Project Structure

```
src/
├── config/
│   ├── config.js           # Environment configuration
│   └── database.js         # MySQL connection pool
├── controllers/
│   ├── authController.js
│   ├── tutorController.js
│   ├── availabilityController.js
│   ├── sessionController.js
│   └── paymentController.js
├── models/
│   ├── User.js
│   ├── TutorProfile.js
│   ├── AvailabilitySlot.js
│   ├── SessionRequest.js
│   ├── Session.js
│   └── Payment.js
├── routes/
│   ├── authRoutes.js
│   ├── tutorRoutes.js
│   ├── availabilityRoutes.js
│   ├── sessionRoutes.js
│   └── paymentRoutes.js
├── middleware/
│   ├── auth.js             # JWT authentication & authorization
│   ├── errorHandler.js     # Centralized error handling
│   └── validate.js         # Request validation
├── services/
│   ├── emailService.js     # Email notifications
│   ├── razorpayService.js  # Payment processing
│   └── zoomService.js      # Zoom meeting creation
├── utils/
│   ├── jwt.js              # JWT utilities
│   └── validators.js       # Validation rules
├── database/
│   ├── migrations/
│   │   └── schema.sql      # Database schema
│   └── init.js             # Database initialization
└── server.js               # Main application entry point
```

## Database Schema

### Tables

1. **users** - Stores all user accounts (students, tutors, admins)
2. **tutor_profiles** - Extended profile information for tutors
3. **subjects** - Class, chapter, and topic combinations
4. **tutor_subjects** - Maps tutors to subjects they teach
5. **availability_slots** - Tutor availability schedule
6. **session_requests** - Student booking requests to tutors
7. **sessions** - Confirmed sessions after acceptance
8. **payments** - Payment records with Razorpay integration
9. **notifications** - System and email notifications

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Razorpay account and API keys
- Zoom account with OAuth credentials
- Gmail account for sending emails (or any SMTP provider)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd student-tutor-booking-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up MySQL database

```bash
mysql -u root -p
```

Then run the schema:

```sql
CREATE DATABASE tutor_booking_db;
USE tutor_booking_db;
SOURCE src/database/migrations/schema.sql;
```

Or use the Node.js initialization script:

```bash
node -e "require('./src/database/init').initializeDatabase()"
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tutor_booking_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@tutorbooking.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Zoom Configuration
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 5. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords (https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASSWORD`

### 6. Razorpay Setup

1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Generate Test/Live keys
4. Add them to your `.env` file

### 7. Zoom OAuth Setup

1. Go to https://marketplace.zoom.us
2. Develop → Build App → Server-to-Server OAuth
3. Create your app and get credentials
4. Add Account ID, Client ID, and Client Secret to `.env`

## Running the Application

### Development mode (with auto-restart)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
GET    /api/auth/profile           - Get user profile
PUT    /api/auth/profile           - Update user profile
```

### Tutors

```
POST   /api/tutors/profile         - Create tutor profile (tutor only)
GET    /api/tutors/profile/me      - Get my tutor profile
PUT    /api/tutors/profile         - Update tutor profile
GET    /api/tutors/pending         - Get pending tutors (admin only)
PUT    /api/tutors/:id/approve     - Approve tutor (admin only)
PUT    /api/tutors/:id/reject      - Reject tutor (admin only)
GET    /api/tutors/search          - Search tutors by filters
GET    /api/tutors/:id             - Get tutor details
```

### Availability

```
POST   /api/availability           - Create availability slot (tutor only)
GET    /api/availability/my-slots  - Get my slots (tutor only)
GET    /api/availability/tutor/:id - Get tutor's slots
PUT    /api/availability/:slotId   - Update slot
DELETE /api/availability/:slotId   - Delete slot
```

### Sessions

```
POST   /api/sessions/requests                  - Create session request (student only)
GET    /api/sessions/requests/my               - Get my requests
GET    /api/sessions/requests/pending          - Get pending requests (tutor only)
PUT    /api/sessions/requests/:id/accept       - Accept request (tutor only)
PUT    /api/sessions/requests/:id/reject       - Reject request (tutor only)
PUT    /api/sessions/requests/:id/suggest      - Suggest alternate date (tutor only)
GET    /api/sessions                           - Get my sessions
GET    /api/sessions/:id                       - Get session details
```

### Payments

```
POST   /api/payments/create-order/:sessionId   - Create Razorpay order (student only)
POST   /api/payments/verify                    - Verify payment (student only)
```

## Default Admin Account

A default admin account is created during database initialization:

```
Email: admin@tutorplatform.com
Password: admin123
```

**⚠️ Important**: Change this password immediately in production!

## Workflow

### Student Flow

1. Register as student
2. Search tutors by class/chapter/topic
3. View tutor details and availability
4. Send session request
5. Wait for tutor response
6. After acceptance, pay via Razorpay
7. Receive Zoom meeting link via email
8. Join session at scheduled time

### Tutor Flow

1. Register as tutor
2. Complete profile
3. Wait for admin approval
4. Set availability slots
5. Receive session requests
6. Accept/Reject/Suggest alternate date
7. Receive payment confirmation
8. Join Zoom session at scheduled time

### Admin Flow

1. Login with admin credentials
2. View pending tutor applications
3. Approve or reject tutors
4. Monitor platform activity

## Testing

### Register a Student

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "password123",
    "full_name": "Test Student",
    "phone": "1234567890",
    "role": "student"
  }'
```

### Register a Tutor

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tutor@test.com",
    "password": "password123",
    "full_name": "Test Tutor",
    "phone": "9876543210",
    "role": "tutor"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "password123"
  }'
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based authorization
- Input validation and sanitization
- SQL injection prevention
- Razorpay signature verification
- Secure environment variable management

## Error Handling

The application uses centralized error handling with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Email Notifications

Automated emails are sent for:

- User registration (welcome email)
- Tutor approval/rejection
- New session requests
- Request acceptance/rejection
- Alternate date suggestions
- Payment confirmation
- Session details with Zoom link

## Session States

Sessions follow this state transition:

```
pending → accepted → paid → completed
```

## Payment Flow

1. Student clicks "Pay Now"
2. Backend creates Razorpay order
3. Frontend displays Razorpay checkout
4. Student completes payment
5. Frontend sends payment details to backend
6. Backend verifies signature
7. Updates payment and session status
8. Generates Zoom meeting link
9. Sends confirmation emails to both parties

## Troubleshooting

### Database Connection Issues

- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Email Not Sending

- Enable "Less secure app access" (Gmail)
- Use App Password instead of regular password
- Check SMTP settings

### Zoom Meeting Creation Fails

- Verify Zoom credentials
- Check account permissions
- Ensure Server-to-Server OAuth is properly configured

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Enable SSL/TLS for database
4. Set up proper CORS origins
5. Use environment-specific database
6. Enable rate limiting
7. Set up logging and monitoring
8. Use PM2 or similar for process management

```bash
npm install -g pm2
pm2 start src/server.js --name tutor-platform
pm2 save
pm2 startup
```

## License

MIT

## Support

For issues and questions, please contact the development team or create an issue in the repository.
