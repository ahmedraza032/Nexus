import express from 'express';
import { getUserProfile, updateUserProfile, getProfileById, getAllProfiles, markNotificationsAsRead, uploadAvatar, optionalProtect } from '../controllers/profileController';
import { protect } from '../middleware/authMiddleware';
import { avatarUpload } from '../middleware/upload';

const router = express.Router();

router.route('/').get(getAllProfiles);
router.route('/me').get(protect, getUserProfile);
router.route('/me/notifications/read').put(protect, markNotificationsAsRead);
router.route('/avatar').post(protect, avatarUpload.single('avatar'), uploadAvatar);
router.route('/:id').get(optionalProtect, getProfileById).put(protect, updateUserProfile);

export default router;
