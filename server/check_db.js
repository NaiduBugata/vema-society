const mongoose = require('mongoose');
const Employee = require('./models/Employee');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const count = await Employee.countDocuments();
        console.log(`Total Employees: ${count}`);

        if (count > 0) {
            const emps = await Employee.find().limit(5);
            console.log(JSON.stringify(emps, null, 2));
        }
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
