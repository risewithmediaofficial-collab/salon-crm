# Salon CRM — REST API Documentation

This document describes the REST API endpoints provided by the Salon CRM backend service.

**Base URL**: `http://localhost:5000/api` (default development)  
**API Version**: v1  
**Content-Type**: `application/json`

---

## 1. Authentication & Security

### 1.1 Authentication Schemes
- **Bearer JWT**: Client sends standard `Authorization: Bearer <accessToken>` header.
- **Access Token Lifetime**: 15 minutes.
- **Refresh Token Lifetime**: 7 days.
- **Client Sanitization**: All inputs stripped of MongoDB operator injections (`$` and `.`) and trimmed.
- **Helmet Security Headers**: XSS, HSTS, Frameguard, noSniff enabled.

### 1.2 User Roles & Access Hierarchy
- `CUSTOMER`: Can view public services/staff/offers, calculate availability slots, book appointments, cancel own pending/confirmed appointments, view own invoices/notifications, submit reviews.
- `STAFF`: Salon specialists. Access to calendar, view appointments, update appointment status (`CONFIRMED`, `IN_SERVICE`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), view customer directory.
- `MANAGER`: Salon supervisor. Access to all staff capabilities plus billing management, creating invoices, applying discounts.
- `OWNER`: Full administrative access. Manage staff accounts, services, leaves, promotional offers, view financial/analytics reports, and audit logs.

### 1.3 Rate Limiting
- **Global**: 200 requests / 15 minutes per IP.
- **Auth Endpoints** (`/api/auth/staff/login`, `/api/auth/customer/verify-otp`): 10 requests / 15 minutes per IP.
- **OTP Send** (`/api/auth/customer/send-otp`): 3 requests / 10 minutes per phone number/IP.

---

## 2. Standard Response Envelope

### 2.1 Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive success message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 2.2 Error Response (`4xx` / `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The selected time slot is no longer available.",
    "details": [
      {
        "field": "startTime",
        "message": "Double-booking detected for specialist Rohit Verma at 14:00"
      }
    ]
  }
}
```

---

## 3. Endpoints Reference

### 3.1 Authentication (`/api/auth`)

#### `POST /api/auth/customer/send-otp`
Sends a 6-digit OTP to an Indian mobile number.
- **Access**: Public
- **Rate Limit**: 3 / 10 minutes
- **Request Body**:
  ```json
  { "phone": "9876543210" }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully to +919876543210",
    "data": { "phone": "9876543210" }
  }
  ```

#### `POST /api/auth/customer/verify-otp`
Verifies OTP code and returns access + refresh tokens.
- **Access**: Public
- **Request Body**:
  ```json
  { "phone": "9876543210", "otp": "123456", "name": "Priya Sharma" }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "_id": "60d0fe4f5311236168a109ca",
        "phone": "9876543210",
        "name": "Priya Sharma",
        "role": "CUSTOMER"
      }
    }
  }
  ```

#### `POST /api/auth/staff/login`
Staff/Admin password authentication.
- **Access**: Public
- **Request Body**:
  ```json
  { "email": "admin@salon.com", "password": "Password123!" }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "_id": "60d0fe4f5311236168a109cb",
        "email": "admin@salon.com",
        "name": "Salon Admin",
        "role": "OWNER"
      }
    }
  }
  ```

#### `POST /api/auth/refresh-token`
Generates a new access token using a valid refresh token.
- **Access**: Public
- **Request Body**:
  ```json
  { "refreshToken": "eyJhbGciOi..." }
  ```

#### `GET /api/auth/me`
Retrieves authenticated user profile.
- **Access**: Authenticated (`CUSTOMER`, `STAFF`, `MANAGER`, `OWNER`)

---

### 3.2 Appointments (`/api/appointments`)

#### `GET /api/appointments/availability`
Calculates available appointment start times based on staff shifts, approved leaves, service duration, and existing non-cancelled bookings.
- **Access**: Public or Authenticated
- **Query Parameters**:
  - `date`: `YYYY-MM-DD` (Required)
  - `serviceId`: Service ObjectId (Required)
  - `staffId`: Staff ObjectId (Optional — if omitted, checks any qualified specialist)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-10-02",
      "service": { "id": "...", "name": "Signature Haircut", "durationMinutes": 45 },
      "slots": [
        { "time": "10:00", "available": true, "staffId": "...", "staffName": "Priya Sharma" },
        { "time": "10:45", "available": true, "staffId": "...", "staffName": "Priya Sharma" }
      ]
    }
  }
  ```

#### `POST /api/appointments`
Book a new appointment. Runs atomic conflict check and transactional creation.
- **Access**: Authenticated (`CUSTOMER` or Staff booking for client)
- **Request Body**:
  ```json
  {
    "serviceId": "60d0fe4f5311236168a109d1",
    "staffId": "60d0fe4f5311236168a109e2",
    "date": "2026-10-02",
    "startTime": "14:00",
    "notes": "Prefers warm rinse",
    "offerCode": "FESTIVE20"
  }
  ```

#### `GET /api/appointments`
Lists appointments with status filtering, date range, pagination.
- **Access**: Authenticated (Customers see only their own; Staff see salon-wide)
- **Query Parameters**: `status`, `startDate`, `endDate`, `staffId`, `page`, `limit`

#### `PATCH /api/appointments/:id/status`
Transition appointment state through legal state machine (`PENDING` -> `CONFIRMED` -> `IN_SERVICE` -> `COMPLETED`, `CANCELLED`, `NO_SHOW`).
- **Access**: `STAFF`, `MANAGER`, `OWNER`
- **Request Body**:
  ```json
  { "status": "IN_SERVICE", "notes": "Customer arrived on time" }
  ```

#### `POST /api/appointments/:id/cancel`
Cancel an appointment.
- **Access**: Owner of appointment or Staff
- **Request Body**:
  ```json
  { "cancellationReason": "Client requested reschedule" }
  ```

#### `POST /api/appointments/:id/review`
Submits a rating and optional text review for a `COMPLETED` appointment.
- **Access**: `CUSTOMER` (only on own completed appointments)
- **Request Body**:
  ```json
  { "rating": 5, "comment": "Outstanding styling by Priya!" }
  ```

---

### 3.3 Services (`/api/services`)

#### `GET /api/services`
Lists active salon services with optional category filtering.
- **Access**: Public
- **Query Parameters**: `category`, `search`, `isActive`

#### `POST /api/services`
Creates a new service menu item.
- **Access**: `OWNER`
- **Request Body**:
  ```json
  {
    "name": "Balayage Highlights",
    "category": "HAIR",
    "durationMinutes": 120,
    "price": 4500,
    "description": "Full hand-painted natural dimension",
    "isActive": true
  }
  ```

#### `PATCH /api/services/:id`
Updates existing service parameters.
- **Access**: `OWNER`

#### `DELETE /api/services/:id`
Soft deletes / deactivates a service.
- **Access**: `OWNER`

---

### 3.4 Staff (`/api/staff`)

#### `GET /api/staff`
Lists salon specialists, their specialties, working days, and ratings.
- **Access**: Public
- **Query Parameters**: `isActive`, `specialization`

#### `POST /api/staff`
Registers a new specialist staff member.
- **Access**: `OWNER`
- **Request Body**:
  ```json
  {
    "name": "Deepak Mehta",
    "phone": "9811223344",
    "email": "deepak@salon.com",
    "specialties": ["HAIR", "BEARD"],
    "workingHours": {
      "start": "10:00",
      "end": "19:00",
      "daysOff": [1]
    }
  }
  ```

#### `POST /api/staff/:id/leaves`
Records approved leave dates for staff availability exclusion.
- **Access**: `OWNER`
- **Request Body**:
  ```json
  {
    "startDate": "2026-10-15",
    "endDate": "2026-10-17",
    "reason": "Family vacation"
  }
  ```

#### `DELETE /api/staff/:id/leaves/:leaveId`
Revokes an approved leave record.
- **Access**: `OWNER`

---

### 3.5 Billing & Invoicing (`/api/billing`)

#### `POST /api/billing/validate-offer`
Validates a promotional code against cart/service items and calculates discount preview.
- **Access**: Authenticated
- **Request Body**:
  ```json
  { "code": "WELCOME10", "subtotal": 1200, "serviceIds": ["..."] }
  ```

#### `GET /api/billing`
Lists invoices with filters for date range, payment status, customer.
- **Access**: `STAFF`, `MANAGER`, `OWNER`
- **Query Parameters**: `status`, `startDate`, `endDate`, `page`, `limit`

#### `GET /api/billing/:id`
Retrieves full invoice details with line items, tax breakdown, and payment logs.
- **Access**: Invoice customer or `STAFF`/`MANAGER`/`OWNER`

#### `POST /api/billing/:id/pay`
Records payment receipt against an invoice.
- **Access**: `STAFF`, `MANAGER`, `OWNER`
- **Request Body**:
  ```json
  {
    "method": "UPI",
    "amount": 1416,
    "transactionReference": "UPI-IND-8839201"
  }
  ```

---

### 3.6 Promotional Offers (`/api/offers`)

#### `GET /api/offers`
Lists active promotional campaigns.
- **Access**: Public / Authenticated

#### `POST /api/offers`
Creates a promotional discount campaign.
- **Access**: `OWNER`
- **Request Body**:
  ```json
  {
    "code": "FESTIVE25",
    "title": "Festive Glow Package",
    "discountType": "PERCENTAGE",
    "discountValue": 25,
    "minOrderValue": 1000,
    "maxDiscount": 500,
    "validUntil": "2026-11-15T23:59:59.000Z",
    "isActive": true
  }
  ```

---

### 3.7 Reports & Analytics (`/api/reports`)

All endpoints in this group require role `OWNER`.

#### `GET /api/reports/revenue`
Revenue aggregation grouped by daily, weekly, or monthly periods.
- **Query Parameters**: `period` (`day` | `week` | `month`), `startDate`, `endDate`

#### `GET /api/reports/staff-performance`
Specialist productivity metrics (appointments completed, revenue generated, average client rating).

#### `GET /api/reports/top-services`
Best-selling services by volume and generated revenue.

#### `GET /api/reports/customer-growth`
New customer acquisition and retention statistics.

---

### 3.8 Dashboard (`/api/dashboard`)

#### `GET /api/dashboard/stats`
Real-time summary metrics for staff and management dashboard:
- Today's appointment counts by status (`PENDING`, `CONFIRMED`, `IN_SERVICE`, `COMPLETED`)
- Today's revenue & outstanding balances
- Active staff on duty
- Next upcoming appointments queue
- **Access**: `STAFF`, `MANAGER`, `OWNER`

---

### 3.9 Audit Logs (`/api/audit`)

#### `GET /api/audit`
Immutable trail of administrative operations, login events, and status overrides.
- **Access**: `OWNER`
- **Query Parameters**: `action`, `performedBy`, `startDate`, `endDate`, `page`, `limit`

---

### 3.10 In-App Notifications (`/api/notifications`)

#### `GET /api/notifications`
Lists in-app notifications for authenticated user.
- **Access**: Authenticated

#### `PATCH /api/notifications/:id/read`
Marks single notification as read.

#### `PATCH /api/notifications/read-all`
Marks all notifications as read.
