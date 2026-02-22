const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');

async function checkEmployees() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const count = await Employee.countDocuments();
        console.log(`✓ Total employees: ${count}`);
        
        if (count > 0) {
            const firstFive = await Employee.find().limit(5);
            console.log('\nFirst 5 employees:');
            firstFive.forEach(emp => {
                console.log(`  - ${emp.name} (ID: ${emp.empId}, Email: ${emp.email || 'NOT SET'})`);
            });
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkEmployees();
