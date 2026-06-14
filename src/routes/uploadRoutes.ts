import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware, uploadFile } from '../controllers/uploadController';

const router = Router();

router.post('/upload', authenticate, uploadMiddleware, uploadFile);

export default router;