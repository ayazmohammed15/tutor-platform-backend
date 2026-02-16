# API Documentation

Base URL: `http://localhost:5000`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user (student or tutor).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "1234567890",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**POST** `/api/auth/login`

Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Profile

**GET** `/api/auth/profile`

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "phone": "1234567890",
      "role": "student",
      "is_verified": false,
      "is_active": true
    }
  }
}
```

### 4. Update Profile

**PUT** `/api/auth/profile`

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "full_name": "John Updated",
  "phone": "9876543210"
}
```

---

## Tutor Endpoints

### 1. Create Tutor Profile

**POST** `/api/tutors/profile`

Create tutor profile (tutors only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bio": "Experienced math tutor with 5 years of experience",
  "education": "B.Sc Mathematics, M.Sc Mathematics",
  "experience_years": 5,
  "hourly_rate": 500,
  "subjects": "Mathematics, Physics, Chemistry"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tutor profile created successfully. Pending admin approval.",
  "data": {
    "profile": {
      "id": 1,
      "user_id": 2,
      "bio": "Experienced math tutor...",
      "education": "B.Sc Mathematics...",
      "experience_years": 5,
      "hourly_rate": 500,
      "approval_status": "pending"
    }
  }
}
```

### 2. Get My Tutor Profile

**GET** `/api/tutors/profile/me`

Get logged-in tutor's profile.

**Headers:** `Authorization: Bearer <token>`

### 3. Update Tutor Profile

**PUT** `/api/tutors/profile`

Update tutor profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bio": "Updated bio",
  "hourly_rate": 600
}
```

### 4. Get Pending Tutors (Admin Only)

**GET** `/api/tutors/pending`

Get all pending tutor applications.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "tutors": [],
    "count": 0
  }
}
```

### 5. Approve Tutor (Admin Only)

**PUT** `/api/tutors/:tutorId/approve`

Approve a tutor.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Tutor approved successfully"
}
```

### 6. Reject Tutor (Admin Only)

**PUT** `/api/tutors/:tutorId/reject`

Reject a tutor.

**Headers:** `Authorization: Bearer <token>`

### 7. Search Tutors

**GET** `/api/tutors/search?class_name=10&chapter_name=Algebra&topic_name=Quadratic`

Search approved tutors by filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `class_name` (optional)
- `chapter_name` (optional)
- `topic_name` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "tutors": [
      {
        "id": 1,
        "user_id": 2,
        "full_name": "Jane Tutor",
        "email": "tutor@example.com",
        "bio": "Experienced tutor...",
        "hourly_rate": 500
      }
    ],
    "count": 1
  }
}
```

### 8. Get Tutor Details

**GET** `/api/tutors/:tutorId`

Get detailed information about a specific tutor.

**Headers:** `Authorization: Bearer <token>`

---

## Availability Endpoints

### 1. Create Availability Slot

**POST** `/api/availability`

Create availability slot (tutors only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "day_of_week": "Monday",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability slot created successfully",
  "data": {
    "slot": {
      "id": 1,
      "tutor_id": 2,
      "day_of_week": "Monday",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "is_available": true
    }
  }
}
```

### 2. Get My Slots

**GET** `/api/availability/my-slots`

Get logged-in tutor's availability slots.

**Headers:** `Authorization: Bearer <token>`

### 3. Get Tutor Slots

**GET** `/api/availability/tutor/:tutorId`

Get availability slots for a specific tutor.

**Headers:** `Authorization: Bearer <token>`

### 4. Update Slot

**PUT** `/api/availability/:slotId`

Update availability slot.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "start_time": "10:00",
  "end_time": "12:00",
  "is_available": true
}
```

### 5. Delete Slot

**DELETE** `/api/availability/:slotId`

Delete availability slot.

**Headers:** `Authorization: Bearer <token>`

---

## Session Endpoints

### 1. Create Session Request

**POST** `/api/sessions/requests`

Create a session request (students only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tutor_id": 2,
  "subject_id": 1,
  "requested_date": "2024-01-15",
  "requested_time": "10:00",
  "notes": "Need help with quadratic equations"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session request sent successfully",
  "data": {
    "sessionRequest": {
      "id": 1,
      "student_id": 1,
      "tutor_id": 2,
      "requested_date": "2024-01-15",
      "requested_time": "10:00:00",
      "status": "pending"
    }
  }
}
```

### 2. Get My Requests

**GET** `/api/sessions/requests/my`

Get all session requests (students see their requests, tutors see requests for them).

**Headers:** `Authorization: Bearer <token>`

### 3. Get Pending Requests

**GET** `/api/sessions/requests/pending`

Get pending requests (tutors only).

**Headers:** `Authorization: Bearer <token>`

### 4. Accept Request

**PUT** `/api/sessions/requests/:requestId/accept`

Accept a session request (tutors only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Request accepted successfully",
  "data": {
    "session": {
      "id": 1,
      "student_id": 1,
      "tutor_id": 2,
      "scheduled_date": "2024-01-15",
      "scheduled_time": "10:00:00",
      "status": "scheduled"
    }
  }
}
```

### 5. Reject Request

**PUT** `/api/sessions/requests/:requestId/reject`

Reject a session request (tutors only).

**Headers:** `Authorization: Bearer <token>`

### 6. Suggest Alternate Date

**PUT** `/api/sessions/requests/:requestId/suggest`

Suggest an alternate date (tutors only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "suggested_date": "2024-01-16",
  "suggested_time": "11:00"
}
```

### 7. Get My Sessions

**GET** `/api/sessions`

Get all sessions (students see their sessions, tutors see sessions they're teaching).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "student_id": 1,
        "tutor_id": 2,
        "scheduled_date": "2024-01-15",
        "scheduled_time": "10:00:00",
        "status": "paid",
        "zoom_meeting_link": "https://zoom.us/j/123456789",
        "zoom_password": "abc123"
      }
    ],
    "count": 1
  }
}
```

### 8. Get Session Details

**GET** `/api/sessions/:sessionId`

Get detailed information about a specific session.

**Headers:** `Authorization: Bearer <token>`

---

## Payment Endpoints

### 1. Create Payment Order

**POST** `/api/payments/create-order/:sessionId`

Create Razorpay order for a session (students only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_123456789",
    "amount": 500,
    "currency": "INR",
    "keyId": "rzp_test_key"
  }
}
```

### 2. Verify Payment

**POST** `/api/payments/verify`

Verify payment and complete session booking (students only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "razorpay_order_id": "order_123456789",
  "razorpay_payment_id": "pay_987654321",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and session confirmed",
  "data": {
    "session": {
      "id": 1,
      "status": "paid",
      "zoom_meeting_link": "https://zoom.us/j/123456789",
      "zoom_meeting_id": "123456789",
      "zoom_password": "abc123"
    }
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Payment Integration Flow

1. **Student accepts session and clicks "Pay Now"**
2. **Frontend calls** `POST /api/payments/create-order/:sessionId`
3. **Backend creates Razorpay order and returns order details**
4. **Frontend displays Razorpay checkout modal**
5. **Student completes payment on Razorpay**
6. **Razorpay returns payment details to frontend**
7. **Frontend calls** `POST /api/payments/verify` with payment details
8. **Backend verifies signature, updates payment status, creates Zoom meeting**
9. **Backend sends emails with Zoom link to both student and tutor**

---

## Workflow Example

### Complete Student Booking Flow

1. **Register as student**
   ```bash
   POST /api/auth/register
   ```

2. **Login**
   ```bash
   POST /api/auth/login
   ```

3. **Search for tutors**
   ```bash
   GET /api/tutors/search?class_name=10&topic_name=Algebra
   ```

4. **View tutor details and availability**
   ```bash
   GET /api/tutors/:tutorId
   GET /api/availability/tutor/:tutorId
   ```

5. **Send session request**
   ```bash
   POST /api/sessions/requests
   ```

6. **Wait for tutor to accept**

7. **Check session status**
   ```bash
   GET /api/sessions
   ```

8. **Create payment order**
   ```bash
   POST /api/payments/create-order/:sessionId
   ```

9. **Complete payment on Razorpay**

10. **Verify payment**
    ```bash
    POST /api/payments/verify
    ```

11. **Receive Zoom link and join session**

---

## Notes

- All dates should be in `YYYY-MM-DD` format
- All times should be in `HH:MM` format (24-hour)
- JWT tokens expire after 7 days by default
- Email notifications are sent automatically for all major actions
