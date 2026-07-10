import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { upload, signatureUpload } from '../middleware/upload';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  previewDocument,
  shareDocument,
  signDocument,
  updateDocumentStatus,
  deleteDocument,
} from '../controllers/documentController';

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);
router.get('/:id/preview', previewDocument);
router.put('/:id/share', shareDocument);
router.put('/:id/sign', signatureUpload.single('signature'), signDocument);
router.put('/:id/status', updateDocumentStatus);
router.delete('/:id', deleteDocument);

export default router;
