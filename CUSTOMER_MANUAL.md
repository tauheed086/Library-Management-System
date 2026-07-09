# Nexus LMS Customer Manual

This manual explains how to run Nexus LMS, log in, and use the main library workflows.

Nexus LMS is a Library Management System for managing books, members, circulation, fines, reports, and system settings.

## 1. What You Need

For the easiest setup, install:

- Docker Desktop
- Git, if the project was shared through a Git repository

For manual setup without Docker, install:

- Node.js 22 or newer
- PostgreSQL 16 or newer
- npm

## 2. Quick Start With Docker

Use this method if you want the application running with the fewest steps.

1. Open a terminal in the project folder:

   ```bash
   cd LMS
   ```

2. Start the application:

   ```bash
   docker compose up --build
   ```

3. Open the application in your browser:

   ```text
   http://localhost
   ```

   If port 80 is already used on your computer, open:

   ```text
   http://localhost:3000
   ```

4. Seed the demo data once. Open a second terminal and run:

   ```bash
   docker compose exec backend npm run prisma:seed
   ```

5. Log in with one of the demo accounts listed in section 4.

To stop the application:

```bash
docker compose down
```

To stop the application and delete the local database data:

```bash
docker compose down -v
```

## 3. Manual Setup Without Docker

Use this method if you want to run each service yourself.

### 3.1 Start PostgreSQL

Create a PostgreSQL database with these local values:

```text
Database: lms_db
User: lms_user
Password: lms_password
Host: localhost
Port: 5432
```

The connection string is:

```text
postgresql://lms_user:lms_password@localhost:5432/lms_db?schema=public
```

### 3.2 Run the Backend

1. Go to the backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create the backend environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Create the database tables:

   ```bash
   npx prisma db push
   ```

5. Add demo users, books, transactions, settings, and fines:

   ```bash
   npm run prisma:seed
   ```

6. Start the backend:

   ```bash
   npm run dev
   ```

The backend runs at:

```text
http://localhost:5000
```

### 3.3 Run the Frontend

Open a new terminal.

1. Go to the frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a frontend environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

5. Open:

   ```text
   http://localhost:3000
   ```

## 4. Demo Login Accounts

All seeded demo accounts use this password:

```text
SecurePass123!
```

| Role                | Email                        | Access                                       |
| ------------------- | ---------------------------- | -------------------------------------------- |
| Super Admin         | admin@enterprise-lms.com     | Full access, settings, audit logs            |
| Librarian           | librarian@enterprise-lms.com | Books, members, circulation, fines, settings |
| Assistant Librarian | assistant@enterprise-lms.com | Books, members, circulation, fines           |
| Student             | student@enterprise-lms.com   | Catalog, borrowed items, fines               |
| Faculty             | faculty@enterprise-lms.com   | Catalog, borrowed items, fines               |

For a real customer installation, change demo passwords and set a strong `JWT_SECRET` before production use.

## 5. Main Application Areas

### Dashboard

Shows library statistics, circulation trends, overdue books, fine totals, recent transactions, and latest members.

Available to:

- Super Admin
- Librarian
- Assistant Librarian

### Catalog

Allows users to search and view available books.

Available to all roles.

### Book Inventory

Used by library staff to:

- Add new books
- Edit book details
- Duplicate book records
- Delete book records
- Export books to CSV
- Import books from JSON
- Print barcode labels

Available to:

- Super Admin
- Librarian
- Assistant Librarian

### Members

Used by library staff to:

- Add students, faculty, and staff members
- Edit member records
- Suspend or reactivate members
- Renew memberships
- Print membership cards
- View active borrows and fine balances

Available to:

- Super Admin
- Librarian
- Assistant Librarian

### Circulation POS

Used at the library desk to issue and return books.

Typical issue flow:

1. Open Circulation POS.
2. Select or scan a member.
3. Select or scan a book.
4. Confirm checkout.
5. The system records the issue date and due date.

Typical return flow:

1. Open Circulation POS.
2. Search for the active transaction.
3. Return the book.
4. If the book is late, the system calculates fines based on settings.

Available to:

- Super Admin
- Librarian
- Assistant Librarian

### Fines Ledger

Used to view outstanding fines, record payments, waive fines, and track fine status.

Library staff can manage fine records. Students, faculty, and staff can view their own fines.

### Borrowed Items

Shows a user's current and past borrowed books, due dates, and return status.

Available to all roles.

### Audit Logs

Shows system activity logs.

Available to:

- Super Admin

### Settings

Used to configure library rules such as:

- Library name
- Opening hours
- Fine rates
- Grace period
- Borrow limits
- Borrow durations
- Holiday calendar

Available to:

- Super Admin
- Librarian

## 6. Environment Variables

### Backend

The backend uses `backend/.env`.

```env
PORT=5000
DATABASE_URL="postgresql://lms_user:lms_password@localhost:5432/lms_db?schema=public"
JWT_SECRET="replace_with_a_strong_secret"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

For Docker Compose, the backend uses the internal database host `db`:

```env
DATABASE_URL="postgresql://lms_user:lms_password@db:5432/lms_db?schema=public"
```

### Frontend

The frontend uses `frontend/.env.local`.

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## 7. Database Administration

To view and edit database records in a browser, run Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

Open:

```text
http://localhost:5555
```

## 8. Common Problems and Fixes

### The frontend opens, but login fails

Check that the backend is running:

```text
http://localhost:5000/health
```

You should see a healthy response.

If the backend is not running, start it again.

### The dashboard says database data is missing

Run the database setup and seed commands:

```bash
cd backend
npx prisma db push
npm run prisma:seed
```

For Docker:

```bash
docker compose exec backend npx prisma db push
docker compose exec backend npm run prisma:seed
```

### Port 3000, 5000, 5432, or 80 is already in use

Stop the other application using that port, or change the port mapping in `docker-compose.yml`.

Default ports:

| Service         | Port |
| --------------- | ---- |
| Frontend        | 3000 |
| Backend API     | 5000 |
| PostgreSQL      | 5432 |
| Nginx web entry | 80   |

### Docker database needs a clean reset

This deletes the local Docker database volume:

```bash
docker compose down -v
docker compose up --build
docker compose exec backend npm run prisma:seed
```

### CORS error in the browser

Make sure `FRONTEND_URL` in `backend/.env` matches the frontend URL.

Examples:

```env
FRONTEND_URL="http://localhost:3000"
```

or multiple allowed frontend URLs:

```env
FRONTEND_URL="http://localhost:3000,http://localhost"
```

## 9. Production Deployment Notes

Before deploying for real customers:

1. Use a hosted PostgreSQL database.
2. Set a strong `JWT_SECRET`.
3. Set `NODE_ENV=production`.
4. Set `FRONTEND_URL` to the real frontend URL.
5. Set `NEXT_PUBLIC_API_URL` to the real backend API URL.
6. Run the seed command only if you want demo data.
7. Replace or remove demo accounts before using production data.

Recommended deployment split:

| Part     | Suggested Service                                       |
| -------- | ------------------------------------------------------- |
| Frontend | Vercel                                                  |
| Backend  | Koyeb, Render, Railway, Fly.io, or similar Node hosting |
| Database | Neon, Supabase, Railway Postgres, or managed PostgreSQL |

## 10. Support Checklist

When reporting an issue, include:

- Which URL you opened
- Which account role you used
- What action you tried
- The error message shown on screen
- Whether you ran with Docker or manual setup
- Backend terminal logs, if available
