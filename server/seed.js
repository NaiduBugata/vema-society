require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const admin = new User({
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            isFirstLogin: false
        });

        await admin.save();
        console.log('Admin user created');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
