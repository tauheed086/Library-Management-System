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

* **Frontend**: React 19, Next.js 16, Tailwind CSS v4, Zustand, Framer Motion, Tanstack Query
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL

---

## ⚙️ Setup and Installation

### 0. Database Setup
The backend uses PostgreSQL. For local development, start the included Postgres service:
```bash
docker compose up -d db
```

The local connection string is:
```bash
postgresql://lms_user:lms_password@localhost:5432/lms_db?schema=public
```

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Copy the env template if needed:
   ```bash
   cp .env.example .env
   ```
4. Set up the PostgreSQL database schema and generate the Prisma client:
   ```bash
   npx prisma db push
   ```
5. Seed mock books, settings, and users into the database:
   ```bash
   npm run prisma:seed
   ```
6. Spin up the Express server:
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

## 🌐 Free Demo Deployment

Recommended free demo stack:

* **Frontend**: Vercel
* **Backend**: Koyeb
* **Database**: Neon Postgres or Supabase Postgres

### Backend environment variables
Deploy the `backend` directory to Koyeb. You can use the included Dockerfile, or use `npm run build` as the build command and `npm run start:deploy` as the run command.

Set these in Koyeb:

```bash
DATABASE_URL="your-hosted-postgres-connection-string"
JWT_SECRET="replace_with_a_strong_random_secret"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
FRONTEND_URL="https://your-vercel-app.vercel.app"
```

For Neon, use the pooled connection string with SSL enabled if Neon provides it.

The backend Dockerfile automatically runs `npx prisma db push` before starting the API.

### Frontend environment variables
Deploy the `frontend` directory to Vercel and set this environment variable:

```bash
NEXT_PUBLIC_API_URL="https://your-koyeb-backend.koyeb.app/api"
```

### One-time seed
After the backend is connected to the hosted database, run the seed command once from the `backend` directory with `DATABASE_URL` pointing at the hosted database:

```bash
npm run prisma:seed
```

---

## 📊 Database Administration

To visually view and inspect the PostgreSQL database tables directly in your browser, start **Prisma Studio**:
```bash
cd backend
npm run prisma:studio
```
*Open `http://localhost:5555` to view the data tables.*
