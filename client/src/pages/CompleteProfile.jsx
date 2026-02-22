import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail, Phone, CheckCircle, ArrowRight, Lock } from 'lucide-react';

const CompleteProfile = () => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Guard: only employees on first-time profile completion should be here
    if (!user) {
        navigate('/');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (phone.trim().length < 6) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            await api.put('/employee/update-profile', { email, phone });
            toast.success('Profile completed! Welcome to Vignan Thrift Society.');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="card w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-lg">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
                            <CheckCircle size={14} />
                        </span>
                        <span className="text-sm text-green-400 font-medium line-through opacity-60">Set Password</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-600" />
                    <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                        <span className="text-sm text-indigo-400 font-medium">Complete Profile</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-indigo-400 mb-2">Complete Your Profile</h2>
                <p className="text-slate-400 text-center mb-6 text-sm">
                    Step 2 of 2 — add your contact details so we can reach you and enable password recovery.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">
                            Email Address <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="email"
                                className="input w-full bg-slate-800 border-slate-700 text-white p-3 pl-9 rounded"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Used for password recovery and notifications</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">
                            Phone Number <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="tel"
                                className="input w-full bg-slate-800 border-slate-700 text-white p-3 pl-9 rounded"
                                placeholder="9XXXXXXXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Your registered mobile number</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Complete & Go to Dashboard
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-300 text-center">
                        🔒 Your information is only used within Vignan Thrift Society and is never shared externally.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
