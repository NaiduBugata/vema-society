const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');

async function fixIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Drop the old non-sparse email index
        console.log('Dropping old email index...');
        try {
            await Employee.collection.dropIndex('email_1');
            console.log('✓ Old email index dropped');
        } catch (err) {
            if (err.code === 27) {
                console.log('∙ Email index does not exist (already dropped)');
            } else {
                throw err;
            }
        }

        // Ensure new sparse indexes
        console.log('Creating new sparse indexes...');
        await Employee.syncIndexes();
        console.log('✓ Indexes synchronized');

        // Verify indexes
        const indexes = await Employee.collection.getIndexes();
        console.log('\nCurrent indexes:');
        for (const [name, index] of Object.entries(indexes)) {
            console.log(`  ${name}:`, index);
        }

        await mongoose.connection.close();
        console.log('\n✓ Index fix completed!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixIndexes();
