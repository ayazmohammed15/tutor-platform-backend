const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const authController = require("../controllers/authController");

const { authenticate } = require("../middleware/auth");
const { registerValidator, loginValidator } = require("../utils/validators");
const validate = require("../middleware/validate");

/*
|--------------------------------------------------------------------------
|  Normal Auth Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  registerValidator,
  validate,
  authController.register
);

router.post(
  "/register/school",
  registerValidator,
  validate,
  authController.registerSchool
);

router.post(
  "/register/engineering",
  registerValidator,
  validate,
  authController.registerEngineering
);

// Backward-compatible alias for clients using role-specific student registration path
router.post(
  "/register/student",
  registerValidator,
  validate,
  authController.register
);

router.post(
  "/login",
  loginValidator,
  validate,
  authController.login
);

router.get(
  "/profile",
  authenticate,
  authController.getProfile
);

router.put(
  "/profile",
  authenticate,
  authController.updateProfile
);

router.post("/set-password", authController.setPassword);


/*
|--------------------------------------------------------------------------
|  Tutor Invite Registration (With File Upload)
|--------------------------------------------------------------------------
*/

router.post(
  "/complete-registration",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]),
  authController.completeRegistration
);

module.exports = router;
