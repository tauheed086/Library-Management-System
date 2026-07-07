import { Router } from 'express';
import { createBook, getBooks, getBookById, updateBook, deleteBook, duplicateBook, getBarcode, getQRCode, bulkImport } from '../controllers/books.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// Barcode & QR routes (can be loaded by images/tags directly)
router.get('/barcode/:value', getBarcode);
router.get('/qrcode/:value', getQRCode);

// Book operations
router.get('/', authenticate, getBooks);
router.get('/:id', authenticate, getBookById);
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), createBook);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), updateBook);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), deleteBook);
router.post('/:id/duplicate', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), duplicateBook);
router.post('/bulk-import', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), bulkImport);

export default router;
