const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Book a slot
router.post("/", bookingController.createBooking);
// List bookings
router.get("/", bookingController.getBookings);
// Cancel booking
router.patch("/:id/cancel", bookingController.cancelBooking);
// Complete booking
router.patch("/:id/complete", bookingController.completeBooking);

module.exports = router;
