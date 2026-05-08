const express = require('express');
const router = express.Router();

const courseController = require('../controllers/courseController');
const { authenticateToken, requireInstructor } = require('../middleware/auth');

// Create course (requires login)
router.post('/', courseController.createCourse);
// Get all courses
router.get('/', courseController.getCourses);
// Get course by ID
router.get('/:id', courseController.getCourseById);
// Update course (requires login)
router.put('/:id', courseController.updateCourse);
// Delete course (requires login)
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
