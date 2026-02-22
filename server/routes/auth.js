const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/authMiddleware');
const { transporter, sendSelfTestEmail, isEmailConfigured } = require('../utils/mailer');

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

        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        console.log('[ForgotPwd] Sending reset link for user:', user.username, '→ to:', recipientEmail);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: recipientEmail,
            subject: 'Vignan Society — Password Reset Request',
            html: viaAdmin
                ? `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
                    <h2 style="color:#4f46e5;margin-bottom:8px;">Vignan Employees Thrift Society</h2>
                    <p style="color:#dc2626;font-weight:600;">Admin Notice — Employee Password Reset</p>
                    <p style="color:#374151;">Employee <strong>${employee?.name || user.username}</strong> (ID: <strong>${employee?.empId || user.username}</strong>) requested a password reset but has no registered email.</p>
                    <p style="color:#374151;">Share the link below with this employee. It expires in <strong>1 hour</strong>.</p>
                    <div style="text-align:center;margin:32px 0;">
                        <a href="${resetURL}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password Link</a>
                    </div>
                    <p style="color:#64748b;font-size:13px;word-break:break-all;">Direct URL: ${resetURL}</p>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
                    <p style="color:#94a3b8;font-size:12px;text-align:center;">Vignan Employees Mutual Aid Society</p>
                </div>`
                : `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
                    <h2 style="color:#4f46e5;margin-bottom:8px;">Vignan Employees Thrift Society</h2>
                    <p style="color:#64748b;margin-bottom:24px;">You requested a password reset for your account.</p>
                    <p style="margin-bottom:8px;">Hello <strong>${employee?.name || user.username}</strong>,</p>
                    <p style="color:#374151;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                    <div style="text-align:center;margin:32px 0;">
                        <a href="${resetURL}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a>
                    </div>
                    <p style="color:#94a3b8;font-size:12px;">If you did not request this, ignore this email.</p>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
                    <p style="color:#94a3b8;font-size:12px;text-align:center;">Vignan Employees Mutual Aid Society</p>
                </div>`
        };

        await transporter.sendMail(mailOptions);

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
        const sentTo = await sendSelfTestEmail();
        res.json({ message: `Test email sent to ${sentTo}` });
    } catch (error) {
        console.error('Test email error:', error.message);
        res.status(500).json({ message: `Failed to send test email: ${error.message}` });
    }
});

module.exports = router;
