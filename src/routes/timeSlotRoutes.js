const express = require("express");
const router = express.Router();
const timeSlotController = require("../controllers/timeSlotController");

// Create time slot
router.post("/", timeSlotController.createTimeSlot);
// List time slots
router.get("/", timeSlotController.getTimeSlots);
// Update time slot
router.put("/:id", timeSlotController.updateTimeSlot);
// Delete time slot
router.delete("/:id", timeSlotController.deleteTimeSlot);

module.exports = router;
