import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { Shield, User, ArrowLeft, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeSureties = () => {
    const [suretyData, setSuretyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSuretyView();
    }, []);

    const fetchSuretyView = async () => {
        try {
            const { data } = await api.get('/employee/sureties');
            setSuretyData(data);
        } catch (error) {
            toast.error('Failed to fetch surety information');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-slate-400">Loading surety information...</div>
                </div>
            </Layout>
        );
    }

    if (!suretyData) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-400">Unable to load surety information. Please try again later.</div>
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Surety View</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Guarantor relationships and responsibilities</p>
            </div>

            <div className="space-y-6">
                {/* Who Guaranteed My Loan */}
                <div className="bg-slate-800 dark:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg">
                            <Shield className="text-green-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-100 dark:text-slate-900">My Guarantors</h3>
                            <p className="text-slate-400 dark:text-slate-600 text-sm">People who guaranteed my loan</p>
                        </div>
                    </div>

                    {suretyData.mySureties && suretyData.mySureties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suretyData.mySureties.map((surety, index) => (
                                <div 
                                    key={index} 
                                    className="flex items-center gap-4 p-4 bg-slate-700 dark:bg-slate-50 rounded-lg hover:bg-slate-650 dark:hover:bg-slate-100 transition-colors"
                                >
                                    <div className="p-3 bg-green-600 bg-opacity-20 rounded-full">
                                        <User className="text-green-500" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        {surety.isPartial ? (
                                            <>
                                                <p className="font-semibold text-slate-100 dark:text-slate-900">Employee ID: {surety.empId}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Profile details not available</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-slate-100 dark:text-slate-900">{surety.name}</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-600">Employee ID: {surety.empId || '—'}</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-600">{surety.department || '—'}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <User size={48} className="mx-auto text-slate-600 mb-3" />
                            <p className="text-slate-400 dark:text-slate-600">
                                {suretyData.hasActiveLoan ? 'No guarantors assigned to your loan' : 'You have no active loan'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Loans I Guaranteed */}
                <div className="bg-slate-800 dark:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                            <Shield className="text-yellow-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-100 dark:text-slate-900">My Responsibilities</h3>
                            <p className="text-slate-400 dark:text-slate-600 text-sm">Loans I have guaranteed for others</p>
                        </div>
                    </div>

                    {suretyData.loansIGuaranteed && suretyData.loansIGuaranteed.length > 0 ? (
                        <div className="space-y-4">
                            {suretyData.loansIGuaranteed.map((loan, index) => (
                                <div 
                                    key={index} 
                                    className="flex items-center justify-between p-5 bg-slate-700 dark:bg-slate-50 rounded-lg hover:bg-slate-650 dark:hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-yellow-600 bg-opacity-20 rounded-full">
                                            <User className="text-yellow-500" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-100 dark:text-slate-900 mb-1">
                                                {loan.borrowerName}
                                            </p>
                                            <p className="text-sm text-slate-400 dark:text-slate-600">
                                                ID: {loan.borrowerId} • {loan.borrowerDepartment}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-600">Loan Amount</p>
                                                    <p className="text-sm font-semibold text-slate-300 dark:text-slate-700">
                                                        ₹{loan.loanAmount.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-600">Balance</p>
                                                    <p className="text-sm font-semibold text-slate-300 dark:text-slate-700">
                                                        ₹{loan.balance.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            loan.status === 'active' 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-slate-600 text-white'
                                        }`}>
                                            {loan.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Summary */}
                            <div className="mt-6 p-4 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Shield className="text-yellow-500 mt-1" size={20} />
                                    <div>
                                        <p className="font-semibold text-slate-100 dark:text-slate-900 mb-1">
                                            Responsibility Summary
                                        </p>
                                        <p className="text-sm text-slate-400 dark:text-slate-600">
                                            You are guarantor for {suretyData.loansIGuaranteed.length} loan(s). 
                                            Total guaranteed amount: ₹
                                            {suretyData.loansIGuaranteed
                                                .reduce((sum, loan) => sum + loan.balance, 0)
                                                .toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CreditCard size={48} className="mx-auto text-slate-600 mb-3" />
                            <p className="text-slate-400 dark:text-slate-600">You are not a guarantor for any loans</p>
                        </div>
                    )}
                </div>

                {/* Privacy Notice */}
                <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Shield className="text-blue-500 mt-1" size={20} />
                        <div>
                            <p className="font-semibold text-slate-100 dark:text-slate-900 mb-1">Privacy Notice</p>
                            <p className="text-sm text-slate-400 dark:text-slate-600">
                                Limited profile information is shown to protect member privacy. 
                                Only name, employee ID, department, and loan status are visible.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EmployeeSureties;
