import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { Search, IndianRupee, Users, Wallet, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';

const Thrift = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('thriftBalance');
    const [sortDir, setSortDir] = useState('desc');
    const [stats, setStats] = useState({ total: 0, members: 0, avg: 0, totalMonthly: 0 });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get('/admin/employees');
            setEmployees(data);
            const total = data.reduce((sum, e) => sum + (e.thriftBalance || 0), 0);
            const totalMonthly = data.reduce((sum, e) => sum + (e.thriftContribution || 0), 0);
            setStats({
                total,
                members: data.length,
                avg: data.length ? Math.round(total / data.length) : 0,
                totalMonthly
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const filtered = employees
        .filter(e =>
            (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
            String(e.empId || '').toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            let aVal = a[sortField] ?? 0;
            let bVal = b[sortField] ?? 0;
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
    };

    const thClass = (field) =>
        `px-6 py-4 cursor-pointer select-none hover:text-indigo-500 transition-colors ${sortField === field ? 'text-indigo-500' : ''}`;

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <Wallet size={32} className="text-indigo-600 dark:text-indigo-400" />
                    Thrift Management
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    View and manage employee thrift contributions and balances
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Thrift Pool</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                                ₹{stats.total.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-lg">
                            <IndianRupee className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Members</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                                {stats.members}
                            </p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-lg">
                            <Users className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Average Balance</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                                ₹{stats.avg.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg">
                            <TrendingUp className="text-amber-600 dark:text-amber-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Contribution</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                                ₹{stats.totalMonthly.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
                            <Wallet className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or employee ID..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-sm transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className={thClass('empId')} onClick={() => handleSort('empId')}>
                                Emp. ID <SortIcon field="empId" />
                            </th>
                            <th className={thClass('name')} onClick={() => handleSort('name')}>
                                Name <SortIcon field="name" />
                            </th>
                            <th className="px-6 py-4">Department</th>
                            <th className={thClass('thriftContribution')} onClick={() => handleSort('thriftContribution')}>
                                Monthly Contribution <SortIcon field="thriftContribution" />
                            </th>
                            <th className={thClass('thriftBalance')} onClick={() => handleSort('thriftBalance')}>
                                Thrift Balance <SortIcon field="thriftBalance" />
                            </th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8 text-slate-500">Loading...</td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8 text-slate-500">No records found.</td>
                            </tr>
                        ) : (
                            filtered.map((emp) => (
                                <tr
                                    key={emp._id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-sm">
                                        {emp.empId || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">
                                            {emp.name}
                                        </div>
                                        {emp.email && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {emp.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                        {emp.department || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                        ₹{(emp.thriftContribution || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-indigo-700 dark:text-indigo-300 text-base">
                                            ₹{(emp.thriftBalance || 0).toLocaleString('en-IN')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/admin/employees/${emp._id}`}
                                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Table footer with count */}
                {!loading && (
                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                        Showing {filtered.length} of {employees.length} members
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Thrift;
