# Salon CRM — Security Architecture & Guidelines

## 1. Threat Model & Overview
The Salon CRM handles sensitive client contact data, staff scheduling, revenue accounting, and appointment reservations. It implements defense-in-depth across the network, application, database, and authentication layers.

---

## 2. Authentication

### Customer Authentication
- Mobile phone verification using a time-limited 6-digit One-Time Password (OTP).
- **OTP Security**:
  - Expiration: 10 minutes.
  - Rate Limiting: Max 3 OTP sends per phone per hour (`otpSendLimiter`).
  - Brute Force Protection: Max 5 incorrect attempts before lockout (`OTP_MAX_ATTEMPTS`).
  - Cryptographic generation using `crypto.randomInt(100000, 999999)`.

### Staff & Admin Authentication
- Password hashing using **Argon2id** (`argon2.hash` with memory cost, parallelism, and salt).
- **Zero Plain-Text Storage**: Passwords are never logged or stored unhashed.
- Token handling:
  - Short-lived Access Token (JWT, 15m expiration).
  - Secure Refresh Token (JWT, 7d expiration) with token rotation on refresh.
  - Active check on every authenticated request verifies `isActive: true` in database.

---

## 3. Role-Based Access Control (RBAC)

The backend rigorously enforces permissions regardless of frontend state:
- `OWNER`: Full administrative access, billing, pricing, staff management, audit logs, revenue reports.
- `MANAGER`: Appointment management, client roster, service operations, staff roster.
- `STAFF`: View own schedule, mark client arrival, start service, complete service. Restricted from modifying system prices, viewing revenue reports, or deleting users.
- `CUSTOMER`: Can only access their own appointments, invoices, and profile (`customerOwnsResource` middleware).

---

## 4. Input Sanitization & Injection Defense

- **NoSQL Injection**:
  - `express-mongo-sanitize` strips `$` and `.` operators from request bodies, query strings, and params.
  - Custom recursive sanitization middleware (`backend/src/security/sanitizer.js`) cleans nested objects.
- **HTTP Parameter Pollution (HPP)**:
  - `hpp` middleware prevents array injection in query params.
- **Data Validation**:
  - `express-validator` strictly enforces schemas (MongoIDs, ISO dates, regex patterns) before hitting controllers.
  - Rejects malformed requests with `422 Unprocessable Entity`.

---

## 5. Network & HTTP Hardening

- **Helmet**:
  - Content Security Policy (CSP).
  - HSTS (`Strict-Transport-Security`).
  - Clickjacking protection (`X-Frame-Options: SAMEORIGIN`).
  - MIME-type sniffing protection (`X-Content-Type-Options: nosniff`).
- **CORS**:
  - Whitelist restricted to authorized domain(s) in production (`CORS_ALLOWED_ORIGINS`).
  - Credentials support with strict header exposure.
- **Rate Limiting**:
  - General API: 100 requests per 15 minutes (`apiLimiter`).
  - Auth endpoints: 10 requests per 15 minutes (`authLimiter`).

---

## 6. Secrets Management & Environment Security

- Backend `.env` holds all sensitive credentials (`JWT_ACCESS_SECRET`, `MONGODB_URI`, Twilio keys).
- Frontend Vite only accesses `VITE_` prefixed public variables (salon name, address, API URL). No backend secrets are bundled into client JavaScript.
- `.env` is ignored in `.gitignore`.
