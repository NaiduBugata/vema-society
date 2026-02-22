const mongoose = require('mongoose');

/**
 * ArchivedMonth — stores the full per-employee snapshot for one month.
 * Created when that month's Transaction records are deleted (>4 months old).
 * Lets admins still download historical data as Excel at any time.
 */
const archivedMonthSchema = new mongoose.Schema({
    month: { type: String, required: true, unique: true }, // YYYY-MM
    archivedAt: { type: Date, default: Date.now },
    employeeCount: { type: Number, default: 0 },
    // Society-level totals
    totalThrift:    { type: Number, default: 0 },
    totalEMI:       { type: Number, default: 0 },
    totalInterest:  { type: Number, default: 0 },
    totalDeduction: { type: Number, default: 0 },
    // Full per-employee row (mirrors Transaction fields)
    employees: [
        {
            empId:              { type: String },
            name:               { type: String },
            department:         { type: String },
            salary:             { type: Number, default: 0 },
            thriftDeduction:    { type: Number, default: 0 },
            loanEMI:            { type: Number, default: 0 },
            interestPayment:    { type: Number, default: 0 },
            principalRepayment: { type: Number, default: 0 },
            loanAmount:         { type: Number, default: 0 },
            totalDeduction:     { type: Number, default: 0 },
            paidAmount:         { type: Number, default: 0 },
            netSalary:          { type: Number, default: 0 },
            cbThriftBalance:    { type: Number, default: 0 },
            loanBalance:        { type: Number, default: 0 }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('ArchivedMonth', archivedMonthSchema);
