import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/audit';
import { generateBarcodeSVG, generateQRCodeSVG } from '../utils/codeGenerator';

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    if (!data.isbn || !data.title || !data.authors || !data.publisher || !data.category || !data.genre) {
      return next(new AppError('Required fields: isbn, title, authors, publisher, category, genre', 400));
    }

    const existingBook = await prisma.book.findUnique({ where: { isbn: data.isbn } });
    if (existingBook) {
      return next(new AppError('A book with this ISBN already exists', 400));
    }

    // Auto-generate barcode and qrCode if not provided
    const barcode = data.barcode || `B${Date.now()}`;
    const qrCode = data.qrCode || `Q${Date.now()}`;

    const book = await prisma.book.create({
      data: {
        isbn: data.isbn,
        barcode,
        qrCode,
        title: data.title,
        subtitle: data.subtitle,
        authors: data.authors,
        publisher: data.publisher,
        edition: data.edition,
        publicationYear: Number(data.publicationYear) || new Date().getFullYear(),
        language: data.language || 'English',
        category: data.category,
        genre: data.genre,
        shelfNumber: data.shelfNumber || 'General',
        rackNumber: data.rackNumber || 'General',
        callNumber: data.callNumber || 'General',
        vendor: data.vendor,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : null,
        numberOfCopies: Number(data.numberOfCopies) || 1,
        availableCopies: Number(data.numberOfCopies) || 1,
        coverImage: data.coverImage,
        description: data.description,
        keywords: data.keywords,
        status: data.status || 'AVAILABLE'
      }
    });

    await logActivity(req.user?.id || null, 'BOOK_CREATE', { id: book.id, title: book.title }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book
    });
  } catch (error) {
    next(error);
  }
};

export const getBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, status, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    
    if (category) {
      where.category = String(category);
    }
    
    if (status) {
      where.status = String(status);
    }

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { title: { contains: searchStr, mode: 'insensitive' } },
        { subtitle: { contains: searchStr, mode: 'insensitive' } },
        { isbn: { contains: searchStr, mode: 'insensitive' } },
        { barcode: { contains: searchStr, mode: 'insensitive' } },
        { authors: { contains: searchStr, mode: 'insensitive' } },
        { publisher: { contains: searchStr, mode: 'insensitive' } },
        { keywords: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.book.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { issueDate: 'desc' },
          take: 10,
          include: {
            member: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        reservations: {
          where: { status: 'PENDING' },
          include: {
            member: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!book) {
      return next(new AppError('Book not found', 404));
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return next(new AppError('Book not found', 404));
    }

    // Handle available copies adjustments if total copies change
    let availableCopies = book.availableCopies;
    if (data.numberOfCopies !== undefined) {
      const difference = Number(data.numberOfCopies) - book.numberOfCopies;
      availableCopies = Math.max(0, book.availableCopies + difference);
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        isbn: data.isbn,
        barcode: data.barcode,
        qrCode: data.qrCode,
        title: data.title,
        subtitle: data.subtitle,
        authors: data.authors,
        publisher: data.publisher,
        edition: data.edition,
        publicationYear: data.publicationYear ? Number(data.publicationYear) : undefined,
        language: data.language,
        category: data.category,
        genre: data.genre,
        shelfNumber: data.shelfNumber,
        rackNumber: data.rackNumber,
        callNumber: data.callNumber,
        vendor: data.vendor,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        numberOfCopies: data.numberOfCopies ? Number(data.numberOfCopies) : undefined,
        availableCopies,
        coverImage: data.coverImage,
        description: data.description,
        keywords: data.keywords,
        status: data.status
      }
    });

    await logActivity(req.user?.id || null, 'BOOK_UPDATE', { id: book.id, title: book.title }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        transactions: {
          where: { status: 'ISSUED' }
        }
      }
    });

    if (!book) {
      return next(new AppError('Book not found', 404));
    }

    if (book.transactions.length > 0) {
      return next(new AppError('Cannot delete book. Some copies are currently issued.', 400));
    }

    await prisma.book.delete({ where: { id } });

    await logActivity(req.user?.id || null, 'BOOK_DELETE', { id: book.id, title: book.title }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const duplicateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return next(new AppError('Book not found', 404));
    }

    const uniqueId = Date.now();
    const duplicatedBook = await prisma.book.create({
      data: {
        isbn: `${book.isbn}-DUP-${uniqueId}`,
        barcode: `B${uniqueId}`,
        qrCode: `Q${uniqueId}`,
        title: `${book.title} (Copy)`,
        subtitle: book.subtitle,
        authors: book.authors,
        publisher: book.publisher,
        edition: book.edition,
        publicationYear: book.publicationYear,
        language: book.language,
        category: book.category,
        genre: book.genre,
        shelfNumber: book.shelfNumber,
        rackNumber: book.rackNumber,
        callNumber: book.callNumber,
        vendor: book.vendor,
        purchaseDate: book.purchaseDate,
        purchasePrice: book.purchasePrice,
        numberOfCopies: book.numberOfCopies,
        availableCopies: book.numberOfCopies,
        coverImage: book.coverImage,
        description: book.description,
        keywords: book.keywords,
        status: 'AVAILABLE'
      }
    });

    await logActivity(req.user?.id || null, 'BOOK_DUPLICATE', { originalId: book.id, duplicatedId: duplicatedBook.id }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Book duplicated successfully',
      data: duplicatedBook
    });
  } catch (error) {
    next(error);
  }
};

// SVG visual representations
export const getBarcode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value } = req.params;
    const svg = generateBarcodeSVG(value);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  } catch (error) {
    next(error);
  }
};

export const getQRCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value } = req.params;
    const svg = generateQRCodeSVG(value);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  } catch (error) {
    next(error);
  }
};

// CSV Import & Export
export const bulkImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { books } = req.body; // Array of book objects
    
    if (!Array.isArray(books) || books.length === 0) {
      return next(new AppError('Invalid list of books provided', 400));
    }

    const createdBooks = [];
    const errors = [];

    for (const b of books) {
      try {
        const barcode = b.barcode || `B${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const qrCode = b.qrCode || `Q${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const book = await prisma.book.create({
          data: {
            isbn: b.isbn,
            barcode,
            qrCode,
            title: b.title,
            subtitle: b.subtitle,
            authors: b.authors,
            publisher: b.publisher,
            edition: b.edition,
            publicationYear: Number(b.publicationYear) || new Date().getFullYear(),
            language: b.language || 'English',
            category: b.category,
            genre: b.genre,
            shelfNumber: b.shelfNumber || 'General',
            rackNumber: b.rackNumber || 'General',
            callNumber: b.callNumber || 'General',
            numberOfCopies: Number(b.numberOfCopies) || 1,
            availableCopies: Number(b.numberOfCopies) || 1,
            description: b.description,
            coverImage: b.coverImage,
            status: 'AVAILABLE'
          }
        });
        createdBooks.push(book);
      } catch (err: any) {
        errors.push({ isbn: b.isbn, error: err.message });
      }
    }

    await logActivity(req.user?.id || null, 'BOOK_BULK_IMPORT', { count: createdBooks.length, failed: errors.length }, req.ip);

    res.status(200).json({
      success: true,
      message: `Bulk import completed. Imported: ${createdBooks.length}, Failed: ${errors.length}`,
      data: {
        importedCount: createdBooks.length,
        failedCount: errors.length,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
};
