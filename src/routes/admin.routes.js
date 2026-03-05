const express = require("express");
const router = express.Router();

const  adminController = require("../controllers/admin.controller");
const tutorController = require("../controllers/tutorController");

const { authenticate, authorize } = require("../middleware/auth");

router.post(
  "/send-tutor-invite",
  authenticate,
  authorize("admin"),
  adminController.sendTutorInvite
);
router.get(
  "/students",
  authenticate,
  authorize("admin"),
  adminController.getStudents
);

router.get(
  "/tutors/status/:status",
  authenticate,
  authorize("admin"),
  tutorController.getTutorsByStatus
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
