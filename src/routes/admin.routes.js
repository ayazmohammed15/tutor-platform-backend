const express = require("express");
const router = express.Router();

const { sendTutorInvite, getPendingTutors } = require("../controllers/admin.controller");
const tutorController = require("../controllers/tutorController");

const { authenticate, authorize } = require("../middleware/auth");

router.post(
  "/send-tutor-invite",
  authenticate,
  authorize("admin"),
  sendTutorInvite
);

router.get(
  "/pending-tutors",
  authenticate,
  authorize("admin"),
  getPendingTutors
);

router.put(
  "/approve/:tutorId",
  authenticate,
  authorize("admin"),
  tutorController.approveTutor
);

router.put(
  "/reject/:tutorId",
  authenticate,
  authorize("admin"),
  tutorController.rejectTutor
);

module.exports = router;
