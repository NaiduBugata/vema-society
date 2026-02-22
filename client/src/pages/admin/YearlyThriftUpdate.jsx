import { useState } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { RefreshCw, CheckCircle, AlertTriangle, TrendingUp, Calendar, Users, IndianRupee, Building, Banknote, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';

const YearlyThriftUpdate = () => {
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
    const [shareCapital, setShareCapital] = useState('');
    const [bankBalance, setBankBalance] = useState('');
    const [cashInHand, setCashInHand] = useState('');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const canSubmit = shareCapital !== '' && bankBalance !== '' && cashInHand !== '';

    const handleUpdateYearlyThrift = async () => {
        setConfirmOpen(false);
        setProcessing(true);
        setResult(null);

        try {
            const { data } = await api.post('/admin/yearly-thrift-update', {
                year: selectedYear,
                shareCapital: Number(shareCapital),
                bankBalance: Number(bankBalance),
                cashInHand: Number(cashInHand)
            });
            setResult(data);

            if (data.totalErrors > 0) {
                toast(`Completed with ${data.totalErrors} error(s)`, {
                    icon: '⚠️',
                    style: { background: '#fef3c7', color: '#92400e' }
                });
            } else {
                toast.success(`Yearly thrift updated for ${data.totalProcessed} employees!`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update yearly thrift');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <RefreshCw size={32} className="text-indigo-600 dark:text-indigo-400" />
                    Yearly Thrift Update
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Recalculate and update thrift balances for all employees based on transaction records
                </p>
            </div>

            {/* Info Card */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8 shadow-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How Yearly Thrift Dividend is Calculated</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                        <li><strong>Society Assets</strong> = Loans Outstanding + Bank Balance + Cash in Hand</li>
                        <li><strong>Society Capital</strong> = Total Thrift of all members + Share Capital</li>
                        <li><strong>Surplus</strong> = Society Assets - Society Capital</li>
                        <li><strong>Rate per ₹1</strong> = Surplus / Total Thrift</li>
                        <li><strong>Each employee&apos;s dividend</strong> = Rate × Employee&apos;s Thrift Balance</li>
                        <li><strong>New Thrift</strong> = Old Thrift + Dividend</li>
                    </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            <Calendar size={14} className="inline mr-1" />
                            Select Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            <Building size={14} className="inline mr-1" />
                            Share Capital (₹)
                        </label>
                        <input
                            type="number"
                            value={shareCapital}
                            onChange={(e) => setShareCapital(e.target.value)}
                            placeholder="Enter Share Capital amount"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            <Banknote size={14} className="inline mr-1" />
                            Bank Balance (₹)
                        </label>
                        <input
                            type="number"
                            value={bankBalance}
                            onChange={(e) => setBankBalance(e.target.value)}
                            placeholder="Enter Bank Balance amount"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            <Wallet size={14} className="inline mr-1" />
                            Cash in Hand (₹)
                        </label>
                        <input
                            type="number"
                            value={cashInHand}
                            onChange={(e) => setCashInHand(e.target.value)}
                            placeholder="Enter Cash in Hand amount"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={processing || !canSubmit}
                    className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 text-base"
                >
                    <RefreshCw size={20} className={processing ? 'animate-spin' : ''} />
                    {processing ? 'Processing...' : 'Calculate & Update Yearly Thrift'}
                </button>
                {!canSubmit && (
                    <p className="text-sm text-amber-500 mt-2">Please fill all three fields: Share Capital, Bank Balance, and Cash in Hand</p>
                )}
            </div>

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-fade-in">
                    {/* Formula Breakdown Card */}
                    {result.formula && (
                        <div className="card bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4">Formula Breakdown</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Total Thrift</p>
                                    <p className="font-bold text-slate-800 dark:text-white">₹{result.formula.totalThrift?.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Share Capital</p>
                                    <p className="font-bold text-slate-800 dark:text-white">₹{result.formula.shareCapital?.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Loans Outstanding</p>
                                    <p className="font-bold text-slate-800 dark:text-white">₹{result.formula.totalLoansOutstanding?.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Bank Balance</p>
                                    <p className="font-bold text-slate-800 dark:text-white">₹{result.formula.bankBalance?.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Cash in Hand</p>
                                    <p className="font-bold text-slate-800 dark:text-white">₹{result.formula.cashInHand?.toLocaleString()}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                    <p className="text-green-600 dark:text-green-400 text-xs">Society Assets</p>
                                    <p className="font-bold text-green-700 dark:text-green-300">₹{result.formula.societyAssets?.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                    <p className="text-blue-600 dark:text-blue-400 text-xs">Society Capital</p>
                                    <p className="font-bold text-blue-700 dark:text-blue-300">₹{result.formula.societyCapital?.toLocaleString()}</p>
                                </div>
                                <div className={`rounded-lg p-3 ${result.formula.difference >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Surplus / Deficit</p>
                                    <p className={`font-bold ${result.formula.difference >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                        ₹{result.formula.difference?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
                                <span className="text-sm text-indigo-600 dark:text-indigo-400">Rate per ₹1 of Thrift = </span>
                                <span className="text-lg font-bold text-indigo-800 dark:text-indigo-200">₹{result.formula.ratePerRupee?.toFixed(6)}</span>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Users size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Processed</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{result.totalProcessed}</p>
                            </div>
                        </div>

                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Updated</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.totalChanged}</p>
                            </div>
                        </div>

                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-full ${result.totalErrors > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <AlertTriangle size={24} className={result.totalErrors > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Errors</p>
                                <p className={`text-2xl font-bold ${result.totalErrors > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{result.totalErrors}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Results Table */}
                    <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Detailed Results</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Employee</th>
                                        <th className="px-4 py-3">Emp. ID</th>
                                        <th className="px-4 py-3">Old Balance</th>
                                        <th className="px-4 py-3">Dividend</th>
                                        <th className="px-4 py-3">New Balance</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {result.results.map((r, idx) => (
                                        <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${r.changed ? '' : 'opacity-60'}`}>
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{r.name}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.empId || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">₹{r.oldBalance.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                                                {r.dividend >= 0 ? '+' : ''}₹{r.dividend.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">₹{r.newBalance.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                {r.changed ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                                        <CheckCircle size={12} /> Updated
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-xs font-medium">
                                                        No change
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Errors */}
                    {result.errors && result.errors.length > 0 && (
                        <div className="card bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">Errors</h3>
                            <div className="space-y-2">
                                {result.errors.map((err, idx) => (
                                    <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
                                        <strong>{err.name}</strong> ({err.email}): {err.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Modal */}
            {confirmOpen && (
                <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Confirm Yearly Thrift Update</h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-2">
                            This will calculate and apply thrift dividends for <strong>all employees</strong> for year <strong>{selectedYear}</strong>.
                        </p>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 space-y-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                            <p><strong>Share Capital:</strong> ₹{Number(shareCapital).toLocaleString()}</p>
                            <p><strong>Bank Balance:</strong> ₹{Number(bankBalance).toLocaleString()}</p>
                            <p><strong>Cash in Hand:</strong> ₹{Number(cashInHand).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
                            This action cannot be undone. An audit entry will be created for every change.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateYearlyThrift}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Yes, Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default YearlyThriftUpdate;
