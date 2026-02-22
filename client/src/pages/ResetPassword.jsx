import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-400', width: 'w-1/5' };
    if (score === 2) return { label: 'Weak',      color: 'bg-orange-500', text: 'text-orange-400', width: 'w-2/5' };
    if (score === 3) return { label: 'Fair',      color: 'bg-yellow-500', text: 'text-yellow-400', width: 'w-3/5' };
    if (score === 4) return { label: 'Strong',    color: 'bg-lime-500',   text: 'text-lime-400',   width: 'w-4/5' };
    return                 { label: 'Very Strong',color: 'bg-green-500',  text: 'text-green-400',  width: 'w-full' };
};

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const strength = getPasswordStrength(newPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setLoading(true);
        try {
            await api.post(`/auth/reset-password/${token}`, { newPassword, confirmPassword });
            setSuccess(true);
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-full mb-4">
                        <KeyRound size={32} className="text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                    <p className="text-slate-400 text-sm mt-2">Enter your new password below</p>
                </div>

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle size={56} className="text-green-400" />
                        </div>
                        <p className="text-green-300 font-semibold text-lg">Password Updated!</p>
                        <p className="text-slate-400 text-sm">
                            Your password has been reset successfully. Redirecting to login...
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="w-full px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {/* Password strength bar */}
                            {newPassword && strength && (
                                <div className="mt-2 space-y-1">
                                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs font-medium ${strength.text}`}>{strength.label}</p>
                                        <p className="text-xs text-slate-500">
                                            {strength.label === 'Very Strong' ? '✓ Great password' :
                                             strength.label === 'Strong' ? 'Try adding a symbol' :
                                             strength.label === 'Fair' ? 'Add numbers & symbols' :
                                             'Use 10+ chars, uppercase, numbers, symbols'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your new password"
                                    className="w-full px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {/* Live match indicator */}
                            {confirmPassword && (
                                <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            ) : (
                                <KeyRound size={16} />
                            )}
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="text-center">
                            <Link
                                to="/"
                                className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-300 transition-colors text-sm"
                            >
                                <ArrowLeft size={14} /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
