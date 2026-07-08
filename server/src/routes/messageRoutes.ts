import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getConversations,
  getMessages,
  markAsRead,
  sendMessageREST
} from '../controllers/messageController';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.put('/read/:userId', markAsRead);
router.post('/', sendMessageREST);

export default router;
