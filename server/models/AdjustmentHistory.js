const mongoose = require('mongoose');

const adjustmentHistorySchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId, // Could be User ID or Employee ID of admin
        ref: 'User',
        required: true
    },
    actionType: {
        type: String,
        enum: [
            'create_employee',
            'update_salary',
            'update_thrift',
            'create_loan',
            'close_loan',
            'adjust_balance',
            'monthly_upload',
            'yearly_thrift_update',
            'other'
        ],
        required: true
    },
    targetField: { type: String }, // e.g., 'loanAmount', 'thriftBalance'
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    remarks: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AdjustmentHistory', adjustmentHistorySchema);
