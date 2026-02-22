import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { Calendar, IndianRupee, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const { data } = await api.get('/employee/transactions');
            setTransactions(data);
        } catch (error) {
            toast.error('Failed to fetch transactions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-slate-400">Loading transactions...</div>
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Transaction History</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Monthly deduction records (Last 12 months)</p>
            </div>

            {/* Transactions Table */}
            {transactions.length > 0 ? (
                <div className="bg-slate-800 dark:bg-white rounded-xl border border-slate-700 dark:border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-700 dark:bg-slate-100 border-b border-slate-600 dark:border-slate-300">
                                    <th className="text-left p-4 text-slate-300 dark:text-slate-700 font-semibold">Month</th>
                                    <th className="text-right p-4 text-slate-300 dark:text-slate-700 font-semibold">Salary</th>
                                    <th className="text-right p-4 text-slate-300 dark:text-slate-700 font-semibold">Thrift</th>
                                    <th className="text-right p-4 text-slate-300 dark:text-slate-700 font-semibold">Loan EMI</th>
                                    <th className="text-right p-4 text-slate-300 dark:text-slate-700 font-semibold">Interest</th>
                                    <th className="text-right p-4 text-slate-300 dark:text-slate-700 font-semibold">Net Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction, index) => (
                                    <tr 
                                        key={index} 
                                        className="border-b border-slate-700 dark:border-slate-200 hover:bg-slate-750 dark:hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-500" />
                                                <span className="text-slate-100 dark:text-slate-900 font-medium">
                                                    {new Date(transaction.month + '-01').toLocaleDateString('en-IN', { 
                                                        year: 'numeric', 
                                                        month: 'long' 
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-slate-300 dark:text-slate-700 font-semibold">
                                            ₹{transaction.salary.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right text-red-400 font-semibold">
                                            -₹{transaction.thrift.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right text-red-400 font-semibold">
                                            -₹{transaction.loanEmi.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right text-red-400 font-semibold">
                                            -₹{transaction.interest.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right text-green-400 font-bold text-lg">
                                            ₹{transaction.netSalary.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-700 dark:bg-slate-100">
                                    <td className="p-4 text-slate-300 dark:text-slate-700 font-bold">Total</td>
                                    <td className="p-4 text-right text-slate-300 dark:text-slate-700 font-bold">
                                        ₹{transactions.reduce((sum, t) => sum + t.salary, 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right text-red-400 font-bold">
                                        -₹{transactions.reduce((sum, t) => sum + t.thrift, 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right text-red-400 font-bold">
                                        -₹{transactions.reduce((sum, t) => sum + t.loanEmi, 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right text-red-400 font-bold">
                                        -₹{transactions.reduce((sum, t) => sum + t.interest, 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right text-green-400 font-bold text-lg">
                                        ₹{transactions.reduce((sum, t) => sum + t.netSalary, 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800 dark:bg-white rounded-xl p-12 text-center border border-slate-700 dark:border-slate-200">
                    <IndianRupee size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400 dark:text-slate-600 text-lg">No transaction history available</p>
                </div>
            )}
        </Layout>
    );
};

export default EmployeeTransactions;
