const xlsx = require('xlsx');

const employees = [
    { Name: "Ver User 1", Email: "user1.ver@test.com", Department: "CSE", Designation: "Assistant Professor", Phone: "9999900001", Salary: 50000, Thrift: 2000 },
    { Name: "Ver User 2", Email: "user2.ver@test.com", Department: "ECE", Designation: "Lab Assistant", Phone: "9999900002", Salary: 30000, Thrift: 1500 },
    { Name: "Ver User 3", Email: "user3.ver@test.com", Department: "Mech", Designation: "Professor", Phone: "9999900003", Salary: 80000, Thrift: 4000 },
    { Name: "Ver User 4", Email: "user4.ver@test.com", Department: "Civil", Designation: "Clerk", Phone: "9999900004", Salary: 25000, Thrift: 1000 },
    { Name: "Ver User 5", Email: "user5.ver@test.com", Department: "IT", Designation: "Lecturer", Phone: "9999900005", Salary: 45000, Thrift: 1800 }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(employees);

xlsx.utils.book_append_sheet(wb, ws, "Employees");

xlsx.writeFile(wb, "verification_sample_5.xlsx");

console.log("Verification sample file 'verification_sample_5.xlsx' created.");
