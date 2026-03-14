const express = require('express');
const router = express.Router();
const masterController = require('../controllers/boardController'); // You can rename the file to masterController later

console.log("✅ Master Data Routes file loaded");
// 👇 ADD THIS LINE TO DEBUG
console.log("DEBUG: masterController keys:", Object.keys(masterController));

console.log("✅ Master Data Routes file loaded");

// 1. Get All Master Data (For initial dropdowns)
router.get("/courses", masterController.getCourses);      // Merged Boards + Courses
router.get('/classes', masterController.getAllClasses);   // Master Class list (6th-10th)
router.get('/subjects', masterController.getAllSubjects); // Master Subject list (For Tutor expertise)

// 2. Filtered Data (Dynamic fetching)
// Get subjects specific to a course (e.g., Foundation subjects for a student)
router.get('/subjects-by-course', masterController.getSubjectsByCourse);
router.get("/courses-by-subject", masterController.getCoursesBySubject);

// 3. Educational Content
router.get('/chapters', masterController.getChapters);

module.exports = router;