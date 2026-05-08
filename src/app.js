const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const userRoutes = require("./routes/userRoutes");

const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

const instructorCourseRoutes = require("./routes/instructorCourseRoutes");

const officeHourScheduleRoutes = require("./routes/officeHourScheduleRoutes");

const officeHourRoutes = require("./routes/officeHourRoutes");

const timeSlotRoutes = require("./routes/timeSlotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoutes);

app.use("/api/courses", courseRoutes);

app.use("/api/enrollments", enrollmentRoutes);

app.use("/api/instructor-courses", instructorCourseRoutes);

app.use("/api/schedules", officeHourScheduleRoutes);

app.use("/api/office-hours", officeHourRoutes);

app.use("/api/time-slots", timeSlotRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
  res.send("Office Hour Booking Backend Running");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
