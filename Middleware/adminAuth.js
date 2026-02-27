
const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
  try {
   
    const cookieToken = req.cookies?.AdminToken;
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided, unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Attach admin data
    req.adminId = decoded;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = adminAuth;
