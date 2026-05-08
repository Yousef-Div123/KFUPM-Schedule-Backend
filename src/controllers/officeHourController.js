// Office Hour Session Controller
const supabase = require("../utils/supabase");

// Create office hour session
exports.createOfficeHour = async (req, res) => {
  const { schedule_id, date, status } = req.body;
  if (!schedule_id || !date) {
    return res.status(400).json({ error: "schedule_id and date are required" });
  }
  const { data, error } = await supabase
    .from("office_hour")
    .insert([{ schedule_id, date, status: status || "active" }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// List office hour sessions (by schedule or date)
exports.getOfficeHours = async (req, res) => {
  const { schedule_id, date } = req.query;
  let query = supabase.from("office_hour").select("*");
  if (schedule_id) query = query.eq("schedule_id", schedule_id);
  if (date) query = query.eq("date", date);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Update office hour status
exports.updateOfficeHour = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { data, error } = await supabase
    .from("office_hour")
    .update({ status })
    .eq("office_hour_id", id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Cancel office hour
exports.cancelOfficeHour = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("office_hour")
    .update({ status: "cancelled" })
    .eq("office_hour_id", id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};
