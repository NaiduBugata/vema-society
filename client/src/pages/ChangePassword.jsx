import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';

const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Very Weak',  color: 'bg-red-500',    text: 'text-red-400',    width: 'w-1/5' };
    if (score === 2) return { label: 'Weak',       color: 'bg-orange-500', text: 'text-orange-400', width: 'w-2/5' };
    if (score === 3) return { label: 'Moderate',   color: 'bg-yellow-500', text: 'text-yellow-400', width: 'w-3/5' };
    if (score === 4) return { label: 'Strong',     color: 'bg-lime-500',   text: 'text-lime-400',   width: 'w-4/5' };
    return                  { label: 'Very Strong',color: 'bg-green-500',  text: 'text-green-400',  width: 'w-full' };
};

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { user } = useContext(AuthContext);
    const strength = getPasswordStrength(password);
    const navigate = useNavigate();

    // Guard: if user is not authenticated, redirect to login
    if (!user) {
        navigate('/');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await api.post('/auth/change-password', { newPassword: password });
            toast.success('Password updated! Please complete your profile.');
            // Stay logged in — go to profile completion step
            navigate('/complete-profile');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="card w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-lg">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                        <span className="text-sm text-indigo-400 font-medium">Set Password</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-600" />
                    <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-full bg-slate-700 text-slate-500 text-xs font-bold flex items-center justify-center">2</span>
                        <span className="text-sm text-slate-500">Complete Profile</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-center mb-2">
                    <Lock size={20} className="text-indigo-400" />
                    <h2 className="text-2xl font-bold text-center text-indigo-400">Set Your Password</h2>
                </div>
                <p className="text-slate-400 text-center mb-6 text-sm">
                    This is your first login. Step 1 of 2 — set a secure password.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input w-full bg-slate-800 border-slate-700 text-white p-3 rounded pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Minimum 6 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {/* Password strength bar */}
                        {password && strength && (
                            <div className="mt-2 space-y-1">
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-xs font-medium ${strength.text}`}>{strength.label}</p>
                                    <p className="text-xs text-slate-500">
                                        {strength.label === 'Very Strong' ? '✓ Great password' :
                                         strength.label === 'Strong'      ? 'Try adding a symbol' :
                                         strength.label === 'Moderate'    ? 'Add numbers & symbols' :
                                         'Use 10+ chars, uppercase, numbers, symbols'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="input w-full bg-slate-800 border-slate-700 text-white p-3 rounded pr-10"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Re-enter your new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {/* Passwords match indicator */}
                        {confirmPassword && (
                            <p className={`text-xs mt-1 ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
