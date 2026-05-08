const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../utils/supabase");

const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  const { name, email, password, role} = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }
  try {
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .single();
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered." });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert user
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, role }])
      .select("user_id, name, email, role")
      .single();
    if (error) throw error;
    res.status(201).json({ user: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
