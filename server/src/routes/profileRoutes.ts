import express from 'express';
import { getUserProfile, updateUserProfile, getProfileById, getAllProfiles, markNotificationsAsRead, optionalProtect } from '../controllers/profileController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(getAllProfiles);
router.route('/me').get(protect, getUserProfile);
router.route('/me/notifications/read').put(protect, markNotificationsAsRead);
router.route('/:id').get(optionalProtect, getProfileById).put(protect, updateUserProfile);

export default router;
