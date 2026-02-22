require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Loan = require('./models/Loan');
const Transaction = require('./models/Transaction');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected - Seeding Loans & Transactions...\n');

        // Fetch all employees
        const employees = await Employee.find().sort({ name: 1 });
        if (employees.length < 5) {
            console.log('Need at least 5 employees. Run seed_verification.js first.');
            process.exit(1);
        }

        // Assign empIds if missing
        for (let i = 0; i < employees.length; i++) {
            if (!employees[i].empId) {
                employees[i].empId = (i + 1) * 10; // 10, 20, 30, ...
                await employees[i].save();
                console.log(`Assigned empId ${employees[i].empId} to ${employees[i].name}`);
            }
        }

        // Set thrift balances based on contribution (simulate 12 months of history)
        for (const emp of employees) {
            if (emp.thriftBalance === 0 && emp.thriftContribution > 0) {
                emp.thriftBalance = emp.thriftContribution * 12;
                await emp.save();
                console.log(`Set thrift balance for ${emp.name}: ₹${emp.thriftBalance}`);
            }
        }

        // Clear existing loans and transactions to avoid duplicates
        const existingLoans = await Loan.countDocuments();
        if (existingLoans > 0) {
            console.log(`\nFound ${existingLoans} existing loans. Clearing old data...`);
            await Loan.deleteMany({});
            await Transaction.deleteMany({});
            // Reset employee loan references
            await Employee.updateMany({}, { $set: { activeLoan: null, guaranteeingLoans: [] } });
            console.log('Cleared existing loans, transactions, and references.\n');
        }

        // ─── Create Loans ───────────────────────────────────────────
        // Employee 0 borrows, employees 1 & 2 are sureties
        // Employee 3 borrows, employees 4 & 0 are sureties

        const loanData = [
            {
                borrowerIdx: 0,
                suretyIdxs: [1, 2],
                loanAmount: 100000,
                interestRate: 12,
                emi: 5000,
                remainingBalance: 75000,
                totalInterestPaid: 4500,
                status: 'active',
                startDate: new Date('2025-06-01')
            },
            {
                borrowerIdx: 3,
                suretyIdxs: [4, 0],
                loanAmount: 200000,
                interestRate: 10,
                emi: 8000,
                remainingBalance: 160000,
                totalInterestPaid: 8000,
                status: 'active',
                startDate: new Date('2025-09-01')
            }
        ];

        // Only create if we have enough employees
        if (employees.length >= 2) {
            // Also create a closed loan for employee 1 (to show history)
            loanData.push({
                borrowerIdx: 1,
                suretyIdxs: [2, 3],
                loanAmount: 50000,
                interestRate: 12,
                emi: 4500,
                remainingBalance: 0,
                totalInterestPaid: 5400,
                status: 'closed',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-01-01')
            });
        }

        for (const ld of loanData) {
            if (ld.borrowerIdx >= employees.length) continue;

            const borrower = employees[ld.borrowerIdx];
            const sureties = ld.suretyIdxs
                .filter(idx => idx < employees.length)
                .map(idx => employees[idx]._id);

            const loan = new Loan({
                borrower: borrower._id,
                sureties,
                loanAmount: ld.loanAmount,
                interestRate: ld.interestRate,
                emi: ld.emi,
                remainingBalance: ld.remainingBalance,
                totalInterestPaid: ld.totalInterestPaid,
                status: ld.status,
                startDate: ld.startDate,
                endDate: ld.endDate || null
            });
            await loan.save();

            // Link loan to employee
            if (ld.status === 'active') {
                borrower.activeLoan = loan._id;
                await borrower.save();
            }

            // Link sureties
            for (const suretyId of sureties) {
                await Employee.findByIdAndUpdate(suretyId, {
                    $addToSet: { guaranteeingLoans: loan._id }
                });
            }

            console.log(`Loan created: ${borrower.name} borrows ₹${ld.loanAmount} (${ld.status}) | Sureties: ${ld.suretyIdxs.map(i => employees[i]?.name).join(', ')}`);
        }

        // ─── Create Transaction History ─────────────────────────────
        // Generate 6 months of transactions: 2025-09 to 2026-02
        const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];

        // Build loan map for EMI info
        const activeLoans = await Loan.find({ status: 'active' });
        const loanMap = {};
        for (const loan of activeLoans) {
            loanMap[loan.borrower.toString()] = loan;
        }

        console.log('\nCreating transaction history...');

        for (const month of months) {
            for (const emp of employees) {
                const empIdStr = emp._id.toString();
                const loan = loanMap[empIdStr];

                const thriftDeduction = emp.thriftContribution || 0;
                const loanEMI = loan ? loan.emi : 0;
                const interestRate = loan ? loan.interestRate : 0;
                // Simple interest calculation: monthly interest on remaining balance
                const monthlyInterest = loan
                    ? Math.round((loan.remainingBalance * interestRate / 100 / 12) * 100) / 100
                    : 0;
                const principalRepayment = Math.max(0, loanEMI - monthlyInterest);
                const totalDeductions = thriftDeduction + loanEMI;
                const netSalary = emp.salary - totalDeductions;

                try {
                    await Transaction.create({
                        employee: emp._id,
                        month,
                        salary: emp.salary,
                        thriftDeduction,
                        loanEMI,
                        interestPayment: monthlyInterest,
                        principalRepayment,
                        otherDeductions: 0,
                        netSalary
                    });
                } catch (err) {
                    if (err.code === 11000) {
                        // Duplicate - skip
                        continue;
                    }
                    console.error(`Error creating txn for ${emp.name} ${month}:`, err.message);
                }
            }
            console.log(`  Transactions created for ${month}`);
        }

        // Print summary
        console.log('\n═══════════════════════════════════════════');
        console.log('  SEED SUMMARY');
        console.log('═══════════════════════════════════════════');

        const totalEmployees = await Employee.countDocuments();
        const totalActiveLoans = await Loan.countDocuments({ status: 'active' });
        const totalClosedLoans = await Loan.countDocuments({ status: 'closed' });
        const totalTransactions = await Transaction.countDocuments();

        console.log(`  Employees:    ${totalEmployees}`);
        console.log(`  Active Loans: ${totalActiveLoans}`);
        console.log(`  Closed Loans: ${totalClosedLoans}`);
        console.log(`  Transactions: ${totalTransactions}`);
        console.log('═══════════════════════════════════════════');

        // Show employee details
        const allEmps = await Employee.find().populate('activeLoan').sort({ empId: 1 });
        console.log('\nEmployee Details:');
        for (const emp of allEmps) {
            const loanInfo = emp.activeLoan
                ? `Loan: ₹${emp.activeLoan.loanAmount} (Bal: ₹${emp.activeLoan.remainingBalance})`
                : 'No active loan';
            console.log(`  [${emp.empId || '-'}] ${emp.name} | Thrift: ₹${emp.thriftBalance} | ${loanInfo} | Sureties for: ${emp.guaranteeingLoans?.length || 0} loans`);
        }

        console.log('\nSeeding complete!');
        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
