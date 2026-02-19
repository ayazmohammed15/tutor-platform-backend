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
