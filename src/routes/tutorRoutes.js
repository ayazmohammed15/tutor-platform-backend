const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutorController');
const { authenticate, authorize } = require('../middleware/auth');
const { tutorProfileValidator } = require('../utils/validators');
const validate = require('../middleware/validate');

router.post('/profile', authenticate, authorize('tutor'), tutorProfileValidator, validate, tutorController.createProfile);
router.get('/profile/me', authenticate, authorize('tutor'), tutorController.getMyProfile);
router.put('/profile', authenticate, authorize('tutor'), tutorProfileValidator, validate, tutorController.updateProfile);

router.get('/status/:status', authenticate, authorize('admin'), tutorController.getTutorsByStatus);
router.put('/:tutorId/approve', authenticate, authorize('admin'), tutorController.approveTutor);
router.put('/:tutorId/reject', authenticate, authorize('admin'), tutorController.rejectTutor);

router.get('/search', authenticate, tutorController.searchTutors);
router.get('/:tutorId', authenticate, tutorController.getTutorDetails);

module.exports = router;
