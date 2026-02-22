require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('./models/Transaction');
    const Employee = require('./models/Employee');
    const MonthlyUploadLog = require('./models/MonthlyUploadLog');

    const totalTx = await Transaction.countDocuments();
    console.log('Total transactions in DB:', totalTx);

    if (totalTx > 0) {
        const sample = await Transaction.find().sort({ createdAt: -1 }).limit(3).populate('employee', 'name empId');
        sample.forEach(t => console.log(`  ${t.employee?.name} | ${t.month} | thrift:${t.thriftDeduction} | loanEMI:${t.loanEMI} | interest:${t.interestPayment}`));
    }

    const logs = await MonthlyUploadLog.find({ fileType: 'monthly_update' }).sort({ createdAt: -1 }).limit(5);
    console.log('\nRecent monthly upload logs:', logs.length);
    logs.forEach(l => console.log(`  ${l.fileName} | ${l.status} | success:${l.successCount} | fail:${l.failureCount} | errors:`, l.errorLog?.slice(0, 2)));

    const totalEmp = await Employee.countDocuments();
    const withLoan = await Employee.countDocuments({ $or: [{ activeLoan: { $ne: null } }, { loanStatus: 'Loan' }] });
    const noLoanNoFlag = await Employee.countDocuments({ activeLoan: null, loanStatus: { $nin: ['Loan', 'loan'] } });
    console.log(`\nTotal employees: ${totalEmp} | with loan/flag: ${withLoan} | no loan & no flag: ${noLoanNoFlag}`);

    mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
