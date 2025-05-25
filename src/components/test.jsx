import React, { useState } from "react";

const StudentTable = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const students = [
    {
      name: "Ayan Roy",
      roll: "101",
      father: "Mr. Raj Roy",
      mobile: "9876543210",
      marks: { Math: 85, Physics: 78, Chemistry: 90 },
    },
    {
      name: "Sahil Khan",
      roll: "102",
      father: "Mr. Ahmed Khan",
      mobile: "9123456789",
      marks: { Math: 92, Physics: 88, Chemistry: 80 },
    },
    {
      name: "Riya Sen",
      roll: "103",
      father: "Mr. Dev Sen",
      mobile: "9988776655",
      marks: { Math: 75, Physics: 84, Chemistry: 79 },
    },
    {
      name: "Vikram Das",
      roll: "104",
      father: "Mr. Dinesh Das",
      mobile: "9654321890",
      marks: { Math: 88, Physics: 82, Chemistry: 85 },
    },
    {
      name: "Pooja Mehta",
      roll: "105",
      father: "Mr. Rakesh Mehta",
      mobile: "9900112233",
      marks: { Math: 95, Physics: 91, Chemistry: 89 },
    },
  ];

  const openModal = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setShowModal(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Student Marks Table</h1>
      <table className="w-full border border-gray-300 shadow-md rounded-md overflow-hidden">
        <thead className="bg-yellow-100">
          <tr>
            <th className="py-2 px-4 border">Name</th>
            <th className="py-2 px-4 border">Math</th>
            <th className="py-2 px-4 border">Physics</th>
            <th className="py-2 px-4 border">Chemistry</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr
              key={index}
              className="hover:bg-yellow-50 transition cursor-pointer"
            >
              <td
                className="py-2 px-4 border text-blue-600 hover:underline"
                onClick={() => openModal(student)}
              >
                {student.name}
              </td>
              <td className="py-2 px-4 border text-center">{student.marks.Math}</td>
              <td className="py-2 px-4 border text-center">{student.marks.Physics}</td>
              <td className="py-2 px-4 border text-center">{student.marks.Chemistry}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80 relative">
            <h2 className="text-xl font-semibold mb-2">Student Details</h2>
            <p><strong>Name:</strong> {selectedStudent.name}</p>
            <p><strong>Roll No:</strong> {selectedStudent.roll}</p>
            <p><strong>Father's Name:</strong> {selectedStudent.father}</p>
            <p><strong>Mobile:</strong> {selectedStudent.mobile}</p>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
