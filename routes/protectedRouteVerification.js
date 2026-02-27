const express = require("express");
const router = express.Router();
const Attempt = require("../models/Attempt");
const Test = require("../models/ConductTest");
const { verifyToken } = require("../Middleware/auth");

// ---------------------------------------------
// 🔹 1️⃣ Route: Auth Check (Protected)
// ---------------------------------------------
router.get("/auth-check", verifyToken, async (req, res) => {
  try {
    // Agar auth middleware ne user set kar diya
    if (!req.userId) {
      return res.json({ ok: false, message: "Unauthorized - token missing" });
    }

    res.json({
      ok: true,
      message: "User authenticated",
      user: req.user,
    });
  } catch (err) {
    console.error("Auth Check Error:", err);
    res.json({ ok: false, message: "Server error in auth-check" });
  }
});

// ---------------------------------------------
// 🔹 2️⃣ Route: Valid Attempt Check
// ---------------------------------------------
// Ye route tab call hoga jab ProtectedRoute me needAttempt = true hoga
router.post("/has-valid-attempt", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { testId } = req.body;

    if (!testId) {
      return res.json({ ok: false, message: "Test ID is required" });
    }

    // Check karo test exist karta hai ya nahi
    const test = await Test.findById(testId);
    if (!test) {
      return res.json({ ok: false, message: "Test not found" });
    }

    // Ab check karo user ka active attempt hai kya
    const attempt = await Attempt.findOne({
      userId,
      testId,
      status: "ongoing", // means test ongoing  // means attempt create hua hai ya nhi 
    });

    if (!attempt) {
      return res.json({
        ok: false,
        message: "No active attempt found for this test",
      });
    }

    res.json({
      ok: true,
      message: "Valid attempt found",
      attemptId: attempt._id,
    });
  } catch (err) {
    console.error("Attempt Check Error:", err);
    res.json({ ok: false, message: "Server error in attempt-check" });
  }
});

// ---------------------------------------------
// 🔹 3️⃣ Future: Add more checks if needed
// ---------------------------------------------
// Example: /protectedRouteVerification/admin-only
// Example: /protectedRouteVerification/test-time-valid

module.exports = router;
