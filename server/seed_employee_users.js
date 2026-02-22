require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        // Get all employees
        const employees = await Employee.find({});
        
        if (employees.length === 0) {
            console.log('❌ No employees found. Run seed_employees.js first!');
            process.exit(1);
        }

        console.log(`Found ${employees.length} employees`);

        // Clear existing employee users (keep admin)
        await User.deleteMany({ role: 'employee' });
        console.log('Cleared existing employee users');

        // Create user accounts for each employee
        const employeeUsers = [];
        
        for (const emp of employees) {
            // Create username from email (part before @)
const username = emp.email.split('@')[0];
            
            const user = new User({
                username: username,
                password: 'employee123', // Default password
                role: 'employee',
                employeeId: emp._id,
                isFirstLogin: true // Force password change on first login
            });

            await user.save();
            employeeUsers.push(user);
            
            console.log(`✅ Created user: ${username} for ${emp.name}`);
        }

        console.log('\n🎉 Employee User Accounts Created Successfully!\n');
        console.log('━'.repeat(80));
        console.log('Login Credentials (All passwords: employee123):\n');
        
        employees.forEach((emp, index) => {
            const username = emp.email.split('@')[0];
            console.log(`${index + 1}. ${emp.name}`);
            console.log(`   Username: ${username}`);
            console.log(`   Email: ${emp.email}`);
            console.log(`   Department: ${emp.department}`);
            console.log('');
        });

        console.log('━'.repeat(80));
        console.log('\n📋 Summary:');
        console.log(`Total Employee Users: ${employeeUsers.length}`);
        console.log('Default Password: employee123');
        console.log('First Login: Password change required\n');
        
        console.log('🔐 Test Login:');
        console.log('URL: http://localhost:5173');
        console.log('Username: rajesh.kumar');
        console.log('Password: employee123\n');

        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
