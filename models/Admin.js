// // // models/Admin.js
// import mongoose from "mongoose";
// // import bcrypt from "bcrypt";

// const adminSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// // // Password verification method
// // adminSchema.methods.isValidPassword = async function(password) {
// //   return await bcrypt.compare(password, this.password);
// // };

// module.exports = mongoose.model("Admin", adminSchema);


// this is intiall 
// const adminSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });



// after creating a one admin  now i want this types of schema 

// models/Admin.js
  const mongoose = require("mongoose");

  const adminSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{type:String,required:true}
  });

  module.exports = mongoose.model("Admin", adminSchema);





  /// solution : 
        

// Conclusion

// Schema change future objects pe apply hota hai ✅

// Past objects automatic update nahi hote ❌


// #agar tum chahte ho ki purane documents me bhi role aa jaye

// Uske liye manually ek script ya update query chalani hogi:

// example : 
//        await Admin.updateMany(
//   { role: { $exists: false } },   // jinke pass role field nahi hai
//   { $set: { role: "admin" } }     // unme role add kar do
// );

// Ye command sabhi purane documents me role: "admin" field daal dega.

// 👉 Matlab:

// Future objects → automatically naya field aayega.

// Past objects → manually update karna padega agar zaroorat


// QUESTION: 

// Ye command sabhi purane documents me role: "admin" field daal dega.

// 👉 Matlab:

// Future objects → automatically naya field aayega.

// Past objects → manually update karna padega agar zaroorat

// Mongoose (Node.js code me use karne ke liye)

// await Admin.updateMany(
//   {},                             // {} means sabhi documents
//   { $set: { role: "admin" } }     // role field add/update ho jayega
// );

// console.log("✅ Role added to all previous objects");

// MongoDB Shell / Compass command

// db.admins.updateMany(
//   {}, 
//   { $set: { role: "admin" } }
// );

// ⚡ Ye command sabhi existing objects me role field add kar dega.
// Aage se jo naya document create hoga, wo to waise bhi role ke sath aayega (schema change hone ke baad).

// 👉 To ab tumhare paas 2 benefit ho gaye:

// Future objects → schema ke default se role aa jayega.

// Previous objects → updateMany se role field sabme insert ho jayega.

// Bhai, kya tum chahte ho main tumhare backend me ek temporary script/route bana du (jaise /api/admin/addRoleField) jo ek baar run karke sabhi purane admins me role add kar de?

// Temporary route to add role field in all admins
// app.get("/api/admin/addRoleField", async (req, res) => {
//   try {
//     const result = await Admin.updateMany(
//       { role: { $exists: false } },   // jinke pass role nahi hai unhi ko update karega
//       { $set: { role: "admin" } }     // role field set karega
//     );

//     res.json({
//       message: "✅ Role field added successfully to old admins",
//       modifiedCount: result.modifiedCount
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "❌ Something went wrong" });
//   }
// });
