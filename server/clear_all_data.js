const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Employee = require('./models/Employee');
const User = require('./models/User');
const MonthlyUploadLog = require('./models/MonthlyUploadLog');

async function clearAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear all collections
        await Employee.deleteMany({});
        await User.deleteMany({ role: 'employee' }); // Keep admin
        await MonthlyUploadLog.deleteMany({});
        
        console.log('✓ All employee data cleared');
        console.log('✓ All upload logs cleared');
        
        const adminCount = await User.countDocuments({ role: 'admin' });
        console.log(`✓ Admin users preserved: ${adminCount}`);

        await mongoose.connection.close();
        console.log('\nDatabase cleared successfully!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearAll();
