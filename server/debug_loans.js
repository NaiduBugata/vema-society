require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Employee = require('./models/Employee');
    const Transaction = require('./models/Transaction');
    const Loan = require('./models/Loan');

    // Employees with loan transactions
    const empsWithTx = await Transaction.find({ loanEMI: { $gt: 0 } }).distinct('employee');
    console.log('Employees with loanEMI > 0 in transactions:', empsWithTx.length);

    for (const empId of empsWithTx.slice(0, 10)) {
        const emp = await Employee.findById(empId);
        const tx = await Transaction.find({ employee: empId, loanEMI: { $gt: 0 } }).sort({ month: -1 }).limit(1);
        console.log(`  Emp: ${emp?.name} | empId: ${emp?.empId} | activeLoan: ${emp?.activeLoan} | loanStatus: "${emp?.loanStatus}"`);
        if (tx[0]) console.log(`    Latest loan tx: ${tx[0].month} | loanEMI: ${tx[0].loanEMI} | interest: ${tx[0].interestPayment}`);
    }

    const allLoans = await Loan.find({ status: 'active' });
    console.log('\nTotal active Loan docs:', allLoans.length);
    for (const l of allLoans) {
        const emp = await Employee.findById(l.borrower);
        console.log(`  Loan borrower: ${emp?.name} | emp.activeLoan: ${emp?.activeLoan} | loan._id: ${l._id} | balance: ${l.remainingBalance}`);
    }

    // Employees with loanStatus='Loan' but no activeLoan
    const flagged = await Employee.find({ loanStatus: 'Loan', activeLoan: null });
    console.log('\nEmployees with loanStatus=Loan but no activeLoan:', flagged.length);
    flagged.forEach(e => console.log(`  ${e.name} | empId: ${e.empId}`));

    // Employees with no loanStatus and no activeLoan but have loan in transactions
    console.log('\nFull mismatch check (no flag, no activeLoan, but has loan tx):');
    for (const empId of empsWithTx) {
        const emp = await Employee.findById(empId);
        if (!emp?.activeLoan && String(emp?.loanStatus || '').toLowerCase() !== 'loan') {
            const tx = await Transaction.findOne({ employee: empId, loanEMI: { $gt: 0 } }).sort({ month: -1 });
            console.log(`  ${emp?.name} | empId: ${emp?.empId} | loanStatus: "${emp?.loanStatus}" | latest loanEMI: ${tx?.loanEMI}`);
        }
    }

    mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
