require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

const employees = [
    { Name: "Ver User 1", Email: "user1.ver@test.com", Department: "CSE", Designation: "Assistant Professor", Phone: "9999900001", Salary: 50000, Thrift: 2000 },
    { Name: "Ver User 2", Email: "user2.ver@test.com", Department: "ECE", Designation: "Lab Assistant", Phone: "9999900002", Salary: 30000, Thrift: 1500 },
    { Name: "Ver User 3", Email: "user3.ver@test.com", Department: "Mech", Designation: "Professor", Phone: "9999900003", Salary: 80000, Thrift: 4000 },
    { Name: "Ver User 4", Email: "user4.ver@test.com", Department: "Civil", Designation: "Clerk", Phone: "9999900004", Salary: 25000, Thrift: 1000 },
    { Name: "Ver User 5", Email: "user5.ver@test.com", Department: "IT", Designation: "Lecturer", Phone: "9999900005", Salary: 45000, Thrift: 1800 }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB for seeding verification users...');

        for (const empData of employees) {
            const existing = await Employee.findOne({ email: empData.Email });
            if (existing) {
                console.log(`Skipping existing: ${empData.Email}`);
                continue;
            }

            // Create Employee
            const newEmp = new Employee({
                name: empData.Name,
                email: empData.Email,
                department: empData.Department,
                designation: empData.Designation,
                phone: empData.Phone,
                salary: empData.Salary,
                thriftContribution: empData.Thrift,
                thriftBalance: 0
            });
            await newEmp.save();

            // Create User Login
            const password = "password123"; // Easy password for testing
            const newUser = new User({
                username: empData.Email,
                password: password,
                role: 'employee',
                employeeId: newEmp._id,
                isFirstLogin: true
            });
            await newUser.save();

            console.log(`Created: ${empData.Email} / ${password}`);
        }

        console.log('Seeding complete.');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
