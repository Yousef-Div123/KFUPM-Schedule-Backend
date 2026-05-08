const express = require("express");
const router = express.Router();
const instructorCourseController = require("../controllers/instructorCourseController");

// Assign instructor to course
router.post("/", instructorCourseController.assignInstructor);
// List instructor's courses
router.get("/", instructorCourseController.getInstructorCourses);
// Remove instructor from course
router.delete("/:id", instructorCourseController.deleteInstructorCourse);

module.exports = router;
