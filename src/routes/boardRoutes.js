const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

console.log("✅ BoardRoutes file loaded");
router.get("/courses", boardController.getCourses);
router.get('/boards', boardController.getBoards);
router.get('/classes', boardController.getClasses);
router.post('/subjects', boardController.getSubjects);
router.get('/chapters', boardController.getChapters);

module.exports = router;
