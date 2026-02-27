const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // <- added
const StudentInformation= require("../models/StudentInformation");
const {verifyToken} = require("../Middleware/auth")

// Signup
// router.post("/signup", async (req, res) => {
//   const { name, email, password, role } = req.body;
//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({ name, email, password: hashedPassword, role });
//     res.status(201).json({ message: "User created", user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// Login
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:"7h"})
//     // const token=jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
//     res.json({ message: "Login successful", token});
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// get -all -users 


// Login-information - of abhishek student 
// router.post("/add-login-information-of-abhishek-students",async(req,res)=>{
//        try{
//         const {name,email,phone}=req.body;
//         const student = await StudentInformation.findOne({email});
//         if(student){
          
//           return res.json({message:"soory now you cant give this test"})
 
//           }
           
//           const  newStudent=new StudentInformation({
//                           name,
//                           email,
//                           phone
//                    })
           
//            await newStudent.save();

//          // 🧹 Step 4: Clear any old cookie — same options as when set
//             res.clearCookie("authToken");


          
//          // concept :  radhe radhe
//          const token=jwt.sign({id: newStudent._id},process.env.JWT_SECRET,{expiresIn:"1h"}); 
         
//            // 🍪 Step 5: Set the new cookie
//                   res.cookie("authToken", token, {
//                           httpOnly: true,
//                           secure: false, // change to true on production (HTTPS)
//                           sameSite: "Lax", // less restrictive, better for local dev
//                           path: "/", // important for consistency
//                           maxAge: 3600000,
//                   });
        
//         // whole concept : token:   aapun ne userid ko ek secure token me dal diya hai  and je token bahut secure hai and 1 h me expire ho jayenga 
//         //                set cookie : aapun ne es token ho cookie me save kar liya hai esase kya fayd hua  
//         //                             1. Backend authToken naam ka cookie client ke browser me store kar deta hai.
//         //                             2. Ye cookie frontend JS se access nahi ki ja sakti, kyunki httpOnly: true hai.
//         //                             3. Par jab bhi tu koi aur request karega (for example, /protected-route), aur agar tu withCredentials: true likhta hai, to wo cookie automatic attach ho jaayegi request ke saath. 

//         //                matlab    : jaise koi bhi student login kiya to je api chali edar aapna code liya hai edar uski userid token ban jayengi and je token coookies me save ho jayenga means 
//         //                            meand us student ke brouwere me authToken naam ka cookies user brower me save ho jayengi jo ki ek hour tak balid hai ok 
//         //                           1. abh jab bhi student ko koi bhi request karta hai  yaadi use ne withcendrential true likhata hia to je cookies jo save thi uske brouwere me me automatic jayengi us request ke sath 
//         //                              frontend me koi bhi ese access nhi kar sakta hai kyo ki autmatic student ke brower me save ho jati hai jaise hi student login karenga jo ki valid rahengi only one hour 
//         //                              backend me aap us cookies ko req.cookies.authtoken se 
//         //               
//         //  real example in my project  : jaise hi student login karenga to je pura code chalenga es code me student ki userid token me save ho jayengi badiya security ke sath 
//         //                                than us token ki cookies set kar di hai ese  je fayda hai ki student ke brower me je coookies save ho chuki hai 
//         ///                               withcentredial : true ki help se je cookies automatically  kisi bhi request ke sat bej sakte hai jaise maine 
//          //                               test page me withcrendital : true    test information fetch api ke sath beji hai esaka matlab bo cookies bhi chali gyi hai 
//         //                                backen ke paas abh aabh es cookies ki help se authentication kar sakte hai ki aapun ne verifytoken se kar rhe hai middlewear me 
//         // 
//         //
//         //                              
          
        

   
  


//          res.json({message:"login successful" ,information: newStudent,token:token});

//              }
       
      

//        catch(err){
//         res.json({message:err.message});
//        }

      

       
// });





// Login-information - of student   new corrected according to now situation
router.post("/add-login-information-of-students-radhe",async(req,res)=>{
       try{

        const {name,email,phone}=req.body;
        let student = await StudentInformation.findOne({email});
        if(!student){
          
                // Create new student
                  student = new StudentInformation({ name, email, phone });
                  await student.save();

          
              }

  
          // concept :  radhe radhe
         const token=jwt.sign({id:student._id},process.env.JWT_SECRET,{expiresIn:"1h"}); 
         
           // 🍪 Step 5: Set the new cookie  means es token ko cookies me store kar liya hai abh fronted me directly use kar sakte ho withCreditials.true ki help se
          res.cookie("authToken", token, {
                  httpOnly: true,
                  // secure: false, // change to true on production (HTTPS)
                  // sameSite: "Lax", // less restrictive, better for local dev
                  secure: true,        // MUST BE TRUE in production
                  sameSite: "None",    // MUST BE None for cross-origin
                  path: "/", // important for consistency
                  maxAge: 3600000,
          });

         res.json({message:"login successful" ,information:student});// token bajna jaruri nhi hai alread cookies set kar di hai browser me 

       
        } catch(err){
        res.json({message:err.message});
       }

      

       
});



    // whole concept : token:   aapun ne userid ko ek secure token me dal diya hai  and je token bahut secure hai and 1 h me expire ho jayenga 
        //                set cookie : aapun ne es token ho cookie me save kar liya hai esase kya fayd hua  
        //                             1. Backend authToken naam ka cookie client ke browser me store kar deta hai.
        //                             2. Ye cookie frontend JS se access nahi ki ja sakti, kyunki httpOnly: true hai.
        //                             3. Par jab bhi tu koi aur request karega (for example, /protected-route), aur agar tu withCredentials: true likhta hai, to wo cookie automatic attach ho jaayegi request ke saath. 

        //                matlab    : jaise koi bhi student login kiya to je api chali edar aapna code liya hai edar uski userid token ban jayengi and je token coookies me save ho jayenga means 
        //                            meand us student ke brouwere me authToken naam ka cookies user brower me save ho jayengi jo ki ek hour tak balid hai ok 
        //                           1. abh jab bhi student ko koi bhi request karta hai  yaadi use ne withcendrential true likhata hia to je cookies jo save thi uske brouwere me me automatic jayengi us request ke sath 
        //                              frontend me koi bhi ese access nhi kar sakta hai kyo ki autmatic student ke brower me save ho jati hai jaise hi student login karenga jo ki valid rahengi only one hour 
        //                              backend me aap us cookies ko req.cookies.authtoken se 
        //               
        //  real example in my project  : jaise hi student login karenga to je pura code chalenga es code me student ki userid token me save ho jayengi badiya security ke sath 
        //                                than us token ki cookies set kar di hai ese  je fayda hai ki student ke brower me je coookies save ho chuki hai 
        ///                               withcentredial : true ki help se je cookies automatically  kisi bhi request ke sat bej sakte hai jaise maine 
         //                               test page me withcrendital : true    test information fetch api ke sath beji hai esaka matlab bo cookies bhi chali gyi hai 
        //                                backen ke paas abh aabh es cookies ki help se authentication kar sakte hai ki aapun ne verifytoken se kar rhe hai middlewear me 
        // 
        //
        //                              
          



router.post("/logout", (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      // secure: false,   // LOCALHOST me secure:false hi rakho
      // sameSite: "Lax",
      secure: true,        // MUST BE TRUE in production
      sameSite: "None",    // MUST BE None for cross-origin
      path: "/",       // yaad se likhna because set karte time bhi path: "/" use kiya tha
    });

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Logout failed" });
  }
});





// updat the data of abhishek students 
router.put("/update-marks-of-student",verifyToken,async(req,res)=>{   // re.params  object me aj aapun ne kuch nhi dal rhe ko yadi url me /:userId likhate to  req.params {userid:" "}      // aaj aapun ne verification token ke ander req obect ke ander { userId: " "}  dal diya hai brother 
         try{
           const userId= req.userId;
           const {newMarks}= req.body   // fronted se object me bej rhe hai and url me bhi nhi bej rhe hai normal bej rhe hai 
          //  const student = await StudentInformation.findOne({userId});
           //  const student = await StudentInformation.findOne(userId);

           // both are the wrong because in the datab   { _id: " "}; 
           // correct way : 
                           
                         const student = await StudentInformation.findOne({_id:userId});   // studentInformation collect jisame {_id:" "} , {_id:" "}
                                             // or 
                        // const student = await StudentInformation.findById(userId);


           if(!student){
            return res.json({message:"no found any this student"});
           }
           
           student.marks=newMarks;

           await student.save();
           res.json({message:"add marks successfully" ,student: student});


         }catch(err){
           res.status(500).json({ message: err.message });
         }
});



// get all login informaion of the  abhishek students 

router.get("/get-all-login-information-of-students",async(req,res)=>{
       try{
      
        const students= await StudentInformation.find();   // je fuction ek array return karta hai to dyan rakhna hu condition me !student nhi likh sakte  students.length===0 
        if(students.length===0){
          
          return res.json({message:"sorry no record found "});
 
             }
           
         res.json({message:"these are the students" ,students: students});

        }
      

       catch(err){
        res.json({message:err.message});
       }

      
});







// Forgate password 
router.post("/forgetPassword",async(req,res)=>{
            const{email,newPassword}=req.body;
            // muje db ke ander se userInformation collection me se us object ko utha ke lana hai jisaki emial je hai ok 
            const user = await User.findOne({email});
            if(!user){
              return res.send("any acount doest not created by this email so please enter the correct email")
            }
            
            // abh muje  nhi password ko hash password pe convert karna padenga 

            const salt = await bcrypt.genSalt(12);
            const newHashPassword = await bcrypt.hash(newPassword,salt);
            user.password =newHashPassword;
            await user.save();
            // res.send( "change password successful ");    conept ->// bhai res.send() me sab kuch bej sakte ho no. string object array ke form me  sab kuch bej sakte hai but
            //  res.send({message:"successful" , user:user })   ;      // but res.json() me aap sirf object ke form me hi response send kar sakte hai                                 
                           // or                                                                      
            res.json({ message :"change password successful ",user:user});                                                                 
                                                                            

              });




module.exports = router;
