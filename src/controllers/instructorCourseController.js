// Instructor-Course Assignment Controller
const  supabase = require('../utils/supabase');

// Assign instructor to course
exports.assignInstructor = async (req, res) => {
  const { instructor_id, course_id } = req.body;
  if (!instructor_id || !course_id) {
    return res.status(400).json({ error: 'instructor_id and course_id are required' });
  }
  const { data, error } = await supabase
    .from('instructor_course')
    .insert([{ instructor_id, course_id }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// List instructor's courses
exports.getInstructorCourses = async (req, res) => {
  const { instructor_id, course_id } = req.query;
  let query = supabase.from('instructor_course').select('*');
  if (instructor_id) query = query.eq('instructor_id', instructor_id);
  if (course_id) query = query.eq('course_id', course_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Remove instructor from course
exports.deleteInstructorCourse = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('instructor_course')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Instructor removed from course' });
};
