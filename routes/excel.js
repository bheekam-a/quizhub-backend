

const express = require("express");
const ExcelJS = require("exceljs");
const StudentInformation = require("../models/StudentInformation");

const router = express.Router();

router.get("/all-users-information", async (req, res) => {
  try {
    // 1. Fetch all student records (sorted by creation date descending)
    const students = await StudentInformation.find().sort({ createdAt: -1 }).lean();

    // 2. Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("students");

    // 3. Define columns (Excel headers)
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Ph_No", key: "phone", width: 30 },
      { header: "Marks", key: "marks", width: 20 },
      { header: "Date", key: "createdAt", width: 20 },
      { header: "Student_ID", key: "id", width: 20 }
    ];

    // 4. Insert data and alternate row colors
    students.forEach((s, index) => {
      const row = worksheet.addRow({
        name: s.name,
        email: s.email,
        phone: s.phone,
        marks: s.marks,
        id: s._id,
        createdAt: new Date(s.createdAt).toLocaleString()
      });

      // Alternate row color (zebra striping)  // extra content  if you want other comment 
      // if (index % 2 === 0) {
      //   row.fill = {
      //     type: 'pattern',
      //     pattern: 'solid',
      //     fgColor: { argb: 'FF1F2937' } // dark shade
      //   };
      // }
    });

    // 5. Header row styling                         // extra content  if you want other comment 
    // worksheet.getRow(1).font = { bold: true };
    // worksheet.getRow(1).fill = {
    //   type: 'pattern',
    //   pattern: 'solid',
    //   fgColor: { argb: 'FF3B82F6' } // blue header
    // };
    // worksheet.getRow(1).alignment = { horizontal: 'center' };

    // 6. Enable autoFilter for all headers                        // extra content  if you want other comment 
    // worksheet.autoFilter = {
    //   from: 'A1',
    //   to: 'F1',
    // };

    // 7. Send Excel file as response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
