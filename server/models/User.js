const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'employee'],
        default: 'employee',
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: function () { return this.role === 'employee'; } // Only link if employee
    },
    isFirstLogin: {
        type: Boolean,
        default: true,
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    }
}, { timestamps: true });

// Pre-save hook for password hashing
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
