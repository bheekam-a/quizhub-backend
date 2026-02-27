
const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  const token = req.cookies.authToken;
  console.log("cookies",token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
    // WE STORE THE USERID IN THE req.userid  parameter ok 
    req.userId= decoded.id;   
   
    // inside verifyToken middleware
console.log("Token decoded userId:", decoded.id);

    next();   // Pass control to the next middleware/route
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};


 module.exports = { verifyToken};
