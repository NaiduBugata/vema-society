/**
 * archiveOldMonths.js
 * Keeps only the 4 most-recent months of detailed Transaction records.
 * Any month older than that is summarised into ArchivedMonth and the
 * raw Transaction rows are deleted.
 */
const Transaction   = require('../models/Transaction');
const Employee      = require('../models/Employee');
const ArchivedMonth = require('../models/ArchivedMonth');

const MONTHS_TO_KEEP = 4;

async function archiveOldMonths() {
    try {
        // 1. Get all distinct months that still have transaction rows
        const monthDocs = await Transaction.distinct('month');
        if (!monthDocs.length) return;

        // 2. Sort newest → oldest, keep the freshest MONTHS_TO_KEEP
        const sorted = [...monthDocs].sort().reverse(); // descending YYYY-MM sort
        const toArchive = sorted.slice(MONTHS_TO_KEEP);   // everything beyond the 4th

        if (!toArchive.length) return;

        for (const month of toArchive) {
            // Skip if already archived
            const already = await ArchivedMonth.findOne({ month });
            if (already) {
                // Still delete raw transactions for this month (cleanup)
                await Transaction.deleteMany({ month });
                continue;
            }

            // 3. Load all transactions for this month with employee data
            const txns = await Transaction.find({ month }).lean();

            if (!txns.length) continue;

            // Gather employee details
            const empIds = txns.map(t => t.employee);
            const emps = await Employee.find({ _id: { $in: empIds } })
                .select('empId name department')
                .lean();
            const empMap = {};
            for (const e of emps) empMap[e._id.toString()] = e;

            // Build employee rows
            const employees = txns.map(t => {
                const e = empMap[t.employee?.toString()] || {};
                return {
                    empId:              e.empId        || '',
                    name:               e.name         || '',
                    department:         e.department   || '',
                    salary:             t.salary             || 0,
                    thriftDeduction:    t.thriftDeduction    || 0,
                    loanEMI:            t.loanEMI            || 0,
                    interestPayment:    t.interestPayment    || 0,
                    principalRepayment: t.principalRepayment || 0,
                    loanAmount:         t.loanAmount         || 0,
                    totalDeduction:     t.totalDeduction     || 0,
                    paidAmount:         t.paidAmount         || 0,
                    netSalary:          t.netSalary          || 0,
                    cbThriftBalance:    t.cbThriftBalance    || 0,
                    loanBalance:        t.loanBalance        || 0
                };
            });

            // Society-level totals
            const totals = employees.reduce((acc, r) => {
                acc.totalThrift    += r.thriftDeduction;
                acc.totalEMI       += r.loanEMI;
                acc.totalInterest  += r.interestPayment;
                acc.totalDeduction += r.totalDeduction;
                return acc;
            }, { totalThrift: 0, totalEMI: 0, totalInterest: 0, totalDeduction: 0 });

            // 4. Save archive document
            await ArchivedMonth.create({
                month,
                employeeCount: employees.length,
                ...totals,
                employees
            });

            // 5. Delete the raw transaction rows
            await Transaction.deleteMany({ month });

            console.log(`[Archive] Month ${month} archived (${employees.length} employees) and raw transactions deleted.`);
        }
    } catch (err) {
        console.error('[Archive] archiveOldMonths error:', err.message);
    }
}

module.exports = archiveOldMonths;
