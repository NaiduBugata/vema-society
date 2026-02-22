const mongoose = require('mongoose');

const uploadLogSchema = new mongoose.Schema({
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['employee_data', 'monthly_update'], required: true },
    totalRecords: { type: Number, required: true },
    successCount: { type: Number, required: true },
    failureCount: { type: Number, default: 0 },
    errorLog: [{
        row: Number,
        error: String
    }],
    status: { type: String, enum: ['success', 'partial', 'failed'], default: 'success' },
}, { timestamps: true });

module.exports = mongoose.model('MonthlyUploadLog', uploadLogSchema);
