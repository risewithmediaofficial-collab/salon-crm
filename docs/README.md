# Luxe Salon CRM — Single Salon Management & Appointment Platform

A high-performance, production-ready, single-salon Customer Relationship Management (CRM) and Appointment Management System. Built specifically for **ONE salon/parlour only** (strictly not multi-tenant, not SaaS).

---

## Highlights

- **Dynamic Public Booking Flow**: 6-step customer wizard with real-time slot calculation, specialist selection, coupon validation, and instant appointment confirmation.
- **Server-Authoritative Availability Engine**: High-concurrency slot generation considering specialist working hours, weekly offs, approved leaves, service durations, and existing active bookings.
- **Robust Double-Booking Prevention**: Atomic MongoDB query checks and database transactions guarantee zero overlapping bookings.
- **Operational Staff Portal**: Multi-view visual calendar, real-time daily queues, and status workflow transitions (`PENDING` → `CONFIRMED` → `IN_SERVICE` → `COMPLETED` / `CANCELLED` / `NO_SHOW`).
- **Complete Billing & Invoicing Engine**: Automated server-side line item calculations, SGST/CGST breakdown (18%), discount promotions, multiple payment methods (UPI, Cash, Card), and printable receipts.
- **Role-Based Access Control (RBAC)**: Strict separation of privileges across `CUSTOMER`, `STAFF`, `MANAGER`, and `OWNER`.
- **Auditing & Security**: Immutable audit log for sensitive operations, Argon2 password hashing, short-lived JWTs with token rotation, rate limiting, and NoSQL injection sanitizers.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, JavaScript (ESM), Tailwind CSS, React Router v6, Zustand, Axios, Lucide React, date-fns |
| **Backend** | Node.js (ESM), Express.js, MongoDB, Mongoose 8, Argon2, JWT, Helmet, Winston, Twilio SDK |
| **Monorepo** | NPM Workspaces (`frontend/`, `backend/`, `shared/`) |
| **Quality** | Jest 29, Vitest/Vite build verification, ESLint |

---

## Project Structure

```
salon-crm/
├── frontend/                     # Customer Portal & Admin Single Page Application
│   ├── src/
│   │   ├── app/                  # Router and root App component
│   │   ├── components/
│   │   │   ├── common/           # 18 reusable design system components
│   │   │   ├── layout/           # CustomerLayout and AdminLayout with navigation
│   │   │   └── customer/admin/   # Feature-specific modals & wizards
│   │   ├── pages/
│   │   │   ├── customer/         # Home, Services, Staff, Offers, Booking, Appointments
│   │   │   └── admin/            # Dashboard, Calendar, Appointments, Customers, Billing, Staff, Services, Offers, Reports, Audit
│   │   ├── store/                # Zustand stores (authStore, uiStore)
│   │   ├── services/             # Axios API client with automatic token refresh
│   │   └── styles/               # Tailwind CSS theme configuration
│   └── vite.config.js            # Path aliases (@ -> src, @shared -> ../shared)
├── backend/                      # REST API Server
│   ├── src/
│   │   ├── config/               # Database connection & seed script
│   │   ├── controllers/          # Thin HTTP controllers
│   │   ├── middleware/           # JWT auth, RBAC, validators, rate limiters, error handler
│   │   ├── models/               # Mongoose schemas (User, Customer, Staff, Service, Appointment, Invoice, AuditLog, Offer, Notification)
│   │   ├── routes/               # Express REST route modules
│   │   ├── security/             # NoSQL injection sanitizer & security filters
│   │   ├── services/             # Core business logic (availability, billing, appointments, audit, etc.)
│   │   └── jobs/                 # Automated background jobs (appointment reminders)
│   └── tests/                    # Unit & integration test suites
├── shared/                       # Cross-boundary shared constants, utilities & validation
│   ├── constants/                # Enums (ROLES, STATUSES, CATEGORIES, TAX_RATE)
│   ├── validation-rules/         # Regex patterns (phone, time, date)
│   └── utils/                    # Formatting helpers (formatCurrency INR, formatDuration, time converters)
└── docs/                         # In-depth architectural & API specifications
    ├── architecture.md           # Architecture, data models & state machine
    ├── api.md                    # Complete REST API endpoint reference
    └── security.md               # Threat modeling, sanitization & RBAC design
```

---

## Quickstart

### Prerequisites
- **Node.js** >= 20.0.0
- **MongoDB** >= 7.0 (local instance or MongoDB Atlas URI)
- **npm** >= 10.0.0

### 1. Installation
Clone the repository and install all workspace dependencies from the root directory:

```bash
git clone <repository-url>
cd salon-crm
npm install
```

### 2. Environment Configuration

#### Backend Environment
Create `backend/.env` (a template is provided in `backend/.env.example`):
```bash
cp backend/.env.example backend/.env
```
Default configuration for local development:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/salon-crm
JWT_ACCESS_SECRET=super_secret_jwt_access_token_key_change_in_production_min32chars
JWT_REFRESH_SECRET=super_secret_jwt_refresh_token_key_change_in_production_min32chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
SALON_NAME="Luxe Salon & Spa"
DEFAULT_TAX_RATE=0.18
TWILIO_ACCOUNT_SID=mock_sid
TWILIO_AUTH_TOKEN=mock_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Frontend Environment
Create `frontend/.env` (a template is provided in `frontend/.env.example`):
```bash
cp frontend/.env.example frontend/.env
```
Default configuration:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SALON_NAME="Luxe Salon & Spa"
```

### 3. Database Seeding
Initialize the database with the salon owner, default specialists, service catalog, and promotional offers:

```bash
npm run seed
```

#### Default Credentials (after seeding)
- **Salon Owner / Administrator**:
  - **Email**: `admin@salon.com`
  - **Password**: `Password123!`
  - **URL**: `http://localhost:5173/admin/login`
- **Customer OTP Login**:
  - **Phone**: Any 10-digit Indian number (e.g., `9876543210`)
  - **Development OTP**: `123456` (displayed in backend server console in non-production environments)

---

## Running the Application

### Development Mode
Run both backend and frontend concurrently with hot-reloading:

```bash
npm run dev
```

Or start services independently:
```bash
# Start backend API (http://localhost:5000)
npm run dev:backend

# Start frontend development server (http://localhost:5173)
npm run dev:frontend
```

Open `http://localhost:5173` in your browser to experience the customer booking wizard or navigate to `/admin/login` for the salon staff dashboard.

---

## Testing & Quality

Run the backend automated test suite:

```bash
npm test
```

This verifies:
1. **Billing Service**: Server-side line-item pricing, promo discount caps, and 18% GST calculation.
2. **Availability Engine**: Slot generation, working hour boundaries, day-off exclusions, and overlap detection.
3. **Appointment State Machine**: Valid status transitions (`PENDING` → `CONFIRMED` → `IN_SERVICE` → `COMPLETED`) and rejection of invalid state transitions.

Build the frontend production bundle:

```bash
npm run build
```

---

## Documentation

- [Architecture Design & State Machine](docs/architecture.md)
- [REST API Reference](docs/api.md)
- [Security Guidelines & Threat Mitigations](docs/security.md)

---

## License

Private and proprietary. Designed exclusively for single salon operations.
