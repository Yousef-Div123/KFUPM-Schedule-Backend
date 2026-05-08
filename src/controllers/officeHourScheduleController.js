// Office Hour Schedule Controller
const supabase = require("../utils/supabase");

// Create office hour schedule
exports.createSchedule = async (req, res) => {
  const {
    instructor_id,
    course_id,
    day_of_week,
    start_time,
    end_time,
    start_date,
    end_date,
  } = req.body;
  if (
    !instructor_id ||
    !course_id ||
    !day_of_week ||
    !start_time ||
    !end_time ||
    !start_date ||
    !end_date
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const { data, error } = await supabase
    .from("office_hour_schedule")
    .insert([
      {
        instructor_id,
        course_id,
        day_of_week,
        start_time,
        end_time,
        start_date,
        end_date,
      },
    ])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// List schedules (by instructor or course)
exports.getSchedules = async (req, res) => {
  const { instructor_id, course_id } = req.query;
  let query = supabase.from("office_hour_schedule").select("*");
  if (instructor_id) query = query.eq("instructor_id", instructor_id);
  if (course_id) query = query.eq("course_id", course_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time, start_date, end_date } = req.body;
  const { data, error } = await supabase
    .from("office_hour_schedule")
    .update({ day_of_week, start_time, end_time, start_date, end_date })
    .eq("schedule_id", id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("office_hour_schedule")
    .delete()
    .eq("schedule_id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Schedule deleted" });
};
