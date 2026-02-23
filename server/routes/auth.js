const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/mailer');

const isEmailConfigured = () => !!(process.env.BREVO_USER && process.env.BREVO_PASS);

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check for user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            isFirstLogin: user.isFirstLogin,
            token: generateToken(user._id),
            employeeId: user.employeeId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change password (required for first login)
// @access  Private
router.post('/change-password', protect, async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;

        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Always take the user identity from the verified JWT
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If this is not the first login, require old password verification
        if (!user.isFirstLogin) {
            if (!oldPassword) {
                return res.status(400).json({ message: 'Old password is required' });
            }
            const isMatch = await user.matchPassword(oldPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid old password' });
            }
        }

        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset link — accepts email OR username/empId
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        // Early check — return a clear message if SMTP is not configured on this server
        if (!isEmailConfigured()) {
            return res.status(503).json({
                message: 'Email service is not configured on this server. Please contact the administrator to reset your password manually.'
            });
        }

        const { email } = req.body; // may actually be an email OR a username/empId
        if (!email || !String(email).trim()) {
            return res.status(400).json({ message: 'Please provide your registered email or Employee ID' });
        }

        const input = String(email).trim().toLowerCase();
        let user = null;
        let employee = null;

        // Try email lookup first
        employee = await Employee.findOne({ email: input });
        if (employee) {
            user = await User.findOne({ employeeId: employee._id });
        }

        // Fallback: treat input as username (empId)
        if (!user) {
            user = await User.findOne({ username: input })
                || await User.findOne({ username: email.trim() }); // preserve original case
            if (user && user.employeeId) {
                employee = await Employee.findById(user.employeeId);
            }
        }

        if (!user) {
            // Generic — don't reveal if account exists
            return res.json({ message: 'If this account is registered, a reset link has been sent.' });
        }

        // Send reset link directly to the employee's email (or admin if no employee email)
        const recipientEmail = employee?.email || process.env.EMAIL_USER;
        const viaAdmin = !employee?.email;

        // Generate secure random token (hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        console.log('[ForgotPwd] Sending reset link for user:', user.username, '→ to:', recipientEmail);

        await sendEmail(
            recipientEmail,
            'Password Reset',
            `<a href="${resetLink}">Reset Password</a>`
        );

        res.json({
            message: viaAdmin
                ? 'No email on file for this account. A reset link has been sent to the administrator.'
                : 'A password reset link has been sent to your registered email address.',
            viaAdmin
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            message: 'Failed to send reset email. Please try again later.',
            detail: error.message  // visible in browser for debugging
        });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using the token from email
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Hash the incoming raw token to compare with DB
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });
        }

        // Update password and clear reset fields
        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.isFirstLogin = false;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// @route   POST /api/auth/test-email
// @desc    Send a test email to the configured admin inbox (verify SMTP setup)
// @access  Private/Admin
router.post('/test-email', protect, async (req, res) => {
    try {
        if (!isEmailConfigured()) {
            return res.status(503).json({ message: 'Email service is not configured on this server.' });
        }
        const to = (req.body && req.body.to) ? String(req.body.to).trim() : null;
        if (!to) {
            return res.status(400).json({ message: 'Provide { "to": "you@example.com" }' });
        }
        await sendEmail(to, 'Test Email', '<p>Test email from Vignan Society server.</p>');
        res.json({ message: `Test email sent to ${to}` });
    } catch (error) {
        console.error('Test email error:', error.message);
        res.status(500).json({ message: `Failed to send test email: ${error.message}` });
    }
});

module.exports = router;
