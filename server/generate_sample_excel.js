const xlsx = require('xlsx');

const employees = [
    { Name: "Manoj Kumar", Email: "manoj.kumar@vignan.ac.in", Department: "CSE", Designation: "Professor", Phone: "9876543210", Salary: 120000, Thrift: 5000 },
    { Name: "Sita Devi", Email: "sita.devi@vignan.ac.in", Department: "ECE", Designation: "Associate Professor", Phone: "9876543211", Salary: 95000, Thrift: 4000 },
    { Name: "Ravi Teja", Email: "ravi.teja@vignan.ac.in", Department: "IT", Designation: "Assistant Professor", Phone: "9876543212", Salary: 60000, Thrift: 2500 },
    { Name: "Lakshmi Priya", Email: "lakshmi.priya@vignan.ac.in", Department: "EEE", Designation: "Lab Technician", Phone: "9876543213", Salary: 35000, Thrift: 1500 },
    { Name: "Suresh Babu", Email: "suresh.babu@vignan.ac.in", Department: "Mech", Designation: "Professor", Phone: "9876543214", Salary: 110000, Thrift: 4500 },
    { Name: "Anita Rao", Email: "anita.rao@vignan.ac.in", Department: "Civil", Designation: "Assistant Professor", Phone: "9876543215", Salary: 55000, Thrift: 2000 },
    { Name: "Venkatesh K", Email: "venkatesh.k@vignan.ac.in", Department: "Chemical", Designation: "Associate Professor", Phone: "9876543216", Salary: 90000, Thrift: 3500 },
    { Name: "Padma S", Email: "padma.s@vignan.ac.in", Department: "Biotech", Designation: "Assistant Professor", Phone: "9876543217", Salary: 58000, Thrift: 2200 },
    { Name: "Nageswara Rao", Email: "nageswara.rao@vignan.ac.in", Department: "CSE", Designation: "Senior Professor", Phone: "9876543218", Salary: 150000, Thrift: 6000 },
    { Name: "Kavitha M", Email: "kavitha.m@vignan.ac.in", Department: "IT", Designation: "Associate Professor", Phone: "9876543219", Salary: 88000, Thrift: 3500 },
    { Name: "Bhaskar Reddy", Email: "bhaskar.reddy@vignan.ac.in", Department: "ECE", Designation: "Lab Assistant", Phone: "9876543220", Salary: 25000, Thrift: 1000 },
    { Name: "Divya V", Email: "divya.v@vignan.ac.in", Department: "CSE", Designation: "Assistant Professor", Phone: "9876543221", Salary: 52000, Thrift: 2000 },
    { Name: "Rajesh G", Email: "rajesh.g@vignan.ac.in", Department: "Mech", Designation: "Associate Professor", Phone: "9876543222", Salary: 92000, Thrift: 3800 },
    { Name: "Swapna P", Email: "swapna.p@vignan.ac.in", Department: "EEE", Designation: "Assistant Professor", Phone: "9876543223", Salary: 56000, Thrift: 2100 },
    { Name: "Arjun N", Email: "arjun.n@vignan.ac.in", Department: "Civil", Designation: "HOD", Phone: "9876543224", Salary: 160000, Thrift: 7000 },
    { Name: "Meena K", Email: "meena.k@vignan.ac.in", Department: "MBA", Designation: "Professor", Phone: "9876543225", Salary: 115000, Thrift: 4800 },
    { Name: "Harish B", Email: "harish.b@vignan.ac.in", Department: "S&H", Designation: "Lecturer", Phone: "9876543226", Salary: 40000, Thrift: 1800 },
    { Name: "Geetha R", Email: "geetha.r@vignan.ac.in", Department: "S&H", Designation: "Assistant Professor", Phone: "9876543227", Salary: 50000, Thrift: 2000 },
    { Name: "Prasad T", Email: "prasad.t@vignan.ac.in", Department: "Admin", Designation: "Clerk", Phone: "9876543228", Salary: 30000, Thrift: 1200 },
    { Name: "Latha M", Email: "latha.m@vignan.ac.in", Department: "Admin", Designation: "Superintendent", Phone: "9876543229", Salary: 70000, Thrift: 3000 }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(employees);

xlsx.utils.book_append_sheet(wb, ws, "Employees");

xlsx.writeFile(wb, "employee_sample_20.xlsx");

console.log("Sample Excel file 'employee_sample_20.xlsx' created successfully!");
