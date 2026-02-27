
const express = require("express");
const router = express.Router();
const Test = require("../models/ConductTest");
const Attempt = require("../models/Attempt");
const { SchemaTypeOptions } = require("mongoose");
const { verifyToken } = require("../Middleware/auth");
const StudentInformation = require("../models/StudentInformation");




// for student side 


// work for dashboard  
router.get("/getAllTests/ongoing/upcomming/attemptedTests",verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const userId=req.userId; 
    const student= await StudentInformation.findOne({_id:userId});
    if(!student) return res.status(404).json({message:"plese login first "});

    // 🧩 Helper function to parse Date + Time into full DateTime (IST)
    function parseTestTime(dateStr, timeStr) {
      if (!dateStr || !timeStr) return null;
      let [hour, minute] = timeStr.split(":").map(Number);
      if (isNaN(hour) || isNaN(minute)) return null;
      return new Date(`${dateStr}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00+05:30`);
    }

    // 🧭 Fetch only recent or future tests (to skip expired ones)   // aapun bo sare test nikal lete ha
    // i jo kal ke baad dale ho taki aapun ko jada testo pe filter lagana na pade samaj gye hoonge kyo 
    // ki baiseaapun pass sare test aa jaye  fir sabi test pe filter lagate ongoing and upcoming ke liye yaadi 1 la
    // means aapun ko for each jada pe lagane se bach jayenge koi ki es se mostly expired test khatam kar denge 
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tests = await Test.find({
      Date: { $gte: yesterday.toISOString().split("T")[0] },
    });

    const ongoingTests = [];
    const upcomingTests = [];

    const allAttempts = await Attempt.find({ userId });  // kyo ki me je sabi attempt le leta hu ek bhar me  es user ke means muje mogo ek ek
                                                       //  bhar hi call karna padenga yaddi me har test pe attempt nikalta ho fir muje bahut bhar mogo ko callkar na padta 
                                                       // es liye maine je aaproch chuni  abh me har test me only filter kar lunga muje mogo ko call nhi karna padenga ok
                                                     


    for (const test of tests) {
      const start = parseTestTime(test.Date, test.Time);
      if (!start) continue;

      const end = new Date(start.getTime() + test.testDuration * 60 * 1000);
      if (end < now) continue; // expired skip

      // 🕒 Ongoing test logic
      if (start <= now && end >= now) {
        const remainingMs = end - now;
        const remainingTime= {     
         hours : Math.floor(remainingMs / (1000 * 60 * 60)),
         minutes : Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
         seconds :Math.floor((remainingMs % (1000 * 60)) / 1000),
        }
    
       const attempt = allAttempts.find(a => a.testId.toString() === test._id.toString());  // je test yaadi es student ne diya honga to aaa jayenga ok aise aapun har test ka atempt filter karenge 
        let status="Not Attempt"; // kuch bhi ok  expect ongoing ya sumbitted 
        if(attempt)  status=attempt.status ;  // kyo ki ya to ongoing honga ya to submited ho samaj gye na  yaadi filter hone pe aapun ko kuch mil rha hai to 
        ongoingTests.push({
          ...test._doc,
          remainingTime,
          status               // abh mere es status bhi jayenga yadi student ne test de aaya ya  denga 
        });
      }

      // ⏳ Upcoming test logic (time left to start)
      else if (start > now) {
        const remainingMs = start - now;
        const timeToStart= {     
         hours : Math.floor(remainingMs / (1000 * 60 * 60)),
         minutes : Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
         seconds :Math.floor((remainingMs % (1000 * 60)) / 1000),
        }

        upcomingTests.push({
          ...test._doc,
          timeToStart,
        });
      }
    }

    // es user ke sabi attempted test nikalna hai 
    const attemptedTestsRadhe = await Attempt.find({ userId }).populate("testId");       // aapun uper allAttempts already nikal chuke the but udar aapun ko testid jarurat thi edar nhi ahi es liye duwara nikanlna pada 
    if(!attemptedTestsRadhe) return res.status(404).json({message:"error in fetching all attempted tests"});

    res.status(200).json({
      success: true,
      message1: "All ongoing tests",
      ongoingTests,
      message2: "All upcoming tests",
      upcomingTests,
      student  ,                            // this is for dashboard where we can show name photo email, 
      attemptedTestsRadhe   
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});









//old  working with thunder cliend ok

router.post("/create/attempt/userId:testId",async(req,res)=>{
      try{
            const{userId,testId}= req.params;
           const currentISTTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);

            const attempt= await Attempt.findById(userId);   // edar aapun  userid and testid dono se fetch karenge ok 
            const test=await Test.findById(testId);    // esaki koi jarurat nhi hai 
            const now= new Date() //   means current date with current time ok 
            if(attempt) return res.json({message:"samaj gya bhai aap duwara test ke ander ja rhe ho smart test kyo chod tum ne  "});  // means eska matalab student  testpage duwarA LOT KAR AAYA HAI 
            const newAttempt= new Attempt({
              userId:userId,
              testId:testId,
              // startTime:now,  // kam nhi kar rha hai 
              startTime:currentISTTime,
              status:"ongoing"
            })
            
            const totalQuestions = test.testQuestions.length;
            const secondsPerQuestion = Math.floor((test.testDuration * 60) / totalQuestions);

            const fixPerQuestionTime= {
              hours: Math.floor(secondsPerQuestion / 3600),
              minutes: Math.floor((secondsPerQuestion % 3600) / 60),
              seconds: secondsPerQuestion % 60,
            };

    newAttempt.fixPerQuestionTime = fixPerQuestionTime;
    newAttempt.lastIndexTime=now;
    await newAttempt.save();
  



            await newAttempt.save(); 


            res.json({message:"attempt creatd successfully", attempt: newAttempt}); 

      }catch(err){
        res.json({message:err.message});
      }
});





// bhai test start hone se pahle muje je check kar lena chahiye ek bhar aur  1. test expire to nhi ho gya ok   2. attempt ke bhare me shochenge  
// now this is working with login page 
router.post("/create/attempt/:testId/radhe",verifyToken,async(req,res)=>{  // abhi veriftoken baad me karte hai ok
      try{  
           
           
              const userId = req.userId; // ✅ Correct: taken from verifyToken middleware
              // const userId="69086ac110faf8e676002b9f";
              const { testId } = req.params;


              // ✅ Find attempt for this specific user + test
              //    // bhai  test start karne se pahle aap ek bhar aur check kar lo ki time khatam to nhi ho gya hai 
              // pahle aapun test ke bare me shochenge expire to nhi ho gya ok 
              const test=await Test.findById(testId);    // esaki koi jarurat nhi hai 
              if(!test) return res.json({message:"test not found"});

                // 🔹 Compute test timings
          
                // ✅ Helper to parse test date & time in IST
                      function parseTestTime(dateStr, timeStr) {
                        let [hour, minute] = timeStr.split(":").map(Number);
                        if (hour < 10) hour = "0" + hour;
                        if (minute < 10) minute = "0" + minute;
                        return new Date(`${dateStr}T${hour}:${minute}:00+05:30`); // IST
                        }

                      const testStartTime = parseTestTime(test.Date, test.Time);
                      const testEndTime = new Date(testStartTime.getTime() + test.testDuration * 60 * 1000);
                      const now = new Date();

              
                  if (now < testStartTime) {
                    // 🕐 Test not started yet
                    return res.json({status:"upcoming",success:false,message:"sorry abhi  test not started yet"}); 
                  }
                  
                  if (now >= testEndTime) {
                     return res.json({ status: "expired", success: false, message: "Sorry bhai, test expired ho gaya" });
                    }



                // aapun ko es condition me main kam karna hai     
                if (now >= testStartTime && now < testEndTime) {
                      // ✅ Test is ongoing
                      // ha bhai aabh aap attempt ka kam karo ongoing state me 
                      
                      const attempt = await Attempt.findOne({testId,userId});  // edar aapun  userid and testid dono se fetch karenge ok 
                      console.log("Checking Attempt for:", { testId, userId });
                
                        if(attempt){  // means aapun attempt create karne ki jarurat nhi hai ok bas case handle kar lo 
                            if (attempt.status === "ongoing")  return res.json({ success: true, status: "ongoing", message: "Welcome back! Resume your test. jada smart mat bano bhai", attempt });// means eska matalab student  testpage duwarA LOT KAR AAYA HAI   ok ja sakte ho ap chale jao 
                            if(attempt.status==="submitted") return res.json({status:"ongoing",success:false , message:"soory bhai abh aap nhi ja sakte tum already test de kar aa chuke ho duwara nhi de sakte ho",score:attempt.score}); 
                        }


                        // new attempt create 
                        const currentISTTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
                     //      const now= new Date() //   means current date with current time ok 
                        const newAttempt= new Attempt({
                          userId:userId,
                          testId:testId,
                          // startTime:now,  // kam nhi kar rha hai 
                          startTime:currentISTTime,
                          status:"ongoing"             // attempt ke field ka hai je ok 
                        })
                        
                        const totalQuestions = test.testQuestions.length;
                        const secondsPerQuestion = Math.floor((test.testDuration * 60) / totalQuestions);

                        const fixPerQuestionTime= {
                          hours: Math.floor(secondsPerQuestion / 3600),
                          minutes: Math.floor((secondsPerQuestion % 3600) / 60),
                          seconds: secondsPerQuestion % 60,
                        };

                        newAttempt.fixPerQuestionTime = fixPerQuestionTime;
                        newAttempt.lastIndexTime=now;
                        console.log("lastIndexTime:", newAttempt.lastIndexTime);
                        await newAttempt.save();

                        res.json({ status:"ongoing",success:true, message:"attempt creatd successfully", attempt: newAttempt}); 


                  } 
                  
            

      }catch(err){
        res.json({message:err.message});
      }
});









router.get("/get-all/attempts",async(req,res)=>{
      try{
            

           const attempt= await Attempt.find();

            res.json({message:"these are the attempts ", attempt: attempt}); 

      }catch(err){
        res.json({message:err.message});
      }
});







// Get test info
router.get("/:id", async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ error: "Test not found" });

  // const attempt = await Attempt.findOne({ testId: test._id, userId: req.user.id });
  let status = "upcoming";


  // if (attempt) {
  //   const now = new Date();
  //   const endTime = new Date(attempt.startTime);
  //   endTime.setMinutes(endTime.getMinutes() + test.duration);
  //   if (now >= endTime) {
  //     status = "expired";
  //     remainingTime = 0;
  //   } else {
  //     status = "ongoing";
  //     remainingTime = Math.floor((endTime - now) / 1000);
  //   }
  // } 
  
  
  // else {
     // 📋 Default Instructions (Notes)
  const notes = [
    "Do not refresh or reload the page during the test.",
    "Do not close or reopen the browser tab once the test has started.",
    "Switching to another tab or window may lead to disqualification.",
    "Make sure you have a stable internet connection before starting.",
    "Click the 'Submit' button only once after completing the test."
  ];

const testDateTime = new Date(`${test.Date}T${test.Time}:00`);
const testEndTime = new Date(testDateTime.getTime() + test.testDuration * 60000);
const now = new Date();

let remainingTime;  // es apun 2 place pe use karne bale hai 1. jab upcoming status chal rha ho tab aapun batayenge ki itna time rah gya hai start hone me  2. jab status ongoing state me chale rhe honge tab aapun es se bataye ki itna time rah gya hai katam hone me 

if (now < testDateTime) {
  status = "upcoming";
   const totalSecondsLefts = Math.floor((testDateTime - now) / 1000);     // means itni second bad  test will be start 
   remainingTime = {
    hours: Math.floor(totalSecondsLefts / 3600),
    minutes: Math.floor((totalSecondsLefts % 3600) / 60),
    seconds: totalSecondsLefts % 60
     };
}
else if (now >= testDateTime && now <= testEndTime) {
        status = "ongoing"; 
        const totalSecondsLefts = Math.floor((testEndTime - now) / 1000);     // means itni second bachi hai test khatam hone me 
            remainingTime = {
              hours: Math.floor(totalSecondsLefts / 3600),
              minutes: Math.floor((totalSecondsLefts % 3600) / 60),
              seconds: totalSecondsLefts % 60
              };
        }
else {
  status = "expired";
  //  const totalSecondsLefts = Math.floor((now-testEndTime) / 1000);   // inti second ho chuki hai test ko end hote hue 
  //         remainingTime = {
  //           hours: Math.floor(totalSecondsLefts / 3600),
  //           minutes: Math.floor((totalSecondsLefts% 3600) / 60),
  //           seconds: totalSecondsLefts % 60
  //         };
  
  // apun es time ko show kar sakte hai but kya hai na ki fir aapun ko system ko hamesha chalna padenga es se badiya only expire 
  // status se aapun only je show kar de ki test is over es se aapun ko sytem ko rok sakte hai ki yaadi status expire ko 
  // ho to  fir aap to mat chalo means mat fetch karo deta ko backend se kyo ki real time ki jarurat nhi hai ok sayad samaj gye honge aap 
      

    }   

     
   
res.json({ ...test.toObject(), status, remainingTime, notes });    // it means jab bhi aap accesss karonge es code ke through tab test ke ander je 3 field aur add ho chuki hongi ok 
// aap abhi tak normal jante the 
  // res.json({test:test ,status : status , remainingTime : remainingTime , notes : notes })  // es case me sab aalag alag object honge and aise access honge res.data.test  and res.data.status because 
  // alag alag object hai ok but in the above case sabi ko es object me dal diya hai  res.data se accesss ho jayenga sab kuch ok 
  // abhi ke liya aap simple use karo aapne tarike se 

});



// ✅ Get test info route (Optimized & Real-world style)   
router.get("/:id/radhe",verifyToken,async (req, res) => {
  try {
    
      const userId = req.userId;
      const testId=req.params.id;
      const student= await StudentInformation.findById(userId);
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

       
        const attempt = await Attempt.findOne({ userId, testId });  // baise esaki koi jarurat nhi thi but yaar muje esake status ke 
        //jarurat hai kyo ki muje  start button  and resume button ya commplete button  ka setup jamana tha frontend me 
        let attemptStatus = "Not Attempt";
        if (attempt) attemptStatus = attempt.status; // ongoing | submitted | expired


    // 🧾 Default test instructions
    const notes = [
      "Do not refresh or reload the page during the test.",
      "Do not close or reopen the browser tab once the test has started.",
      "Switching to another tab or window may lead to disqualification.",
      "Ensure a stable internet connection before starting the test.",
      "Click 'Submit' only once after completing the test.",
    ];
    
     const motivationalLines = [
          "Keep Learning, Keep Growing 🚀",
          "Every Test Brings You Closer to Success 💯",
          "Believe in Yourself, You’ve Got This ✨",
          "Discipline is the Bridge Between Goals and Success 🧠",
        ];

        
         const studentInfo = {
         name: student.name,
         id: student.email
           };


    // 🔹 Compute test timings
  
     // ✅ Helper to parse test date & time in IST
    function parseTestTime(dateStr, timeStr) {
      let [hour, minute] = timeStr.split(":").map(Number);
      if (hour < 10) hour = "0" + hour;
      if (minute < 10) minute = "0" + minute;
      return new Date(`${dateStr}T${hour}:${minute}:00+05:30`); // IST
      }

     const testStartTime = parseTestTime(test.Date, test.Time);
      const testEndTime = new Date(testStartTime.getTime() + test.testDuration * 60 * 1000);
      const now = new Date();

    
          let status = "upcoming";
          let remainingTime = { hours: 0, minutes: 0, seconds: 0 };

          if (now < testStartTime) {
            // 🕐 Test not started yet
          const totalSecondsLeft = Math.floor((testStartTime - now) / 1000);
          remainingTime = {
            hours: Math.floor(totalSecondsLeft / 3600),
            minutes: Math.floor((totalSecondsLeft % 3600) / 60),
            seconds: totalSecondsLeft % 60,
          };
            status = "upcoming";
          } else if (now >= testStartTime && now < testEndTime) {
            // ✅ Test is ongoing
          const totalSecondsLeft = Math.floor((testEndTime - now) / 1000);
            remainingTime = {
            hours: Math.floor(totalSecondsLeft / 3600),
            minutes: Math.floor((totalSecondsLeft % 3600) / 60),
            seconds: totalSecondsLeft % 60,
          };
            status = "ongoing";
          } else {
            // ❌ Test expired
            status = "expired";
          }

          // 🧠 Response
          res.json({
            ...test.toObject(),
            status,                 // test ka live status (ongoing, upcoming, expired)
            attemptStatus ,          // student ka attempt status (Not Attempt, ongoing, submitted
            remainingTime,          
            notes,
            serverTime: now, // optional for client sync
            attemptStatus,
            motivationalLines,
            studentInfo
          });
        } catch (err) {
          console.error("Error fetching test:", err);
          res.status(500).json({ error: "Server error while fetching test" });
        }
      });






      // Start test
      router.post("/:id/start", async (req, res) => {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ success: false, message: "Test not found" });
        
        let attempt = await Attempt.findOne({ testId: test._id, userId: req.user.id });

        // if user already attempted  // so that they can unable to again
        if (attempt) {
          return   res.json({success:false ,message: "Sorry! You already submitted this test.", status:"expired"}) // es se kya honga ki edar se false jayenga to testpage open nhi honga and dursa  status change ho jayenga ki means start button disable ho jayengi es user ke liye 
          
        }
        
        const now = new Date();  // current date with time  

        attempt = new Attempt({ testId: test._id, userId: req.user.id, startTime: now , status:"ongoing" });

        
        await attempt.save();
        

        res.json({success:true, message: "lets go to test Journey"});
      });








// taki direct url se open na kar paye ok  pahle use testinfo pe jana hi padenga taki attemp create honga 
router.get("/verify-access/:testId", verifyToken, async (req, res) => {
  const testId = req.params.testId;
  const userId = req.user.id;

  // check if attempt exists (means student started test)
  const attempt = await Attempt.findOne({ userId, testId });
  if (!attempt) {
    return res.status(403).json({ success: false, message: "Access denied! Please start the test first." });
  }

  res.json({ success: true, message: "Access granted" });
});











//  for testpage :  jaha se aapna main kam suru hua hai 


router.get("/start/:testId",verifyToken,async (req, res) => {
  try {
      const userId = req.userId; // ✅ Correct: taken from verifyToken middleware
    const { testId } = req.params;

    // ✅ Find attempt for this specific user + test
   
const attempt = await Attempt.findOne({testId,userId}).populate("testId"); // pura attempt aa jayenga and testid= { } attempt schema me yaadi testId me jo refreans hai bo pura aajyana measns 
//  abh testid={pura test}  kyo ki testid ref kar rhi hai test ko  attempt ke schema me dek lo 

console.log("Checking Attempt for:", { testId, userId });

    if (!attempt)
      return res.json({ success: false, message: "Attempt not found" });

    const test = await Test.findById(testId);
    if (!test)
      return res.json({ success: false, message: "Test not found" });

    // ✅ Helper to parse test date & time in IST
    function parseTestTime(dateStr, timeStr) {
      let [hour, minute] = timeStr.split(":").map(Number);
      if (hour < 10) hour = "0" + hour;
      if (minute < 10) minute = "0" + minute;
      return new Date(`${dateStr}T${hour}:${minute}:00+05:30`); // IST
    }

    const testStartTime = parseTestTime(test.Date, test.Time);
    const testEndTime = new Date(testStartTime.getTime() + test.testDuration * 60 * 1000);
    const now = new Date();

    console.log({
      now: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      testStart: testStartTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      testEnd: testEndTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    });

    // ✅ Check conditions
    if (attempt.status === "submitted")
      return res.json({
         attempt,
        success: true,    // kyo ki muje alrady submitted bali div ko show karna hai frountend me 
        message: "Test already submitted",
        status: "submitted",
        timeTaken:attempt.timeTaken
      });

    if (now < testStartTime)
      return res.json({
        success: false,
        message: "Test not started yet",
        status: "notStarted",
      });

    if (now > testEndTime)
      return res.json({
        success: false,
        message: "Test expired",
        status: "expired",
      });

    
        // ✅ Calculate remaining test time
    const totalSecondsLeft = Math.floor((testEndTime - now) / 1000);
    const remainingTestTime = {
      hours: Math.floor(totalSecondsLeft / 3600),
      minutes: Math.floor((totalSecondsLeft % 3600) / 60),
      seconds: totalSecondsLeft % 60,
    };

  
   
   // ✅ Calculate new remaining time per question
let newRemainingTimeforThisQuestion = { hours: 0, minutes: 0, seconds: 0 };

if (attempt.lastIndexTime && attempt.fixPerQuestionTime) {

  // Step 1️⃣: Convert current datetime & lastIndexTime → seconds
  const currentSeconds = Math.floor(new Date().getTime() / 1000);
  const lastIndexSeconds = Math.floor(new Date(attempt.lastIndexTime).getTime() / 1000);

  // Step 2️⃣: Difference in seconds (kitna time beet gaya)
  const diffSeconds = currentSeconds - lastIndexSeconds;

  // Step 3️⃣: Fixed time per question → total seconds
  const { hours, minutes, seconds } = attempt.fixPerQuestionTime;
  const fixedTotalSeconds =
    (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);

  // Step 4️⃣: Remaining time = fixed - difference
  let remainingSeconds = fixedTotalSeconds - diffSeconds;

  // : Agar negative ho gaya to zero fix kar de
 

  if (remainingSeconds <=0) {
  console.log("ha bhai time negative hua");

  // ⚡ Only increase if NOT last question
        if (attempt.lastVisitedQuestion < test.testQuestions.length - 1) {
            attempt.lastVisitedQuestion += 1;
            remainingSeconds = fixedTotalSeconds;
            attempt.lastIndexTime = new Date();
            await attempt.save();
          } else {

          // ✅ Last question bhi khatam ho gaya
          // Test auto-submit kar do
          let totalMarks = 0;
          attempt.answers.forEach((a) => {
            if (a.isCorrect) totalMarks += test.marksPerQuestion;
            });

          attempt.score = totalMarks;
          attempt.status = "submitted";

                                    // time taken calculation 
                                    
                                        const submittedAt = new Date(); // current UTC time
                                        attempt.submittedAt = submittedAt;
                                        const endTime = submittedAt.getTime(); // UTC
                                        const startTime = new Date(attempt.startTime).getTime() - (5.5 * 60 * 60 * 1000); // adjust back to UTC kyo ki starttime ist me tha 
                                        let diffMs = endTime - startTime; // in mili second 
                                        if (diffMs < 0) {
                                          console.warn("⚠️ Negative time difference detected, correcting...");
                                          diffMs = Math.abs(diffMs);
                                          }
                                        const timeTakenMinutes = Math.round((diffMs / 60000) * 100) / 100;  //  convert mili ot minutes 2 decimal tak 
                                        // exampe 45.5  means 45 minutees 30 seconds 
                                        attempt.timeTaken = timeTakenMinutes;
                                        console.log("✅ Time taken (minutes):", timeTakenMinutes);
                                          

  
   await attempt.save();  

          return res.json( {      // aap only attempt bhi bej sakte ho tab bhi kam ho jayega 
             attempt,
             success: true,
             message: "Test submitted",
             status:"submitted" ,
             score:attempt.score,
             timeTaken:attempt.timeTaken,
            
             
              });
          // Test auto-submit kar do
   
        }

 
   }

  // Step 6️⃣: Convert back to H:M:S
  newRemainingTimeforThisQuestion = {
    hours: Math.floor(remainingSeconds / 3600),
    minutes: Math.floor((remainingSeconds % 3600) / 60),
    seconds: remainingSeconds % 60,
  };
}


let fixPerQuestionTime= attempt.fixPerQuestionTime;
console.log("lastIndexTime:" , attempt.lastIndexTime); 
console.log("fixPerQuestionTime:" , fixPerQuestionTime); 
console.log("🕒 New Remaining Time:",newRemainingTimeforThisQuestion);
console.log("remainingTestTime:" ,remainingTestTime); 
console.log("timeTakenTime:" ,attempt.timeTaken); 
console.log("lastQuestionVisit" ,attempt.lastVisitedQuestion); 


res.json({
  success: true,
   test,
   attempt,
   remainingTestTime,
   fixPerQuestionTime,
   newRemainingTimeforThisQuestion,
});

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});





router.patch("/attempt/:attemptId/question", async (req, res) => {
  try {
    const { qIndex, option } = req.body;
    const attempt = await Attempt.findById(req.params.attemptId).populate("testId");
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });
    
    // radhe radhe radhe 

    const test = attempt.testId;  
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Helper to parse test date & time in IST
    function parseTestTime(dateStr, timeStr) {
      let [hour, minute] = timeStr.split(":").map(Number);
      if (hour < 10) hour = "0" + hour;
      if (minute < 10) minute = "0" + minute;
      // '+05:30' ensures IST
      return new Date(`${dateStr}T${hour}:${minute}:00+05:30`);          
    }

    const testStartTime = parseTestTime(test.Date, test.Time);
    // const testEndTime = new Date(testStartTime.getTime() + test.testDuration * 60000);
    const testEndTime = new Date(testStartTime.getTime() + test.testDuration * 60 * 1000);

    const now = new Date();

    console.log({
      now: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      testStart: testStartTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      testEnd: testEndTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });



    if (now < testStartTime)
      return res.json({ success: false, status:"not_started",  message: "Test has not started yet"});
    if (now > testEndTime)
      return res.json({ success: false,status: "expired",message: "Test time is over" });
     
  



    // Direct populated test
    // const test = attempt.testId;  
    // if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    const q = test.testQuestions[qIndex];
    if (!q) return res.status(400).json({ success: false, message: "Invalid question index" });

    let answerIndex = attempt.answers.findIndex(
      (a) => a.questionId.toString() === q._id.toString()
    );

    if (answerIndex === -1) {
      attempt.answers.push({
        questionId: q._id,
        question: q.question,
        options: q.options,
        selectedOptions: [option],
        correctOptions: q.correctOptions,
        isCorrect: q.correctOptions.includes(option),
      });
    } else {
      const existing = attempt.answers[answerIndex];     // Toh existing copy nahi banta, balki existing same object ka reference hota hai jo attempt.answers array ke andar hai.
      const selected = existing.selectedOptions || [];   // simmillary   selected copy nhi banta hai balki    jo selectedOption ka referace hai  ok 

      if (q.type === "single") {
        existing.selectedOptions = [option];
      } else {
        if (selected.includes(option)) {
          existing.selectedOptions = selected.filter((i) => i !== option);
        } else {
          existing.selectedOptions = [...selected, option];
        }
      }

      const selectedOptions = existing.selectedOptions;
      existing.isCorrect =
        selectedOptions.length === q.correctOptions.length &&
        selectedOptions.every((opt) => q.correctOptions.includes(opt));
    }

    await attempt.save();
    res.json({ success: true, message: "Answer updated", answers: attempt.answers });
  } catch (err) {
    console.error(err);
//     console.log("attempt:", attempt);
// console.log("test.testQuestions:", attempt.testId.testQuestions);
// console.log("qIndex:", qIndex);

    res.status(500).json({ success: false, message: "Server error" });
  }
});




// ✅ POST /api/attempt/:attemptId/submit
router.post("/attempt/:attemptId/submit", async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId).populate("testId");
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });

    if (attempt.status === "submitted") {
      return res.json({ success: false, message: "Test already submitted" });
    }

    const test = await Test.findById(attempt.testId);
    if (!test) return res.json({ success: false, message: "Test not found" });

    let totalMarks = 0;
    attempt.answers.forEach((a) => {
      if (a.isCorrect) totalMarks += test.marksPerQuestion;
    });

    attempt.score = totalMarks;
    attempt.status = "submitted";
                 
               // ✅ Time taken calculation
                      const submittedAt = new Date(); // current UTC time  // means india se hours pahle 
                      attempt.submittedAt = submittedAt;
                      const endTime = submittedAt.getTime(); // UTC    // means india  se 5 hour pahle and get formate me convert kar diya hai
                      const startTime = new Date(attempt.startTime).getTime() - (5.5 * 60 * 60 * 1000); // adjust back to UTC kyo ki starttime ist me tha 
                      let diffMs = endTime - startTime; // in mili second 
                      if (diffMs < 0) {
                        console.warn("⚠️ Negative time difference detected, correcting...");
                        diffMs = Math.abs(diffMs);
                        }
                      const timeTakenMinutes = Math.round((diffMs / 60000) * 100) / 100;  //  convert mili ot minutes 2 decimal tak 
                      attempt.timeTaken = timeTakenMinutes;   // minutes me hai bhai jaise 5.5 hai means 5 minutes 30 sec 
                      console.log("✅ Time taken (minutes):", timeTakenMinutes);
                        


                      
    await attempt.save();

    res.json({ success: true, message: "Test submitted", score: totalMarks, status: attempt.status ,timeTaken:attempt.timeTaken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



 // je bhai uske liye hai kyo ki yaadi koi student beech me refresh kar de to quesstion bahi se ane chahiye na ki suru se  es liye aapun edar lastquestion visit index save kar rha 
 // taki  jab bhi test fetch honga to aapun lastvisitquestion index bejege frontend ko bo use currentindex honga uske liye 
// PUT /api/test/attempt/:attemptId/lastvisit


router.put("/attempt/:attemptId/lastvisit", async (req, res) => {
  try {
   
    const { attemptId } = req.params;
    const { lastVisitedQuestion } = req.body;
    const lastIndexTime = new Date();

    const updated = await Attempt.findByIdAndUpdate(
      attemptId,
      { $set: { lastVisitedQuestion, lastIndexTime } },
      { new: true }
    );

    console.log("✅ Updated Attempt:", updated);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update last visited question" });
  }
});



// yaadi student test page chod ke bag gya to bina submit kare  to bhai time taken chahiye tha muje es liye esaki jarurat padi 

// backend: routes/testInformation.js
router.post("/attempt/:attemptId/leave", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { leaveTime} = req.body; // frontend se iso  string mr aaga hai je merea aisa   "2025-11-09T14:35:14.279Z"  je pura string hai  because nav.sendBecon json me object nhi bej pata us only text me 


    console.log("📩 Backend reached with leaveTime (IST):", leaveTime);

    // 1️⃣ Find attempt
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }

    // 2️⃣ Parse startTime (IST) and leaveTime (IST) as Date objects
    const startDateTime = new Date(attempt.startTime); // ese bhi aapun ne dattime fomate m convert kar liya hai 
    const leaveDateTime = new Date(leaveTime);       // new date use  acutla dateTime bana liya hai pahle bo string/text pe tha  

    // 3️⃣ Calculate time difference in minutes
    let diffMs = leaveDateTime - startDateTime;
    
    if (diffMs < 0) {
      console.warn("⚠️ Negative time difference detected, correcting...");
      diffMs = Math.abs(diffMs);
    }
    const timeTakenMinutes = Math.round((diffMs / 60000) * 100) / 100;

    

    console.log("📢 Student Left Test!");
    console.log("🕒 Start (IST):", startDateTime);
    console.log("🚪 Left  (IST):", leaveDateTime);
    console.log(`⏳ Time Taken: ${timeTakenMinutes} minutes`);




    // 4️⃣ Update DB
    attempt.leaveTime = leaveDateTime;
    attempt.timeTaken = timeTakenMinutes;
    let totalMarks = 0;  // marks bhi add kar do kyo ki sayad bo nhi aaye bapas test dene 
    attempt.answers.forEach((a) => {
      if (a.isCorrect) totalMarks +=1;
      });
    attempt.score = totalMarks;

  
     console.log("backen ko pata chal gya hai  ki page leave kiya hai esame ");
     console.log(`eska score  je ho gya : ${totalMarks}`);
      console.log(`eska timeTaken  je ho gya : ${timeTakenMinutes}`);

  

  
    await attempt.save();

    

    // 5️⃣ Response
    res.json({
      success: true,
      message: "Leave time & timeTaken updated successfully",
      leaveTime: leaveDateTime.toISOString(), // ISO string for consistency
      timeTaken: timeTakenMinutes,
     
    });
  } catch (err) {
    console.error("❌ Leave time error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});





// for Review Test : 

router.get("/get-testQ-attemptQ-for-reviewTest/:testId",verifyToken,async(req,res)=>{
       try{
          const userId= req.userId;
          const {testId}= req.params; 
           const test= await Test.findById(testId); 
           if(!test) return res.json({message:"Test Not Found"});
           const testQuestions= test.testQuestions; 
           const attempt=await Attempt.findOne({userId,testId}).populate("userId"); 
            if(!attempt) return res.json({message:"Attempt Not Found"});
            const attemptQuestions= attempt.answers; 
           
            const basicInfo={
                 name: attempt.userId.name,
                 email: attempt.userId.email,
                 score: attempt.score,
                 timeTaken: attempt.timeTaken,
                 total: testQuestions.length,
                 testName:test.testName
            }

           res.json({message:"successful",testQuestions,attemptQuestions,basicInfo});

       } catch(err){
           console.log(err.message); 

        }
       
});





module.exports = router;
