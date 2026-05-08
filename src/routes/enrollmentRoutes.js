const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");

// Enroll a student in a course
router.post("/", enrollmentController.createEnrollment);
// List enrollments by student or course
router.get("/", enrollmentController.getEnrollments);
// Remove enrollment
router.delete("/:id", enrollmentController.deleteEnrollment);

module.exports = router;
