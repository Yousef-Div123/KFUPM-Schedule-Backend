const express = require("express");
const router = express.Router();
const officeHourController = require("../controllers/officeHourController");

// Create office hour session
router.post("/", officeHourController.createOfficeHour);
// List office hour sessions
router.get("/", officeHourController.getOfficeHours);
// Update office hour status
router.put("/:id", officeHourController.updateOfficeHour);
// Cancel office hour
router.patch("/:id/cancel", officeHourController.cancelOfficeHour);

module.exports = router;
