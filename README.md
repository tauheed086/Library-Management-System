# Nexus LMS - Enterprise Library Management System

Nexus LMS is a premium, enterprise-grade Library Management System designed for schools, universities, and corporate libraries. It provides a complete end-to-end workflow for managing physical book inventories, student/faculty membership profiles, and circulation desks (Point-of-Sale check-out/check-in, fine collections, and fee waivers).

---

## 🚀 Key Features

* **🎛️ Librarian & Admin Dashboards**: Real-time stats on total books, active borrow rates, member checkouts, and outstanding fines.
* **📚 Book Inventory**: Full-featured book catalog management including purchase tracking, call/rack locations, copy counts, and cover images.
* **👥 Members Directory**: Detailed membership files showing borrow limits, active status, membership expiry countdowns, and printable visual **Barcode ID Cards**.
* **🛒 Circulation POS**: An interactive desk checkout interface for issuing and returning books with simulated barcode/card scanners.
* **💰 Fines Ledger**: Transparent logging of overdue library fines, partial/full payments, fine waivers, and printable receipt records.
* **📖 Personal Borrowed Items**: A dedicated member portal dashboard displaying active loans, due dates (with color-coded warnings), and check-out logs.
* **🛡️ Role-Based Access Control**: Standard permission tiers: `SUPER_ADMIN`, `LIBRARIAN`, `ASSISTANT_LIBRARIAN`, `STUDENT`, `FACULTY`, and `STAFF`.
* **🌗 Class-Based Dark Mode**: Premium UI theme toggle using HSL-tailored colors and smooth micro-interactions.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Next.js 15, Tailwind CSS v4, Zustand, Framer Motion, Tanstack Query
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite (zero-dependency local file database)

---

## ⚙️ Setup and Installation

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Set up the local SQLite database schema and generate the Prisma client:
   ```bash
   npx prisma db push
   ```
4. Seed mock books, settings, and users into the database:
   ```bash
   npm run prisma:seed
   ```
5. Spin up the Express server:
   ```bash
   npm run dev
   ```
   *The backend runs on `http://localhost:5000`.*

---

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:3000`.*

---

## 🔑 Seeding / Demo Accounts

The database comes pre-seeded with five user roles. Use the email addresses below with the shared password **`SecurePass123!`** to log in:

1. **Super Admin**: `admin@enterprise-lms.com` (full features & settings)
2. **Librarian**: `librarian@enterprise-lms.com` (can checkout/return, manage books, modify fines)
3. **Assistant Librarian**: `assistant@enterprise-lms.com` (can checkout/return, record payments)
4. **Student**: `student@enterprise-lms.com` (can search catalog, view personal checkouts, check fines)
5. **Faculty**: `faculty@enterprise-lms.com` (can search catalog, view personal checkouts, check fines)

---

## 📊 Database Administration

To visually view and inspect the SQLite database tables directly in your browser, start **Prisma Studio**:
```bash
cd backend
npm run prisma:studio
```
*Open `http://localhost:5555` to view the data tables.*
