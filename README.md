# Subscription Management System (Full-Stack)

A complete, production-ready full-stack subscription management and recurring billing platform built with **Node.js, Express, MongoDB** on the backend and **React 19, React Router v7, Lucide Icons, Recharts** on the frontend.

---

## 1. Architecture & Overview

```text
React 19 SPA (Client)
  ├── Public / Auth: Login, Signup, Forgot Password
  ├── Protected Dashboard: Real-time KPI summary, Revenue Analytics (Recharts)
  ├── Modules: Products, Plans, Customers, Subscriptions, Invoices, Payments, Staff
  └── API Service Layer: Axios interceptor with automatic JWT Bearer injection
        │
        │ REST API (JSON) over HTTP/HTTPS
        ▼
Node.js + Express 5 API (Server)
  ├── Auth Middleware: JWT verification, bcrypt password hashing & RBAC ('admin', 'staff')
  ├── Product & Plan Catalog: Integer-paise pricing & subscription snapshots
  ├── Customer Management: Unique email enforcement & contact profiling
  ├── Billing Engine: Idempotent cycle processing with unique compound index & self-healing recovery
  ├── Payment Engine: Multi-document ACID transactions ensuring atomic invoice settlement
  └── Dashboard Aggregation: Real-time MongoDB aggregation pipelines
        │
        │ Mongoose ODM / TLS
        ▼
MongoDB Replica Set (Atlas Cluster / Local ReplicaSet)
```

---

## 2. Technology Stack

### Backend
- **Runtime:** Node.js (v24.x LTS)
- **Framework:** Express.js (`^5.3.0`)
- **Database & ODM:** MongoDB with Mongoose (`^9.11.4`)
- **Security & Auth:** JSON Web Tokens (`jsonwebtoken`), bcrypt password hashing (`bcryptjs`), CORS
- **Testing:** Jest (`^29.7.0`), Supertest (`^7.1.0`), MongoMemoryReplSet (`mongodb-memory-server`)

### Frontend
- **Framework:** React 19 (`^19.3.1`)
- **Routing:** React Router DOM v7 (`^7.18.5`)
- **HTTP Client:** Axios (`^1.21.0`)
- **UI Components & Icons:** Lucide React (`^1.65.0`)
- **Data Visualizations:** Recharts (`^3.10.1`)
- **Build System:** Create React App (`react-scripts 5.0.1`)

---

## 3. Project Structure

```text
Subscription_Management_System/
├── client/                     # Frontend React SPA
│   ├── public/                 # Favicon, HTML entry point, manifest
│   ├── src/
│   │   ├── components/         # Reusable UI (Loading, ErrorState, EmptyState, Sidebar, Topbar)
│   │   ├── context/            # AuthContext (JWT & user state management)
│   │   ├── layouts/            # DashboardLayout
│   │   ├── pages/              # Dashboard, Products, Plans, Customers, Invoices, Payments, etc.
│   │   └── services/           # Axios API client & Dashboard service
│   ├── .env.example            # Client environment template
│   └── package.json            # Client scripts & dependencies
├── server/                     # Backend Express API
│   ├── src/
│   │   ├── config/             # Database connection (Mongoose)
│   │   ├── controllers/        # Route controllers (Auth, Billing, Customers, etc.)
│   │   ├── middleware/         # Auth & RBAC protection middleware
│   │   ├── models/             # Mongoose schemas (User, Customer, Plan, Subscription, Invoice, Payment)
│   │   ├── routes/             # Express API routes
│   │   ├── scripts/            # Database seed script
│   │   ├── utils/              # Billing cycle date math & financial calculations
│   │   ├── app.js              # Express app definition & error handlers
│   │   └── server.js           # Server startup script
│   ├── tests/                  # 206 automated unit & integration test suites
│   ├── .env.example            # Server environment template
│   └── package.json            # Server scripts & dependencies
├── TEST_REPORT.md              # Full QA, audit and testing report
└── README.md                   # Full-stack documentation
```

---

## 4. Setup & Local Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB Atlas account or local MongoDB instance

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

Ensure `.env` contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
CLIENT_URL=http://localhost:3000
```

Seed initial demo data (optional):
```bash
npm run seed
```

Start the backend:
```bash
# Development mode (nodemon)
npm run dev

# Production mode
npm start
```

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Configure environment (optional, defaults to http://localhost:5000/api)
cp .env.example .env
```

Start the frontend:
```bash
npm start
```
The React application will open on `http://localhost:3000`.

---

## 5. Automated Testing

### Backend Tests (206 automated tests)

```bash
cd server

# Run unit tests (billing date math, paise arithmetic)
npm run test:unit

# Run full integration test suites (uses MongoMemoryReplSet)
npm run test:integration

# Run all test suites
npm test
```

### Frontend Tests

```bash
cd client

# Run test suite
npm test -- --watchAll=false

# Test production build
npm run build
```

---

## 6. Core API Endpoints

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Server uptime and MongoDB connection state |
| `POST` | `/api/auth/register` | Public | Register new staff/admin user |
| `POST` | `/api/auth/login` | Public | Authenticate user, receive JWT token |
| `GET` | `/api/auth/me` | Protected | Current user profile |
| `GET` | `/api/dashboard/summary` | Protected | Active subscriptions, revenue, overdue invoices |
| `GET` | `/api/customers` | Protected | List registered customers |
| `POST` | `/api/customers` | Protected | Create new customer record |
| `GET` | `/api/products` | Protected | List catalog products |
| `POST` | `/api/products` | Protected | Create new catalog product |
| `GET` | `/api/plans` | Protected | List subscription plans |
| `POST` | `/api/plans` | Protected | Create subscription plan |
| `GET` | `/api/subscriptions` | Protected | List subscriptions with filters |
| `POST` | `/api/subscriptions` | Protected | Create subscription draft |
| `PATCH` | `/api/subscriptions/:id` | Protected | Transition subscription status |
| `POST` | `/api/billing/run` | Protected | Run idempotent billing cycle engine |
| `GET` | `/api/invoices` | Protected | List invoices with line items & balances |
| `GET` | `/api/payments` | Protected | List recorded transaction payments |
| `POST` | `/api/payments` | Protected | Record payment against invoice via ACID transaction |

---

## 7. Financial Integrity Rules

- **Integer Paise Representation:** All money values (`salesPrice`, `costPrice`, `subtotal`, `taxAmount`, `totalAmount`, `paidAmount`, `outstandingAmount`) are strictly non-negative integers in paise (₹1.00 = 100 paise) across database documents, payloads, and backend controllers.
- **Frontend Display Formatting:** The frontend converts paise to INR (`amount / 100`) and displays formatted values using Indian numbering (`toLocaleString('en-IN')`).
