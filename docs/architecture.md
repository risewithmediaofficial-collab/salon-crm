# Salon CRM — Architecture & System Design

## 1. Overview
This is a production-ready, single-salon CRM and appointment management system designed exclusively for **one salon/parlour**. It intentionally excludes multi-tenant or SaaS complexity, ensuring peak performance, rock-solid data integrity, and uncompromising security.

---

## 2. System Architecture

```
[ Customer Portal (Web/Mobile) ]        [ Salon Admin / Stylist Console ]
               │                                      │
               └──────────────────┬───────────────────┘
                                  │ HTTPS / REST (JSON)
                                  ▼
                     [ Centralized API Client ]
                   (Axios + Interceptors + Auth)
                                  │
                                  ▼
               ┌─────────────────────────────────────┐
               │    Express.js Application Engine    │
               │ ─────────────────────────────────── │
               │ • Helmet CSP & Security Headers     │
               │ • Strict Rate Limiters              │
               │ • Input Sanitization (NoSQL)        │
               │ • Authentication (Argon2 / JWT)     │
               │ • RBAC Authorization (Owner/Staff)  │
               └──────────────────┬──────────────────┘
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
     [ Core Domain Services ]             [ Availability Engine ]
     • Appointment Service                • Real-time slot generator
     • Billing & Tax Service              • Atomic DB locks
     • Customer Management                • Staff working hours & leave
     • Notification & SMS Service         • Buffer time calculations
               │
               ▼
     [ MongoDB & Mongoose ORM ]
     • Indexed collections
     • ACID transactions for bookings
     • Immutable Audit Trail
```

---

## 3. Layer Separation

1. **Routes (`backend/src/routes`)**:
   Thin route definitions attaching rate limiters, authentication, and request validators.
2. **Validators (`backend/src/validators`)**:
   Declarative validation chains via `express-validator` and shared regex patterns.
3. **Controllers (`backend/src/controllers`)**:
   Ultra-thin controllers parsing inputs and formatting responses via `apiResponse.js`. No business logic resides in controllers.
4. **Services (`backend/src/services`)**:
   Pure business logic, database transactions, double-booking prevention, tax/discount computations, and audit logging.
5. **Models (`backend/src/models`)**:
   Mongoose schemas with targeted indexing, timestamps, and schema constraints.

---

## 4. Slot Availability & Double-Booking Prevention Engine

1. **Working Hours & Leave Matrix**:
   `availabilityService.js` calculates active stylist shifts (excluding lunch, off-days, and recorded leaves).
2. **Buffer Time Inclusion**:
   Every service defines duration and optional sanitation buffer time.
3. **Atomic Booking**:
   Booking creation executes inside a MongoDB transaction session with a final pre-insert slot conflict query:
   ```javascript
   {
     staff: staffId,
     status: { $in: ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE'] },
     startTime: { $lt: endTime },
     endTime: { $gt: startTime }
   }
   ```
4. **Database-Level Safety Net**:
   Compound index on `(staff, startTime)` prevents concurrency races.

---

## 5. Billing Architecture

The frontend is **never** the source of truth for prices, taxes, or discounts.
- Service prices are fetched from the database at booking/invoicing time.
- Promotional codes are validated server-side (`billingService.validateOffer`).
- A complete immutable snapshot (`billingSnapshot`) is embedded directly into the invoice document to preserve historical invoice integrity even if service prices change in the future.
