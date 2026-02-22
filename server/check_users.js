const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const employeeUsers = await User.find({ role: 'employee' }).limit(5);
        console.log(`✓ Total employee users: ${await User.countDocuments({ role: 'employee' })}`);
        
        if (employeeUsers.length > 0) {
            console.log('\nFirst 5 employee users:');
            employeeUsers.forEach(user => {
                console.log(`  - Username: ${user.username}, FirstLogin: ${user.isFirstLogin}, EmployeeID: ${user.employeeId}`);
            });
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
