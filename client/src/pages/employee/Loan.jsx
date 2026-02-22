import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { CreditCard, IndianRupee, Percent, Calendar, User, ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeLoan = () => {
    const [loanData, setLoanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLoanDetails();
    }, []);

const fetchLoanDetails = async () => {
        try {
            const { data } = await api.get('/employee/loan');
            setLoanData(data);
        } catch (error) {
            toast.error('Failed to fetch loan details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-slate-400">Loading loan details...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Loan Details</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Your active loan information</p>
            </div>

            {loanData && loanData.loanId ? (
                <div className="space-y-6">
                    {/* Loan Summary Card */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <CreditCard size={32} />
                            <div>
                                <h2 className="text-2xl font-bold">Active Loan</h2>
                                <p className="text-purple-100 text-sm">Loan ID: {loanData.loanId}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-purple-100 text-sm mb-1">Loan Amount</p>
                                <p className="text-3xl font-bold">₹{loanData.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-purple-100 text-sm mb-1">Remaining Balance</p>
                                <p className="text-3xl font-bold">₹{loanData.balance.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-purple-100 text-sm mb-1">EMI Amount</p>
                                <p className="text-3xl font-bold">₹{loanData.emi.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Loan Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Interest Rate */}
                        <div className="bg-slate-800 dark:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg">
                                    <Percent className="text-green-500" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-100 dark:text-slate-900">Interest Rate</h3>
                            </div>
                            <p className="text-3xl font-bold text-slate-100 dark:text-slate-900">
                                {loanData.interestRate}%
                            </p>
                            <p className="text-slate-400 dark:text-slate-600 text-sm mt-2">Per annum</p>
                        </div>

                        {/* Loan Status */}
                        <div className="bg-slate-800 dark:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                                    <Calendar className="text-blue-500" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-100 dark:text-slate-900">Loan Status</h3>
                            </div>
                            <span className={`inline-block px-4 py-2 rounded-full font-semibold text-lg ${
                                loanData.status === 'active' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-slate-600 text-white'
                            }`}>
                                {loanData.status.toUpperCase()}
                            </span>
                            <p className="text-slate-400 dark:text-slate-600 text-sm mt-2">
                                Started: {new Date(loanData.startDate).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Sureties Section */}
                    {(() => {
                        const populated = (loanData.sureties || []).filter(s => s && s.name);
                        const rawIds = loanData.suretyEmpIds || [];
                        if (populated.length === 0 && rawIds.length === 0) return null;
                        return (
                            <div className="bg-slate-800 dark:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                                        <Shield className="text-yellow-500" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-100 dark:text-slate-900">Loan Guarantors</h3>
                                        <p className="text-slate-400 dark:text-slate-600 text-sm">People who guaranteed your loan</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {populated.length > 0 ? populated.map((surety, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-4 bg-slate-700 dark:bg-slate-50 rounded-lg"
                                        >
                                            <div className="p-3 bg-blue-600 bg-opacity-20 rounded-full">
                                                <User className="text-blue-500" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-100 dark:text-slate-900">{surety.name}</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-600">ID: {surety.empId || '—'}</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-600">{surety.department}</p>
                                            </div>
                                        </div>
                                    )) : rawIds.map((id, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-4 bg-slate-700 dark:bg-slate-50 rounded-lg"
                                        >
                                            <div className="p-3 bg-blue-600 bg-opacity-20 rounded-full">
                                                <User className="text-blue-500" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-100 dark:text-slate-900">Employee ID: {id}</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-600">Guarantor (from Excel)</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                <div className="bg-slate-800 dark:bg-white rounded-xl p-12 text-center border border-slate-700 dark:border-slate-200">
                    <CreditCard size={64} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-100 dark:text-slate-900 mb-2">No Active Loan</h3>
                    <p className="text-slate-400 dark:text-slate-600">You currently don't have any active loans</p>
                </div>
            )}
        </Layout>
    );
};

export default EmployeeLoan;
