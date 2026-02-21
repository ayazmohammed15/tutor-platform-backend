const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticate, authorize } = require('../middleware/auth');
const { availabilitySlotValidator } = require('../utils/validators');
const validate = require('../middleware/validate');

// router.get('/tutor/:tutorId/date/:date',authenticate,availabilityController.getAvailableSlots);
router.get('/tutor/:tutorId/date/:date',authenticate,availabilityController.getAvailableSlotsByDate);
router.post('/save', authenticate, authorize('tutor'), availabilityController.saveAvailability);
router.post('/', authenticate, authorize('tutor'), availabilitySlotValidator, validate, availabilityController.createSlot);
router.get('/my-slots', authenticate, authorize('tutor'), availabilityController.getMySlots);
router.get('/tutor/:tutorId', authenticate, availabilityController.getTutorSlots);
router.put('/:slotId', authenticate, authorize('tutor'), availabilityController.updateSlot);
router.delete('/:slotId', authenticate, authorize('tutor'), availabilityController.deleteSlot);



module.exports = router;
