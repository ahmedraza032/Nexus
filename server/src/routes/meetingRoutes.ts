import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  scheduleMeeting,
  getMeetings,
  getMeetingById,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting,
  updateMeeting,
  deleteMeeting,
} from '../controllers/meetingController';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', scheduleMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingById);
router.put('/:id/accept', acceptMeeting);
router.put('/:id/reject', rejectMeeting);
router.put('/:id/cancel', cancelMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

export default router;
