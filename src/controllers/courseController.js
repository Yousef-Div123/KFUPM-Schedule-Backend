// Course Controller
const supabase = require('../utils/supabase');

// Create a new course
exports.createCourse = async (req, res) => {
  const { course_name, course_code } = req.body;
  if (!course_name || !course_code) {
    return res.status(400).json({ error: 'course_name and course_code are required' });
  }
  const { data, error } = await supabase
    .from('course')
    .insert([{ course_name, course_code }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// Get all courses
exports.getCourses = async (req, res) => {
  const { data, error } = await supabase
    .from('course')
    .select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('course')
    .select('*')
    .eq('course_id', id)
    .single();
  if (error) return res.status(404).json({ error: 'Course not found' });
  res.json(data);
};

// Update course
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { course_name, course_code } = req.body;
  const { data, error } = await supabase
    .from('course')
    .update({ course_name, course_code })
    .eq('course_id', id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Delete course
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('course')
    .delete()
    .eq('course_id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Course deleted' });
};
