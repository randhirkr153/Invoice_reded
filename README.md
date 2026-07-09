# SaaS Invoice Management System (MERN Stack)

A highly polished, production-ready, and secure SaaS Billing & Invoice Management System featuring role-based access control, real-time Recharts dashboards, reactive invoice editors, automatic PDF invoice generators (`pdfkit`), and offline HTML review email logging.

---

## Folder Structure

The project is split into three independent directories, each maintaining its own `package.json` file:

```
InvoiceMS/
├── backend/                  # Express REST API & Mongoose models
│   ├── src/
│   │   ├── config/           # Database setups
│   │   ├── controllers/      # Route logic handlers
│   │   ├── middlewares/      # JWT guards & rate limiters
│   │   ├── models/           # Mongoose Schemas (User, Invoice, etc.)
│   │   ├── routes/           # Express Routers
│   │   ├── services/         # PDFKit & Mock email file writers
│   │   ├── validators/       # Input schemas (express-validator)
│   │   └── server.js         # Entry node listener
│   └── temp/                 # Offline generated HTML emails & PDF Invoices
│
├── admin/                    # React Vite App for Administrators
│   ├── src/
│   │   ├── components/       # Layouts, Sidebar, Navbars, Protection
│   │   ├── pages/            # Clients, Products, Invoices, Payments, Reports
│   │   ├── redux/            # RTK Slices & global store configs
│   │   └── services/         # Axios interceptors for JWT silent-refreshes
│   └── index.html
│
└── client/                   # React Vite App for Client Billing Portal
    ├── src/
    │   ├── components/       # Sidebar, Navbars, Route Guarding
    │   ├── pages/            # Invoices list, Checkout Payment Modals, Settings
    │   └── redux/            # RTK client slices
    └── index.html
```

---

## Installation & Setup

### 1. Prerequisites
- Node.js (version 18 or higher)
- MongoDB (running instance locally, or MongoDB Atlas connection credentials)

### 2. Backend Config & Seeding
1. Open a terminal and enter the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: Open `.env` and replace `MONGO_URI` with your actual MongoDB Atlas connection string (or keep the default local fallback `mongodb://localhost:27017/invoice-db` if running a local database).*
   
4. **Seed the database** to quickly populate default credentials, services, products, and transaction records:
   ```bash
   node src/scripts/seed.js
   ```
   *This creates:*
   - **Admin User**: `admin@example.com` / `Admin@123`
   - **Client User**: `client@example.com` / `Client@123`
   - **Client User 2**: `jane@example.com` / `Client@123`
   
5. Start the backend developer API server:
   ```bash
   npm run dev
   ```
   The server launches at `http://localhost:5000`.

### 3. Admin Panel Setup
1. Open another terminal in the `admin/` directory:
   ```bash
   cd admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The Admin Panel launches at `http://localhost:5173`. You can log in using `admin@example.com` / `Admin@123`.

### 4. Client Panel Setup
1. Open a terminal in the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The Client Panel launches at `http://localhost:5174`. You can log in using `client@example.com` / `Client@123` or `jane@example.com`.

---

## API Endpoints List

### 1. Auth & Profiles (`/api/auth`)
- `POST /register`: Registers new user profiles.
- `POST /login`: Logs in user profiles & returns JWT Access Token, setting HTTP-only cookie for Refresh Token.
- `POST /refresh`: Obtains new JWT Access Token via Refresh Token.
- `POST /forgot-password`: Computes reset passwords links and writes to `backend/temp/emails/`.
- `POST /reset-password/:token`: Overwrites passwords using valid reset tokens.
- `POST /logout`: Wipes cookie headers.
- `GET /me`: Returns logged-in profile.
- `PUT /me`: Modifies details (GST, addresses, phone, names).

### 2. Admin Portal Services (`/api/admin`)
*(Protected, Admin only)*
- `GET /reports`: Groups revenues by month, outstanding counts, status divisions, and top client collections.
- `GET/POST/PUT/DELETE /clients`: Full CRUD database client cataloging.
- `GET/POST/PUT/DELETE /products`: Full CRUD cataloging for stock items and GST rates.
- `GET/POST/PUT/DELETE /invoices`: Full CRUD billing invoicing with tax computations.
- `POST /invoices/:id/send`: Manually triggers email notifications attaching generated PDFs.
- `GET/POST /payments`: Manually logs offline check, cash, or card transactions.

### 3. Client Hub Services (`/api/client`)
*(Protected, Client only)*
- `GET /dashboard`: Computes client's own pending dues, total settled, and recent bills.
- `GET /invoices`: Lists invoices issued to this client profile.
- `GET /invoices/:id/pdf`: Fetches the invoice document and downloads as a styled PDF.
- `POST /pay`: Initiates checkout, creates payment, and marks invoice status as PAID.
- `GET /payments`: Lists payment transaction receipts.

---

## Key Features

1. **Enterprise PDF Kit Generator**: Invoices generate custom A4 pages with company and client address boxes, tabular items displaying unit prices, quantities, tax totals, discounts, notes, and terms & conditions.
2. **Offline Review Email Logger**: Disabled SMTP to run offline; instead, all emails (Welcome, Invoice alerts, resets) write to `backend/temp/emails` as standard HTML files so you can check and review the templates in a browser.
3. **Double JWT Refresh Token Security**: Short-lived (15m) access tokens mapping to a long-lived (7d) secure HTTP-Only refresh token.
