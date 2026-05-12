const { body } = require('express-validator');
const GENERAL_COURSE_SLUGS = [
  'school-tuition',
  'cbse-school-tuition'
];

const ENGINEERING_COURSE_SLUGS = [
  'iit-jee',
  'neet',
  'foundation-iit-jee'
];

const registerValidator = [

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1 })
    .withMessage('Last name must be at least 1 character long'),

  body('phone')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be valid'),

  // COURSE VALIDATION
  body('course')
    .notEmpty()
    .withMessage('Course is required')
    .custom((value) => {

      const validCourses = [
        ...GENERAL_COURSE_SLUGS,
        ...ENGINEERING_COURSE_SLUGS
      ];

      if (!validCourses.includes(value)) {
        throw new Error('Invalid course selected');
      }

      return true;
    }),

  // CATEGORY VALIDATION
  body('student_category')
    .optional()
    .isIn(['general', 'engineering'])
    .withMessage('Invalid student category'),

  // CLASS VALIDATION
  body('class_id')
    .optional()
    .custom((value, { req }) => {

      // School/CBSE students require class
      if (
        GENERAL_COURSE_SLUGS.includes(req.body.course)
      ) {

        if (!value) {
          throw new Error('Class is required');
        }

        const classNum = Number(value);

        if (!Number.isInteger(classNum) || classNum < 1) {
          throw new Error('Invalid class selected');
        }
      }

      return true;
    }),

  // SUBJECTS VALIDATION
  body('subjects')
    .isArray({ min: 1 })
    .withMessage('Please select at least one subject')

];


const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const tutorProfileValidator = [
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),
  body('education')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Education must not exceed 500 characters'),
  body('experience_years')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience years must be a positive number'),
  body('hourly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number')
];

const sessionRequestValidator = [
  body('tutor_id')
    .notEmpty()
    .withMessage('Tutor ID is required')
    .isInt()
    .withMessage('Tutor ID must be a number'),
  body('subject_id')
    .optional()
    .isInt()
    .withMessage('Subject ID must be a number'),
  body('requested_date')
    .notEmpty()
    .withMessage('Requested date is required')
    .isDate()
    .withMessage('Invalid date format'),
  body('requested_time')
    .notEmpty()
    .withMessage('Requested time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format (HH:MM)')
];

const availabilitySlotValidator = [
  body('day_of_week')
    .notEmpty()
    .withMessage('Day of week is required')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body('start_time')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('end_time')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format (HH:MM)')
];

module.exports = {
  registerValidator,
  loginValidator,
  tutorProfileValidator,
  sessionRequestValidator,
  availabilitySlotValidator
};
