// Booking Controller
const supabase = require("../utils/supabase");

// Book a slot
exports.createBooking = async (req, res) => {
  const { student_id, slot_id, status } = req.body;
  if (!student_id || !slot_id) {
    return res
      .status(400)
      .json({ error: "student_id and slot_id are required" });
  }
  const { data, error } = await supabase
    .from("booking")
    .insert([{ student_id, slot_id, status: status || "Booked" }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// List bookings (by student or slot)
exports.getBookings = async (req, res) => {
  const { student_id, slot_id } = req.query;
  let query = supabase.from("booking").select("*");
  if (student_id) query = query.eq("student_id", student_id);
  if (slot_id) query = query.eq("slot_id", slot_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("booking")
    .update({ status: "Cancelled" })
    .eq("booking_id", id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Complete booking
exports.completeBooking = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("booking")
    .update({ status: "Completed" })
    .eq("booking_id", id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};
