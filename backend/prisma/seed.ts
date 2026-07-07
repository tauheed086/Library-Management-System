import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Settings Seeding
  const settings = [
    { key: 'library_name', value: 'Nexus Enterprise Library', description: 'Name of the library' },
    { key: 'opening_hours', value: '{"weekday": "08:00 - 22:00", "weekend": "09:00 - 18:00"}', description: 'Library working hours' },
    { key: 'fine_rate_student', value: '2.0', description: 'Fine per day for students (USD)' },
    { key: 'fine_rate_faculty', value: '5.0', description: 'Fine per day for faculty (USD)' },
    { key: 'grace_period_days', value: '3', description: 'Grace days before fines start accumulating' },
    { key: 'borrow_limit_student', value: '5', description: 'Maximum books a student can borrow' },
    { key: 'borrow_limit_faculty', value: '10', description: 'Maximum books a faculty can borrow' },
    { key: 'borrow_duration_student_days', value: '14', description: 'Borrow duration for students in days' },
    { key: 'borrow_duration_faculty_days', value: '30', description: 'Borrow duration for faculty in days' },
    { key: 'holiday_calendar', value: '["2026-01-01", "2026-07-04", "2026-12-25"]', description: 'List of holidays (YYYY-MM-DD)' }
  ];

  for (const set of settings) {
    await prisma.setting.upsert({
      where: { key: set.key },
      update: set,
      create: set
    });
  }

  // Hash passwords
  const passwordHash = bcrypt.hashSync('SecurePass123!', 10);

  // 2. User Seeding (Roles)
  const users = [
    {
      id: 'admin-sample-id',
      email: 'admin@enterprise-lms.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      name: 'Dr. Jane Dev',
      phone: '+1 555-0100',
      address: 'Admin Suite 4B, Campus',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      membershipExpiry: new Date('2030-12-31'),
      status: 'ACTIVE'
    },
    {
      id: 'librarian-sample-id',
      email: 'librarian@enterprise-lms.com',
      password: passwordHash,
      role: 'LIBRARIAN',
      name: 'Michael Scott',
      phone: '+1 555-0120',
      address: 'Library Desk A',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      membershipExpiry: new Date('2028-12-31'),
      status: 'ACTIVE'
    },
    {
      id: 'assistant-sample-id',
      email: 'assistant@enterprise-lms.com',
      password: passwordHash,
      role: 'ASSISTANT_LIBRARIAN',
      name: 'Pam Beesly',
      phone: '+1 555-0130',
      address: 'Library Desk B',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      membershipExpiry: new Date('2028-12-31'),
      status: 'ACTIVE'
    },
    {
      id: 'student-sample-id',
      email: 'student@enterprise-lms.com',
      password: passwordHash,
      role: 'STUDENT',
      name: 'Alice Smith',
      phone: '+1 555-0140',
      address: 'Dorm Room 302',
      department: 'Computer Science',
      course: 'B.Tech CSE',
      semester: '6th Semester',
      membershipExpiry: new Date('2027-06-30'),
      borrowLimit: 5,
      status: 'ACTIVE'
    },
    {
      id: 'faculty-sample-id',
      email: 'faculty@enterprise-lms.com',
      password: passwordHash,
      role: 'FACULTY',
      name: 'Dr. Robert California',
      phone: '+1 555-0150',
      address: 'Faculty Block C, Office 12',
      department: 'Business Administration',
      membershipExpiry: new Date('2029-06-30'),
      borrowLimit: 10,
      status: 'ACTIVE'
    }
  ];

  const seededUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u
    });
    seededUsers.push(user);
  }

  // 3. Books Seeding
  const books = [
    {
      isbn: '978-0134685991',
      barcode: 'B000000001',
      qrCode: 'Q000000001',
      title: 'Effective Java',
      subtitle: 'Best practices for the Java platform',
      authors: 'Joshua Bloch',
      publisher: 'Addison-Wesley Professional',
      edition: '3rd Edition',
      publicationYear: 2018,
      language: 'English',
      category: 'Computer Science',
      genre: 'Software Engineering',
      shelfNumber: 'S-12',
      rackNumber: 'R-03',
      callNumber: 'QA76.73.J38 B56',
      vendor: 'TechPress Distributors',
      purchaseDate: new Date('2025-01-10'),
      purchasePrice: 45.99,
      numberOfCopies: 5,
      availableCopies: 4,
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      description: 'The definitive guide to Java platform best practices, updated for Java 9.',
      keywords: 'Java, Programming, Clean Code, OOP',
      status: 'AVAILABLE'
    },
    {
      isbn: '978-0132350884',
      barcode: 'B000000002',
      qrCode: 'Q000000002',
      title: 'Clean Code',
      subtitle: 'A Handbook of Agile Software Craftsmanship',
      authors: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      edition: '1st Edition',
      publicationYear: 2008,
      language: 'English',
      category: 'Computer Science',
      genre: 'Software Engineering',
      shelfNumber: 'S-12',
      rackNumber: 'R-04',
      callNumber: 'QA76.76.D47 M37',
      vendor: 'TechPress Distributors',
      purchaseDate: new Date('2025-01-15'),
      purchasePrice: 42.50,
      numberOfCopies: 8,
      availableCopies: 8,
      coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
      keywords: 'Refactoring, Clean Code, Agile, Programming',
      status: 'AVAILABLE'
    },
    {
      isbn: '978-1491950296',
      barcode: 'B000000003',
      qrCode: 'Q000000003',
      title: 'Designing Data-Intensive Applications',
      subtitle: 'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
      authors: 'Martin Kleppmann',
      publisher: "O'Reilly Media",
      edition: '1st Edition',
      publicationYear: 2017,
      language: 'English',
      category: 'Computer Science',
      genre: 'System Architecture',
      shelfNumber: 'S-14',
      rackNumber: 'R-01',
      callNumber: 'TK5105.88813 .K54',
      vendor: 'OReilly Retail',
      purchaseDate: new Date('2025-02-01'),
      purchasePrice: 49.99,
      numberOfCopies: 3,
      availableCopies: 2,
      coverImage: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400',
      description: 'An in-depth guide to the principles and practicalities of processing and storing data across modern systems.',
      keywords: 'Distributed Systems, Database, Scale, Architecture',
      status: 'AVAILABLE'
    },
    {
      isbn: '978-0262033848',
      barcode: 'B000000004',
      qrCode: 'Q000000004',
      title: 'Introduction to Algorithms',
      subtitle: 'Comprehensive Reference on Algorithms and Data Structures',
      authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      publisher: 'MIT Press',
      edition: '3rd Edition',
      publicationYear: 2009,
      language: 'English',
      category: 'Computer Science',
      genre: 'Algorithms',
      shelfNumber: 'S-10',
      rackNumber: 'R-02',
      callNumber: 'QA76.6 .I585',
      vendor: 'MIT Press Direct',
      purchaseDate: new Date('2025-02-15'),
      purchasePrice: 85.00,
      numberOfCopies: 4,
      availableCopies: 4,
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400',
      description: 'Some books on algorithms are rigorous but incomplete; others cover masses of material but lack rigor. Introduction to Algorithms uniquely combines rigor and comprehensiveness.',
      keywords: 'Algorithms, Data Structures, Math, CS',
      status: 'AVAILABLE'
    },
    {
      isbn: '978-0062315007',
      barcode: 'B000000005',
      qrCode: 'Q000000005',
      title: 'The Alchemist',
      subtitle: 'A Fable About Following Your Dream',
      authors: 'Paulo Coelho',
      publisher: 'HarperOne',
      edition: 'Reissue Edition',
      publicationYear: 2014,
      language: 'English',
      category: 'Fiction',
      genre: 'Drama',
      shelfNumber: 'F-02',
      rackNumber: 'R-01',
      callNumber: 'PQ9698.13.O3 A813',
      vendor: 'BookStream Logistics',
      purchaseDate: new Date('2025-03-01'),
      purchasePrice: 16.99,
      numberOfCopies: 10,
      availableCopies: 10,
      coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400',
      description: 'A magical story about Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure.',
      keywords: 'Fiction, Philosophy, Novel, Paulo Coelho',
      status: 'AVAILABLE'
    }
  ];

  const seededBooks = [];
  for (const b of books) {
    const book = await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: b,
      create: b
    });
    seededBooks.push(book);
  }

  // 4. Seeding Transactions & Fines
  const student = seededUsers.find((u) => u.role === 'STUDENT')!;
  const librarian = seededUsers.find((u) => u.role === 'LIBRARIAN')!;
  
  // Outstanding transaction
  const activeTx = await prisma.transaction.create({
    data: {
      bookId: seededBooks[0].id, // Effective Java
      memberId: student.id,
      issuedById: librarian.id,
      issueDate: new Date('2026-06-15'),
      dueDate: new Date('2026-06-29'),
      status: 'ISSUED'
    }
  });

  // Overdue and Returned with Fine
  const returnedTx = await prisma.transaction.create({
    data: {
      bookId: seededBooks[2].id, // Designing Data-Intensive Applications
      memberId: student.id,
      issuedById: librarian.id,
      issueDate: new Date('2026-06-01'),
      dueDate: new Date('2026-06-15'),
      returnDate: new Date('2026-06-20'),
      returnedById: librarian.id,
      status: 'RETURNED'
    }
  });

  // Add Fine for Returned Transaction
  const fine = await prisma.fine.create({
    data: {
      transactionId: returnedTx.id,
      memberId: student.id,
      amount: 10.0, // 5 days overdue * $2/day fine
      paidAmount: 0.0,
      waivedAmount: 0.0,
      reason: 'Returned 5 days late',
      status: 'UNPAID'
    }
  });

  // 5. Seeding Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: seededUsers.find(u => u.role === 'SUPER_ADMIN')?.id,
        action: 'SYSTEM_SEED',
        details: JSON.stringify({ message: 'Database initial seed executed successfully.' }),
        ipAddress: '127.0.0.1'
      },
      {
        userId: librarian.id,
        action: 'BOOK_ISSUE',
        details: JSON.stringify({ transactionId: activeTx.id, bookTitle: seededBooks[0].title }),
        ipAddress: '127.0.0.1'
      }
    ]
  });

  console.log('Seeding Completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
