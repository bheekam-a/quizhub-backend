const express=require("express");
const router=express.Router();
const Admin=require("../models/Admin");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const verifyAdmin=require("../Middleware/adminAuth");
require("dotenv").config();
const Test = require("../models/ConductTest");
const Attempt = require("../models/Attempt");




router.post("/admin-login",async(req,res)=>{    // yes
      try{ 
       const admin= await Admin.findOne({email:req.body.email});
          if (!admin) {
            return res.status(400).json({success: false,message: "Admin not found. Please enter a correct email."   });
           }

       const passwordMatching=await bcrypt.compare(req.body.password,admin.password); 
        if (!passwordMatching) {
              return res.status(401).json({  success: false,message: "Incorrect password." });
           }

          const token=jwt.sign({id:admin._id,role:admin.role},process.env.JWT_SECRET,{expiresIn:"1h"});
          // ese cookies me add karna hai 
             res.cookie("AdminToken", token, {
                          httpOnly: true,
                          secure: false, // change to true on production (HTTPS)
                          sameSite: "Lax", // less restrictive, better for local dev
                          path: "/", // important for consistency
                          maxAge: 3600000,  // brower me cookies kitne time tak rahengi  means 1 h hai je 
                  });

        
           // Respond with success
                res.status(200).json({  success: true,message: "Login successful." });

        
       } catch (err) {
             res.status(500).json({   success: false, message: "Server error. Try again."  });
         }


         
});

// get all adin information
router.get("/all-admin-information", async(req,res)=>{
       const admin= await Admin.find();
      if (!admin) {
   return res.json({ message: "Admin not found" });
           }

       res.json({message:"successfulled",admin:admin});

});



// delete all admin 
router.delete("/delete-all-admin" ,async(req,res)=>{
   try{
     const admin= await Admin.findOne();
     if(!admin){
      return res.json({message:"already any admin is not present "});
     }
     await Admin.deleteMany();
   }
   catch(err){
    res.json({message:err.message})
     }

});




router.post("/admin-insert-data",verifyAdmin,async(req,res)=>{    // yes 
        try{
          //  const {testName,testDuration,conductedBy,testQuestions}= req.body ;
            
           const newTest= new Test (
                  //  testName: testName,
                  //  testDuration:testDuration,
                  //  conductedBy:conductedBy,
                  //  testQuestions:testQuestions, 
                       req.body 
                 
             
               );

               await newTest.save();

          res.json({message:"saved successfully" , data: newTest});



        }

        catch(err){

            res.json({message:err.message});

        }
});



router.get("/get-all-test-information",verifyAdmin,async (req,res)=>{   // yes

    try{
         const allTest= await Test.find(); 
         if(!allTest){
            return  res.json({message:"No record found !"});
         }
          res.json({message:"all  test :" , tests:allTest });
         
    }

    catch(err){
        res.json({message:err.message});
    }

});




router.get("/get-test/:id",verifyAdmin, async (req, res) => {  // yes
  try {
    const test = await Test.findById(req.params.id);
    res.json({ test });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});




router.delete("/delete-test/:id",verifyAdmin,async (req, res) => {   // yes 
  try {
    const test = await Test.deleteOne({ _id: req.params.id });      // Yaani test sirf ek delete operation ka result object hai, kuch aisa:{"acknowledged": true,"deletedCount": 1}
    res.json({ message: "Test deleted successfully"});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



router.delete("/delete-all-tests",verifyAdmin, async (req, res) => {    // yes
  try {
    const test = await Test.deleteMany();  // Yaani test sirf ek delete operation ka result object hai, kuch aisa:{"acknowledged": true,"deletedCount": 1}
      res.json({ message: "Tests deleted successfully"});
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});




router.put("/update-test/:id", async (req, res) => {   // 
  try {
    const updatedTest = req.body; // directly use req.body
    if (!updatedTest) return res.status(400).json({ message: "No test data provided" });

    const oldTest = await Test.findById(req.params.id);
    if (!oldTest) return res.status(404).json({ message: "Test not found" });

    // update all fields
    for (let key in updatedTest) {
      oldTest[key] = updatedTest[key];
     
    }
  
    await oldTest.save();
    res.json({ message: "Test updated successfully", updatedTest: oldTest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.post("/create-duplicate-test",verifyAdmin, async (req, res) => {  // yes
  try {
    const oldTest = req.body;
    
    // Helper to parse test date & time in IST
    function parseTestTime(dateStr, timeStr) {
      let [hour, minute] = timeStr.split(":").map(Number);
      if (hour < 10) hour = "0" + hour;
      if (minute < 10) minute = "0" + minute;
      // '+05:30' ensures IST
      return new Date(`${dateStr}T${hour}:${minute}:00+05:30`);          
    }
   
    const testStartTime = parseTestTime(oldTest.Date, oldTest.Time);
     const now = new Date();
     // means yadi startTime beet chuka ho to create karne ki jarurat nhi hai bai 
     if(testStartTime<now) {
      // es test ko create karne ki jarurat nhi hai bhai 
     return res.json({ message: "Please enter a valid test date and start time (must be in the future)." });
     }


    if (!oldTest) {
      return res.status(400).json({ message: "No test data provided" });
    }

    // 🧠 Remove old ID so MongoDB can create new one
    delete oldTest._id;

    

    // Create new test
    const duplicateTest = await Test.create(oldTest);

    res.json({
      message: "✅ Duplicate Test Created Successfully",
      duplicateTest,
    });
  } catch (err) {
    console.error("Error creating duplicate:", err);
    res.status(500).json({ message: err.message });
  }
});




router.get("/student-data-for-admin/:testId",verifyAdmin,async (req, res) => {    // yes
  try {
    const { testId } = req.params;

    // 🔹 Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    // 🔹 Get all attempts for that test
    const allAttempts = await Attempt.find({ testId }).populate("userId");
    if (!allAttempts || allAttempts.length === 0) {
      return res.status(404).json({ success: false, message: "No attempts found" });
    }

    // 🔹 Success response
    return res.status(200).json({
      success: true,
      message: "Success",
      testInfo: test,
      allAttemptsInfo: allAttempts,
    });

  } catch (err) {
    console.error("Error fetching student data:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});




// for protected rout for admin side
 router.get("/check-admin-auth", verifyAdmin, (req, res) => {
  return res.json({ isAdmin: true });
});



module.exports = router;


