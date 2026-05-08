const jwt = require("jsonwebtoken");

// Middleware to verify JWT and extract user info
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // user object should contain user_id and role
    next();
  });
}

// Middleware to check if user is an instructor
function requireInstructor(req, res, next) {
  if (!req.user || req.user.role !== "Instructor") {
    return res.status(403).json({ error: "Instructor access required" });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireInstructor,
};
