// Time Slot Controller
const supabase = require("../utils/supabase");

// Create time slot
exports.createTimeSlot = async (req, res) => {
  const { office_hour_id, start_time, end_time, capacity } = req.body;
  if (!office_hour_id || !start_time || !end_time) {
    return res
      .status(400)
      .json({ error: "office_hour_id, start_time, and end_time are required" });
  }
  const { data, error } = await supabase
    .from("time_slot")
    .insert([{ office_hour_id, start_time, end_time, capacity: capacity || 1 }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// List time slots (by office_hour_id)
exports.getTimeSlots = async (req, res) => {
  const { office_hour_id } = req.query;
  let query = supabase.from("time_slot").select("*");
  if (office_hour_id) query = query.eq("office_hour_id", office_hour_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Update time slot
exports.updateTimeSlot = async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, capacity } = req.body;
  const { data, error } = await supabase
    .from("time_slot")
    .update({ start_time, end_time, capacity })
    .eq("slot_id", id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Delete time slot
exports.deleteTimeSlot = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("time_slot").delete().eq("slot_id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Time slot deleted" });
};
