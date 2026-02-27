
const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test",required:true},  // ref ka means hai yaadi aapun .populate(testId) karenge to testId={} edar testid 
  // nhi aayenhi edar testId={je jisko ref kar rhi hai bo aayenga } means testid={test} aayenga samaj gaye na 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentInformation",required:true },
  startTime:{type: Date },
  submittedAt:{tyep:Date},
  timeTaken: { type: Number, default: 0 }, // // example: 45.75 → means 45 min 45 sec
  status: { type: String, enum: ["ongoing", "submitted", "expired","Not Attempt"], default: "Not Attempt" }, // ongoing means jamaj jana bande ne test beech me se chod ke aaya hai 
  score: { type: Number, default: 0 },
  warningCount:{type:Number,default:0},
  leaveTime:{type:Date},
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question"},
      question: String,
      options: [String],
      selectedOptions: [String],
      correctOptions: [String],
      isCorrect: Boolean,
    },
  ],

  // Refresh-protection fields
    // je niche aapun refressh ke  point view se aaproch concept laga rhe hai refressh kar pe bahut gata ho rha tha es se bach rhe hai es se 
  lastVisitedQuestion: { type: Number, default: 0 },     // je uske liye hai taki refresh karne pe bhi student usi question pe rhe na ki 1 question pe pahuch jaye barna uske liye time mil jayenga use karne ka bale us se bo cchut gya ho 
 
  fixPerQuestionTime: {                            // je bhi karna honga barn refresh kar kar ke student ek hi question pe jada time le sakta hai   remaining time dono case me kam karenga pahle to set ho jayena intial then last ke liye bhi kam karnega ok 
        hours: { type: Number, default: 0 },
        minutes: { type: Number, default: 0 },
        seconds: { type: Number, default: 0 }
       },
    
   // track last index interaction  // esaki bhi jarurat hai 
  lastIndexTime: { type: Date, default: Date.now },
 
});

module.exports = mongoose.model("Attempt", attemptSchema);


