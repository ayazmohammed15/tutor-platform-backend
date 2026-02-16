# Project Structure

## Overview
This is a complete production-ready Student-Tutor Booking Platform backend built with Node.js, Express.js, and MySQL.

## Directory Structure

```
student-tutor-booking-platform/
├── src/
│   ├── config/
│   │   ├── config.js                    # Environment variables configuration
│   │   └── database.js                  # MySQL connection pool setup
│   │
│   ├── controllers/
│   │   ├── authController.js            # Authentication logic (register, login, profile)
│   │   ├── tutorController.js           # Tutor profile and approval management
│   │   ├── availabilityController.js    # Tutor availability slots management
│   │   ├── sessionController.js         # Session request and booking workflow
│   │   └── paymentController.js         # Payment processing and Zoom integration
│   │
│   ├── models/
│   │   ├── User.js                      # User model with authentication methods
│   │   ├── TutorProfile.js              # Tutor profile with search functionality
│   │   ├── AvailabilitySlot.js          # Tutor availability time slots
│   │   ├── SessionRequest.js            # Student booking requests to tutors
│   │   ├── Session.js                   # Confirmed tutoring sessions
│   │   └── Payment.js                   # Payment records and transactions
│   │
│   ├── routes/
│   │   ├── authRoutes.js                # Authentication endpoints
│   │   ├── tutorRoutes.js               # Tutor management endpoints
│   │   ├── availabilityRoutes.js        # Availability endpoints
│   │   ├── sessionRoutes.js             # Session and booking endpoints
│   │   └── paymentRoutes.js             # Payment endpoints
│   │
│   ├── middleware/
│   │   ├── auth.js                      # JWT authentication & role-based authorization
│   │   ├── errorHandler.js              # Centralized error handling
│   │   └── validate.js                  # Request validation middleware
│   │
│   ├── services/
│   │   ├── emailService.js              # Email notification service (Nodemailer)
│   │   ├── razorpayService.js           # Razorpay payment integration
│   │   └── zoomService.js               # Zoom meeting link generation
│   │
│   ├── utils/
│   │   ├── jwt.js                       # JWT token generation and verification
│   │   └── validators.js                # Express-validator validation rules
│   │
│   ├── database/
│   │   ├── init.js                      # Programmatic database initialization
│   │   └── migrations/
│   │       ├── schema.sql               # Complete database schema
│   │       └── seed_subjects.sql        # Sample subjects data
│   │
│   └── server.js                        # Main application entry point
│
├── setup.js                             # Database setup script
├── package.json                         # Dependencies and scripts
├── .env                                 # Environment variables (not in git)
├── .env.example                         # Environment variables template
├── .gitignore                           # Git ignore rules
├── README.md                            # Complete setup documentation
├── API_DOCUMENTATION.md                 # Detailed API endpoints documentation
└── PROJECT_STRUCTURE.md                 # This file

```

## Key Features by Module

### Authentication Module
- User registration with email verification
- Secure login with JWT tokens
- Password hashing with bcrypt
- Profile management
- Role-based access control (Student, Tutor, Admin)

### Tutor Management Module
- Tutor profile creation
- Admin approval workflow
- Profile updates
- Search and filtering by class/chapter/topic
- Tutor details view

### Availability Module
- Create availability slots by day and time
- Update and delete slots
- View tutor availability calendar
- Day-wise time slot management

### Session Booking Module
- Student creates session request
- Tutor receives email notification
- Three tutor actions: Accept, Reject, Suggest alternate date
- Session state management
- Request and session history

### Payment Module
- Razorpay order creation
- Secure payment verification
- Signature validation
- Payment status tracking
- Integration with session workflow

### Zoom Integration
- Automatic meeting creation after payment
- Meeting details storage
- Email delivery of meeting links
- Support for scheduled sessions

### Email Notifications
- Welcome emails on registration
- Tutor approval/rejection notifications
- New session request alerts
- Request acceptance/rejection emails
- Alternate date suggestions
- Payment confirmation with Zoom links
- Session reminders

## Database Schema

### Core Tables

1. **users**
   - Primary user accounts
   - Fields: id, email, password, full_name, phone, role, is_verified, is_active
   - Roles: student, tutor, admin

2. **tutor_profiles**
   - Extended tutor information
   - Fields: bio, education, experience_years, hourly_rate, approval_status
   - Linked to users table

3. **subjects**
   - Course taxonomy
   - Fields: class_name, chapter_name, topic_name

4. **tutor_subjects**
   - Many-to-many relationship
   - Links tutors to subjects they teach

5. **availability_slots**
   - Tutor schedule
   - Fields: day_of_week, start_time, end_time, is_available

6. **session_requests**
   - Booking requests from students
   - Status: pending, accepted, rejected, cancelled

7. **sessions**
   - Confirmed sessions
   - Status: scheduled, paid, completed, cancelled
   - Includes Zoom meeting details

8. **payments**
   - Payment transactions
   - Razorpay integration fields
   - Status: pending, completed, failed, refunded

9. **notifications**
   - System and email notifications log

## Security Features

- JWT-based authentication
- bcrypt password hashing (10 salt rounds)
- Role-based authorization middleware
- Input validation with express-validator
- SQL injection prevention (parameterized queries)
- Razorpay signature verification
- Environment variable protection
- CORS configuration

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...]
}
```

## Workflow State Machines

### Session Request States
```
pending → accepted → (creates session)
pending → rejected
pending → pending (with suggested date)
```

### Session States
```
scheduled → paid → completed
scheduled → cancelled
```

### Payment States
```
pending → completed
pending → failed
completed → refunded
```

### Tutor Approval States
```
pending → approved
pending → rejected
```

## Environment Variables

Required configuration:
- Database: Host, user, password, name, port
- JWT: Secret key, expiration time
- Email: SMTP credentials
- Razorpay: Key ID and secret
- Zoom: OAuth credentials
- Frontend: URL for CORS

## NPM Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run setup` - Initialize database with schema and seed data
- `npm test` - Run tests (placeholder)

## Dependencies

### Core
- express - Web framework
- mysql2 - MySQL client with promises
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- dotenv - Environment variables

### Integration
- razorpay - Payment gateway
- axios - HTTP client for Zoom API
- nodemailer - Email service

### Utilities
- cors - Cross-origin resource sharing
- morgan - HTTP request logger
- express-validator - Request validation

### Development
- nodemon - Auto-restart on file changes

## Error Handling

Centralized error handling with:
- Custom error messages
- HTTP status codes
- Validation error formatting
- Development vs production error details
- Console logging

## Validation Rules

All endpoints validate:
- Required fields
- Data types
- Format (email, date, time)
- Length constraints
- Role permissions

## Email Templates

Automated emails for:
1. User registration welcome
2. Tutor approval/rejection
3. New session request
4. Request acceptance
5. Request rejection
6. Alternate date suggestion
7. Payment success
8. Session confirmation with Zoom link

## Future Enhancements

Potential additions:
- User profile pictures upload
- Session ratings and reviews
- Advanced search filters
- Real-time notifications (WebSocket)
- Session recording storage
- Analytics dashboard
- Refund management
- Automated session reminders
- Mobile app integration
- Chat between student and tutor
