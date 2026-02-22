import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { UserPlus, Search, CreditCard, IndianRupee, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Employees = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get('/admin/employees');
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees', error);
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Employees</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Manage all registered members</p>
                </div>
                <button
                    onClick={() => navigate('/admin/upload')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
                >
                    <UserPlus size={20} />
                    <span>Add Employee</span>
                </button>
            </div>

            <div className="mb-8 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search employees by name or email..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-sm transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No employees found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.map((emp) => {
                        const hasLoan = Boolean(emp.activeLoan) || String(emp.loanStatus || '').toLowerCase() === 'loan';

                        return (
                            <Link
                                to={`/admin/employees/${emp._id}`}
                                key={emp._id}
                                className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group hover:-translate-y-1 block shadow-sm"
                            >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {emp.name.charAt(0)}
                                </div>
                                <div className={`px-2 py-1 text-xs font-semibold rounded-full ${hasLoan ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300' : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
                                    }`}>
                                    {hasLoan ? 'Loan' : 'No Loan'}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{emp.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{emp.designation} &bull; {emp.department}</p>

                            {/* Thrift Section */}
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1.5">
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                                    <Wallet size={13} /> Thrift
                                </p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">CB Balance</span>
                                    <span className="font-bold text-blue-700 dark:text-blue-300">₹{(emp.thriftBalance || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Monthly</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">₹{(emp.thriftContribution || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Loan Section */}
                            {(emp.activeLoan || String(emp.loanStatus || '').toLowerCase() === 'loan') && (
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1.5 mt-3">
                                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                                        <CreditCard size={13} /> Loan
                                    </p>
                                    {emp.activeLoan ? (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400">Balance</span>
                                                <span className="font-bold text-orange-600 dark:text-orange-300">₹{(emp.activeLoan.remainingBalance || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400">EMI</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">₹{(emp.activeLoan.emi || 0).toLocaleString()}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-slate-500 dark:text-slate-400">Loan on record</div>
                                    )}
                                </div>
                            )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
};

export default Employees;
