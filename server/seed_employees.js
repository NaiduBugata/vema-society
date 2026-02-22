require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const testEmployees = [
    {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@vignan.edu',
        department: 'Computer Science',
        designation: 'Associate Professor',
        phone: '9876543210',
        salary: 65000,
        thriftContribution: 3000,
        thriftBalance: 36000 // 12 months accumulated
    },
    {
        name: 'Priya Sharma',
        email: 'priya.sharma@vignan.edu',
        department: 'Electronics',
        designation: 'Assistant Professor',
        phone: '9876543211',
        salary: 55000,
        thriftContribution: 2500,
        thriftBalance: 30000
    },
    {
        name: 'Amit Patel',
        email: 'amit.patel@vignan.edu',
        department: 'Mechanical',
        designation: 'Professor',
        phone: '9876543212',
        salary: 85000,
        thriftContribution: 4000,
        thriftBalance: 48000
    },
    {
        name: 'Sneha Reddy',
        email: 'sneha.reddy@vignan.edu',
        department: 'Civil',
        designation: 'Assistant Professor',
        phone: '9876543213',
        salary: 52000,
        thriftContribution: 2000,
        thriftBalance: 24000
    },
    {
        name: 'Vikram Singh',
        email: 'vikram.singh@vignan.edu',
        department: 'Electrical',
        designation: 'Associate Professor',
        phone: '9876543214',
        salary: 62000,
        thriftContribution: 3000,
        thriftBalance: 36000
    },
    {
        name: 'Lakshmi Iyer',
        email: 'lakshmi.iyer@vignan.edu',
        department: 'Mathematics',
        designation: 'Professor',
        phone: '9876543215',
        salary: 78000,
        thriftContribution: 3500,
        thriftBalance: 42000
    },
    {
        name: 'Suresh Babu',
        email: 'suresh.babu@vignan.edu',
        department: 'Physics',
        designation: 'Assistant Professor',
        phone: '9876543216',
        salary: 54000,
        thriftContribution: 2500,
        thriftBalance: 30000
    },
    {
        name: 'Anitha Rao',
        email: 'anitha.rao@vignan.edu',
        department: 'Chemistry',
        designation: 'Associate Professor',
        phone: '9876543217',
        salary: 64000,
        thriftContribution: 3000,
        thriftBalance: 36000
    },
    {
        name: 'Kiran Kumar',
        email: 'kiran.kumar@vignan.edu',
        department: 'IT',
        designation: 'Assistant Professor',
        phone: '9876543218',
        salary: 56000,
        thriftContribution: 2500,
        thriftBalance: 30000
    },
    {
        name: 'Deepa Menon',
        email: 'deepa.menon@vignan.edu',
        department: 'English',
        designation: 'Professor',
        phone: '9876543219',
        salary: 72000,
        thriftContribution: 3500,
        thriftBalance: 42000
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        // Clear existing employees
        await Employee.deleteMany({});
        console.log('Cleared existing employees');

        // Insert test employees
        const employees = await Employee.insertMany(testEmployees);
        console.log(`Created ${employees.length} test employees`);

        console.log('\n✅ Test Employees Created:');
        employees.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.name} (${emp.department}) - Salary: ₹${emp.salary}, Thrift: ₹${emp.thriftBalance}`);
        });

        console.log('\n🎯 Summary:');
        console.log(`Total Employees: ${employees.length}`);
        console.log(`Total Monthly Thrift: ₹${employees.reduce((sum, e) => sum + e.thriftContribution, 0)}`);
        console.log(`Total Thrift Balance: ₹${employees.reduce((sum, e) => sum + e.thriftBalance, 0)}`);

        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
