# Subscription Management System — API & Backend

A robust, production-ready REST API backend for subscription lifecycle management, recurring billing, transactional payment recording, and real-time KPI analytics, built for Brightloop Software.

---

## 1. Project Overview & Architecture

The backend follows a clean, multi-tier client–API–database pattern with strict server-side authority:
- **Authentication & RBAC:** Admin and Staff role-based access control with bcrypt password hashing and JWT authentication.
- **Integer Paise Financials:** All prices, subtotals, taxes, and payments are stored and calculated in integer paise (₹1.00 = 100 paise) to prevent floating-point rounding errors.
- **Snapshotted Terms:** Subscription creation captures pricing and billing intervals as snapshots to protect contracts from future catalog edits.
- **Idempotent Billing Engine:** Prevents duplicate billing via a MongoDB unique compound index (`subscriptionId + billingPeriodStart + billingPeriodEnd`) and self-healing retry recovery.
- **Transactional Payments:** Multi-document ACID transactions guarantee atomic invoice settlement and payment recording.
- **Aggregated Analytics:** Server-side aggregation pipelines deliver instantaneous dashboard KPI calculations.

```text
React Client (SPA)
        │ HTTPS / JSON REST API (Bearer JWT)
        ▼
Node.js + Express API (Render)
  ├── Auth & RBAC Middleware
  ├── Catalog & Customer Controllers
  ├── Subscription State Machine
  ├── Idempotent Billing Engine
  ├── Transactional Payment Engine
  └── Dashboard Aggregations
        │ Mongoose ODM / TLS
        ▼
MongoDB Atlas (ReplicaSet Cluster)
  ├── users
  ├── customers
  ├── products
  ├── plans
  ├── subscriptions
  ├── invoices  [Unique Compound Index: subscriptionId + cycle]
  └── payments
```

---

## 2. Technology Stack

- **Runtime:** Node.js (v24.x / LTS)
- **Framework:** Express.js (`^5.x`)
- **Database & ODM:** MongoDB Atlas with Mongoose (`^9.x`)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), bcrypt password hashing (`bcryptjs`)
- **Cross-Origin Security:** CORS with configurable origins
- **Hosting Target:** Render Web Service

---

## 3. Setup & Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI or local MongoDB connection

### Installation
From the repository root:
```bash
# Install backend dependencies
cd server
npm install
```

### Environment Configuration
Copy the provided environment template:
```bash
cp .env.example .env
```
Configure your `.env` file with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/subscription_management?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_here
CLIENT_URL=http://localhost:5173
# Optional DNS override if local DNS cannot resolve Atlas SRV records:
DNS_SERVERS=8.8.8.8,8.8.4.4
```

### Database Seeding
To populate realistic demo accounts, catalog items, active subscriptions, and unpaid invoices:
```bash
npm run seed --prefix server
```

### Running the Server
```bash
# Development mode (with nodemon auto-reload)
npm run dev --prefix server

# Production mode
npm start --prefix server
```

---

## 4. API Endpoints Summary

All routes under `/api/*` (except health and login) require the HTTP header:
`Authorization: Bearer <jwt_token>`

| Module | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Public | System uptime & MongoDB connection health check |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticates Admin/Staff, returns JWT & role |
| **Auth** | `GET` | `/api/auth/me` | Protected | Returns authenticated user profile |
| **Customers** | `GET` | `/api/customers` | Admin/Staff | Lists all customer directory records |
| **Customers** | `POST` | `/api/customers` | Admin/Staff | Creates a new customer profile |
| **Customers** | `GET` | `/api/customers/:id` | Admin/Staff | Retrieves a single customer profile |
| **Products** | `GET` | `/api/products` | Admin/Staff | Lists products (filter with `?isActive=true`) |
| **Products** | `POST` | `/api/products` | Admin/Staff | Creates product with paise pricing and variants |
| **Products** | `PATCH` | `/api/products/:id` | Admin/Staff | Updates product fields or deactivates |
| **Plans** | `GET` | `/api/plans` | Admin/Staff | Lists plans with populated product info |
| **Plans** | `POST` | `/api/plans` | Admin/Staff | Creates plan under product (`daily/weekly/monthly/yearly`) |
| **Subscriptions** | `GET` | `/api/subscriptions` | Admin/Staff | Lists subscriptions with populated customer & plan |
| **Subscriptions** | `POST` | `/api/subscriptions` | Admin/Staff | Creates subscription with price & interval snapshots |
| **Subscriptions** | `GET` | `/api/subscriptions/:id`| Admin/Staff | Retrieves subscription details |
| **Subscriptions** | `PATCH` | `/api/subscriptions/:id`| Admin/Staff | Lifecycle state transitions (`draft -> active`, `active -> closed`) |
| **Billing** | `POST` | `/api/billing/run` | Admin/Staff | Idempotent billing execution for due subscriptions |
| **Invoices** | `GET` | `/api/invoices` | Admin/Staff | Lists generated invoices with status & balance |
| **Invoices** | `GET` | `/api/invoices/:id` | Admin/Staff | Retrieves invoice line items, tax breakdown & balances |
| **Payments** | `POST` | `/api/payments` | Admin/Staff | Records full payment via ACID transaction |
| **Payments** | `GET` | `/api/payments` | Admin/Staff | Lists payment transaction history |
| **Payments** | `GET` | `/api/payments/:id` | Admin/Staff | Retrieves individual payment receipt |
| **Dashboard** | `GET` | `/api/dashboard/summary` | Admin/Staff | Aggregated KPIs (Active Subs, Revenue, Outstanding, Overdue) |

---

## 5. Demonstrable Golden Path Workflow

1. **Login:** Authenticate as Admin via `POST /api/auth/login`.
2. **Customer Creation:** Add a customer via `POST /api/customers`.
3. **Catalog Setup:** Create a Product (`POST /api/products`) and a monthly Plan (`POST /api/plans`).
4. **Subscription Creation:** Subscribe the customer (`POST /api/subscriptions`), verifying price snapshot.
5. **Subscription Activation:** Transition subscription from `draft` to `active` (`PATCH /api/subscriptions/:id`).
6. **Billing Run:** Trigger `POST /api/billing/run` to generate an invoice with 18% tax.
7. **Idempotency Verification:** Re-trigger `POST /api/billing/run` — verify 0 duplicate invoices created.
8. **Payment Settlement:** Submit payment via `POST /api/payments` — invoice atomically marks `paid`.
9. **Dashboard Verification:** Query `GET /api/dashboard/summary` — verify real-time revenue and outstanding updates.

---

## 6. Seeded Demo Accounts

Run `npm run seed --prefix server` to seed demo data. Accounts created:
- **Admin Account:** `admin@brightloop.io`
- **Staff Account:** `staff@brightloop.io`

*(Default passwords can be configured via `DEMO_ADMIN_PASSWORD` and `DEMO_STAFF_PASSWORD` in your local environment, or default to standard evaluation passwords).*

---

## 7. Render Deployment Instructions

1. **Create Web Service:** Connect GitHub repository on Render.
2. **Root Directory:** `server`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment Variables on Render:**
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
   - `MONGODB_URI`: `<Your MongoDB Atlas Production TLS Connection String>`
   - `JWT_SECRET`: `<Random 32+ character string>`
   - `CLIENT_URL`: `<Your Frontend Production Origin / Vercel / Netlify URL>`
6. **Health Check Path:** `/api/health`
