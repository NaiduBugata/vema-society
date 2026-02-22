import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { Plus, Search, FileText, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Loans = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Loan Form State
    const [formData, setFormData] = useState({
        borrowerId: '',
        loanAmount: '',
        interestRate: 12, // Default 12%
        emi: '',
        startDate: new Date().toISOString().slice(0, 10),
        sureties: []
    });

    // For borrower selection
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        fetchLoans();
        fetchEmployees();
    }, []);

    const fetchLoans = async () => {
        try {
            const { data } = await api.get('/loans');
            setLoans(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get('/admin/employees');
            setEmployees(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateLoan = async (e) => {
        e.preventDefault();
        try {
            await api.post('/loans', formData);
            toast.success('Loan created successfully');
            setShowCreateModal(false);
            fetchLoans();
            fetchEmployees(); // refresh so newly loaned employee is removed from eligible list
            // Reset form
            setFormData({
                borrowerId: '',
                loanAmount: '',
                interestRate: 12,
                emi: '',
                startDate: new Date().toISOString().slice(0, 10),
                sureties: []
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create loan');
        }
    };

    const handleCloseLoan = async (loanId) => {
        if (!window.confirm('Mark this loan as closed? This cannot be undone.')) return;
        try {
            await api.put(`/loans/${loanId}/close`);
            toast.success('Loan closed successfully');
            fetchLoans();
            fetchEmployees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close loan');
        }
    };

    const calculateEMI = () => {
        const principal = parseFloat(formData.loanAmount);
        const rate = parseFloat(formData.interestRate); // Annual
        // Simple interest EMI logic often used in societies: (P + (P*R*T)/100) / Months??
        // USER QUERY: "Loan model must include: loanAmount, interestRate, EMI, remainingBalance"
        // It didn't specify the calculation formula.
        // Let's assume standard EMI formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
        // OR Flat rate? Usually societies use Reducing Balance or Flat.
        // I will let the user INPUT the EMI for now to be safe, or auto-calc as guidance.
        // Let's just user input for flexibility as per "Adjustment Panel" requirements suggesting manual control.
    };

    const filteredLoans = loans.filter(l =>
        (l.borrower?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.borrower?.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Loan Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Track active and closed loans</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
                >
                    <Plus size={20} />
                    <span>New Loan</span>
                </button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by borrower name..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-sm transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Borrower</th>
                            <th className="px-6 py-4">Loan Amount</th>
                            <th className="px-6 py-4">Balance</th>
                            <th className="px-6 py-4">EMI</th>
                            <th className="px-6 py-4">Interest Rate</th>
                            <th className="px-6 py-4">Sureties</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="9" className="text-center py-8 text-slate-500">Loading...</td></tr>
                        ) : filteredLoans.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-8 text-slate-500">No loans found.</td></tr>
                        ) : (
                            filteredLoans.map((loan) => (
                                <tr key={loan._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{loan.borrower?.name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">ID: {loan.borrower?.empId || loan.borrower?.email || '—'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">₹{loan.loanAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-orange-600 dark:text-orange-300 font-bold">₹{loan.remainingBalance.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">₹{loan.emi.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{loan.interestRate}%</td>
                                    <td className="px-6 py-4">
                                        {loan.sureties && loan.sureties.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {loan.sureties.map((s) => (
                                                    <span key={s._id} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs">
                                                        {s.empId ? `${s.empId}` : s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${loan.status === 'active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            }`}>
                                            {loan.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                        {new Date(loan.startDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {loan.status === 'active' && (
                                            <button
                                                onClick={() => handleCloseLoan(loan._id)}
                                                className="px-3 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                                            >
                                                Close
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Loan Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="card w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Create New Loan</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateLoan} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Select Borrower</label>
                                <select
                                    className="input"
                                    value={formData.borrowerId}
                                    onChange={(e) => setFormData({ ...formData, borrowerId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees
                                        .filter(e => !e.activeLoan && e.loanStatus !== 'Loan') // Only show eligible
                                        .map(e => (
                                            <option key={e._id} value={e._id}>{e.name} ({e.empId || e.email || '—'})</option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Select Sureties (Hold Ctrl)</label>
                                <select
                                    className="input h-24"
                                    multiple
                                    value={formData.sureties}
                                    onChange={(e) => {
                                        const options = [...e.target.selectedOptions];
                                        const values = options.map(option => option.value);
                                        setFormData({ ...formData, sureties: values });
                                    }}
                                >
                                    {employees
                                        .filter(e => e._id !== formData.borrowerId) // Remove borrower
                                        .map(e => (
                                            <option key={e._id} value={e._id}>{e.name} ({e.email})</option>
                                        ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Loan Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.loanAmount}
                                        onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.interestRate}
                                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Monthly EMI (₹)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.emi}
                                        onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-full mt-4">
                                Create Loan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Loans;
