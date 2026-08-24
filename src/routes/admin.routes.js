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
router.get(
  "/courses",
  authenticate,
  authorize("admin"),
  adminController.getCourses
);

router.post(
  "/courses",
  authenticate,
  authorize("admin"),
  adminController.createCourse
);

router.put(
  "/courses/:id",
  authenticate,
  authorize("admin"),
  adminController.updateCourse
);

router.get(
  "/subjects",
  authenticate,
  authorize("admin"),
  adminController.getSubjects
);

router.post(
  "/subjects",
  authenticate,
  authorize("admin"),
  adminController.createSubject
);

router.get(
  "/course-subjects",
  authenticate,
  authorize("admin"),
  adminController.getCourseSubjects
);

router.post(
  "/course-subjects",
  authenticate,
  authorize("admin"),
  adminController.saveCourseSubjects
);

router.get(
  "/bookings",
  authenticate,
  authorize("admin"),
  adminController.getAdminBookings
);

router.get(
  "/payments",
  authenticate,
  authorize("admin"),
  adminController.getAdminPayments
);

module.exports = router;
