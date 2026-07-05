import express from 'express';
import { getUserProfile, updateUserProfile, getProfileById, getAllProfiles } from '../controllers/profileController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(getAllProfiles);
router.route('/me').get(protect, getUserProfile);
router.route('/:id').get(getProfileById).put(protect, updateUserProfile);


export default router;
