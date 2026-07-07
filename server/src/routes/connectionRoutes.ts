import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  sendRequest,
  respondToRequest,
  disconnect,
  getMyConnections,
  getConnectionStatus,
} from '../controllers/connectionController';

const router = express.Router();

router.use(protect);

router.post('/', sendRequest);
router.get('/', getMyConnections);
router.get('/status/:userId', getConnectionStatus);  // must be before /:id
router.put('/:id', respondToRequest);
router.delete('/:id', disconnect);

export default router;
