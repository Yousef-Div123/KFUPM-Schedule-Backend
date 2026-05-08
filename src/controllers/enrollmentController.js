// Enrollment Controller
const supabase  = require("../utils/supabase");

// Enroll a student in a course
exports.createEnrollment = async (req, res) => {
  const { student_id, course_id } = req.body;
  if (!student_id || !course_id) {
    return res
      .status(400)
      .json({ error: "student_id and course_id are required" });
  }
  const { data, error } = await supabase
    .from("enrollment")
    .insert([{ student_id, course_id }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// List enrollments by student or course
exports.getEnrollments = async (req, res) => {
  const { student_id, course_id } = req.query;
  let query = supabase.from("enrollment").select("*");
  if (student_id) query = query.eq("student_id", student_id);
  if (course_id) query = query.eq("course_id", course_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Remove enrollment
exports.deleteEnrollment = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("enrollment")
    .delete()
    .eq("enrollment_id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Enrollment deleted" });
};
