const express = require("express");
const router = express.Router();
const officeHourScheduleController = require("../controllers/officeHourScheduleController");

// Create office hour schedule
router.post("/", officeHourScheduleController.createSchedule);
// List schedules (by instructor or course)
router.get("/", officeHourScheduleController.getSchedules);
// Update schedule
router.put("/:id", officeHourScheduleController.updateSchedule);
// Delete schedule
router.delete("/:id", officeHourScheduleController.deleteSchedule);

module.exports = router;
