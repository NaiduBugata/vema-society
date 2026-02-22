import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { KeyRound, ArrowLeft, Send, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [viaAdmin, setViaAdmin] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) {
            toast.error('Please enter your Employee ID');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email: input.trim() });
            setSent(true);
            setViaAdmin(!!data.viaAdmin);
            toast.success(data.viaAdmin ? 'Request sent to administrator' : 'Reset link sent to your registered email');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
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
                    <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
                    <p className="text-slate-400 text-sm mt-2">
                        Enter your Employee ID and we'll send the reset link to your registered email
                    </p>
                </div>

                {sent ? (
                    <div className="text-center space-y-4">
                        {viaAdmin ? (
                            <div className="p-4 bg-amber-900/30 border border-amber-700 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <AlertCircle size={20} className="text-amber-400" />
                                    <p className="text-amber-300 font-medium">No email on file</p>
                                </div>
                                <p className="text-amber-400 text-sm">
                                    Your account has no registered email yet. A reset link has been sent to the <strong>administrator</strong>. Please contact the admin to receive your reset link.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                                <p className="text-green-300 font-medium">Reset link sent!</p>
                                <p className="text-green-400 text-sm mt-1">
                                    A password reset link has been sent to your registered email address. Check your spam folder too.
                                </p>
                            </div>
                        )}
                        <p className="text-slate-400 text-sm">
                            The link expires in <strong className="text-white">1 hour</strong>.
                        </p>
                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm mt-4"
                        >
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Employee ID
                            </label>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="e.g.  103"
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                required
                                autoComplete="username"
                            />
                            <p className="text-slate-500 text-xs mt-1.5">
                                The reset link will be sent automatically to the email you registered during your first login.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            ) : (
                                <Send size={16} />
                            )}
                            {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;

