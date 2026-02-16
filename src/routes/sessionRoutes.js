const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate, authorize } = require('../middleware/auth');
const { sessionRequestValidator } = require('../utils/validators');
const validate = require('../middleware/validate');

router.post('/requests', authenticate, authorize('student'), sessionRequestValidator, validate, sessionController.createSessionRequest);
router.get('/requests/my', authenticate, sessionController.getMyRequests);
router.get('/requests/pending', authenticate, authorize('tutor'), sessionController.getPendingRequests);
router.put('/requests/:requestId/accept', authenticate, authorize('tutor'), sessionController.acceptRequest);
router.put('/requests/:requestId/reject', authenticate, authorize('tutor'), sessionController.rejectRequest);
router.put('/requests/:requestId/suggest', authenticate, authorize('tutor'), sessionController.suggestAlternateDate);

router.get('/', authenticate, sessionController.getMySessions);
router.get('/:sessionId', authenticate, sessionController.getSessionDetails);

module.exports = router;
