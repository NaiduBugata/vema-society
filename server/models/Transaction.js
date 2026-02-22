const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    month: { type: String, required: true }, // Format: YYYY-MM
    salary: { type: Number, required: true },
    thriftDeduction: { type: Number, required: true },
    loanEMI: { type: Number, default: 0 },
    interestPayment: { type: Number, default: 0 },
    principalRepayment: { type: Number, default: 0 }, // Part of EMI going to principal
    loanAmount: { type: Number, default: 0 }, // 'Loan Amount' column from Excel (full EMI = principal + interest)
    totalDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    // Monthly snapshots – preserve the exact balance values from the uploaded Excel
    cbThriftBalance: { type: Number, default: 0 },   // Cumulative thrift balance as-on this month
    loanBalance: { type: Number, default: 0 },        // Remaining loan balance at end of this month
    remarks: { type: String }
}, { timestamps: true });

// Ensure one transaction per employee per month
transactionSchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);
