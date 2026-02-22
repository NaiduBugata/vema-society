/* eslint-disable */
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const T = require('./models/Transaction');
    const U = require('./models/User');
    const E = require('./models/Employee');
    const Log = require('./models/MonthlyUploadLog');

    const txCount = await T.countDocuments();
    const eCount = await E.countDocuments();
    console.log('=== DB STATE ===');
    console.log('Employees:', eCount, '| Transactions:', txCount);

    // Latest upload logs
    const logs = await Log.find({}).sort({ createdAt: -1 }).limit(3);
    console.log('\n=== Last 3 Upload Logs ===');
    for (const log of logs) {
        console.log(`\n[${log.fileType}] ${log.fileName} | ${log.status}`);
        console.log(`  total:${log.totalRecords} success:${log.successCount} fail:${log.failureCount}`);
        if (log.errorLog && log.errorLog.length > 0) {
            console.log('  First 5 errors:');
            log.errorLog.slice(0, 5).forEach(e => console.log(`    Row ${e.row}: ${e.error}`));
        }
    }

    // Check latest transactions
    const txSample = await T.find({}).sort({ createdAt: -1 }).limit(5).populate('employee', 'name empId');
    if (txSample.length > 0) {
        console.log('\nLatest Transactions:');
        txSample.forEach(t => {
            console.log(` - ${t.employee?.empId} | ${t.month} | thrift:${t.thriftDeduction} | loanEMI:${t.loanEMI}`);
        });
    }

    // Check employees WITHOUT login accounts (using empId as username)
    const allEmps = await E.find({}).select('empId name');
    const matchedUsers = await U.find({ username: { $in: allEmps.map(e => String(e.empId)) } }).select('username');
    const matchedSet = new Set(matchedUsers.map(u => u.username));
    const noAccount = allEmps.filter(e => !matchedSet.has(String(e.empId)));
    console.log('\nEmployees WITHOUT login account:', noAccount.length);
    if (noAccount.length > 0 && noAccount.length <= 10) {
        noAccount.forEach(e => console.log('  MISSING:', e.empId, e.name));
    }

    mongoose.disconnect();
}).catch(e => console.error('DB Error:', e.message));
