import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

function AdminDashboard() {

  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);

  const fetchAttendance = async () => {

    const res = await fetch("http://localhost:5000/attendance-list");
    const result = await res.json();
    setData(result);

    const countRes = await fetch("http://localhost:5000/attendance-count");
    const countData = await countRes.json();
    setCount(countData.total);

  };

  useEffect(() => {

    fetchAttendance();

    const interval = setInterval(fetchAttendance, 3000);

    return () => clearInterval(interval);

  }, []);

  const exportExcel = () => {

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, "attendance.xlsx");

  };

  return (

    <div style={{ textAlign: "center" }}>

      <h2>Admin Attendance Dashboard</h2>

      <h3>Total Attendance: {count}</h3>

      <button onClick={exportExcel}>
        Export Excel
      </button>

      <table border="1" style={{ margin: "20px auto" }}>

        <thead>
          <tr>
            <th>Name</th>
            <th>College</th>
            <th>Scan Time</th>
          </tr>
        </thead>

        <tbody>

          {data.map((item, i) => (

            <tr key={i}>
              <td>{item.name}</td>
              <td>{item.college_name}</td>
              <td>{item.scan_time}</td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default AdminDashboard;