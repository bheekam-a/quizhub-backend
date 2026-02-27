const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
 const Admin=require("./models/Admin");
const bcrypt = require("bcryptjs");

const app = express();

// Middlewares
// app.use(express.json());  // je only json  ke form me hi data le sakta hai fronted se  backend side pe 
app.use(express.json({ type: ['application/json', 'text/plain'] })); // 👈 ye add karna  je dono type ka data le sakta hai backend side pe 
// app.use(cors());     // it work when we doest pass cookies ok 
// app.use(cors({
//   origin: "*",  // ❌ wildcard does NOT work with credentials
//   credentials: true
// }));
const cookieParser = require("cookie-parser");
app.use(cookieParser());


// user ke brower me cookies es ke bina hongi es liye je likhna jaruri hai 
app.use(cors({
  origin: "http://localhost:5173", // ✅ your frontend URL
  credentials: true               // ✅ allow cookies
}));




// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin",require("./routes/admin"));  
app.use("/api/excel",require("./routes/excel"));
app.use("/api/test",require("./routes/testInformation"));
app.use("/api/protectedRouteVerification", require("./routes/protectedRouteVerification"));

// app.use("/api/cart",require("./routes/cart"));
// Test Route
app.get("/", (req, res) => {
  res.send("Flipkart Clone Backend Running 🚀");
});



// Auto-submit expired attempts
// const Attempt = require("./models/Attempt");
// const Test = require("./models/ConductTest");

// setInterval(async () => {
//   const now = new Date();
//   const attempts = await Attempt.find({ status: "ongoing" }).populate("testId");
//   for (let att of attempts) {
//     const endTime = new Date(att.startTime);
//     endTime.setMinutes(endTime.getMinutes() + att.testId.duration);
//     if (now >= endTime) {
//       att.status = "expired";
//       await att.save();
//     }
//   }
// });


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  // useNewUrlParser: true,
  // useUnifiedTopology: true,

  .then(() => { 
     console.log("✅ MongoDB connected");

  const createAdmin = async () => {
          const existingAdmin = await Admin.findOne({ email:"admin.quiz@quizmaster.com"});
       
          if (existingAdmin) {
            console.log("Admin already exists ✅");
            return;
             }

          const hashedPassword = await bcrypt.hash("supersecure123", 10);

          const admin = new Admin({
            name: "Admin",
            email: "admin.quiz@quizmaster.com",
            password: hashedPassword,
            role:"admin"
             });

          await admin.save();
          console.log("Admin created successfully 🚀");
              };

        createAdmin();
  
  }

        )

  .catch(err => console.error("❌ MongoDB error: ", err.message));





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
