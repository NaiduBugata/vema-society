import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { User, IndianRupee, CreditCard, Activity, Save, X, Edit, Trash, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    // State for editable fields
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const { data } = await api.get(`/admin/employees/${id}`);
                setEmployee(data);
                setFormData(data);
            } catch (error) {
                toast.error('Failed to fetch employee details');
                navigate('/admin/employees');
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id, navigate]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await api.put(`/admin/employees/${id}`, formData);
            setEmployee(formData);
            setEditMode(false);
            toast.success('Employee updated successfully');
        } catch (error) {
            toast.error('Failed to update employee');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await api.delete(`/admin/employees/${id}`);
                toast.success('Employee deleted');
                navigate('/admin/employees');
            } catch (error) {
                toast.error('Failed to delete employee');
            }
        }
    };

    if (loading) return <Layout><div className="text-white text-center mt-20">Loading...</div></Layout>;
    if (!employee) return <Layout><div className="text-white text-center mt-20">Employee not found</div></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                    <User size={32} className="text-indigo-400" />
                    {employee.name}
                </h1>
                <div className="flex gap-3">
                    {editMode ? (
                        <>
                            <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <Save size={18} /> Save
                            </button>
                            <button onClick={() => { setEditMode(false); setFormData(employee); }} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <X size={18} /> Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditMode(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <Edit size={18} /> Edit Profile
                            </button>
                            <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <Trash size={18} /> Delete Employee
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Personal Details */}
                <div className="card lg:col-span-2">
                    <h3 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-2">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-slate-500 block mb-1">Full Name</label>
                            {editMode ? (
                                <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="input py-2" />
                            ) : (
                                <p className="text-lg font-medium text-slate-200">{employee.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 block mb-1">Email</label>
                            {editMode ? (
                                <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="input py-2" />
                            ) : (
                                <p className="text-lg font-medium text-slate-200">{employee.email}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 block mb-1">Department</label>
                            {editMode ? (
                                <input type="text" name="department" value={formData.department || ''} onChange={handleInputChange} className="input py-2" />
                            ) : (
                                <p className="text-lg font-medium text-slate-200">{employee.department}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 block mb-1">Designation</label>
                            {editMode ? (
                                <input type="text" name="designation" value={formData.designation || ''} onChange={handleInputChange} className="input py-2" />
                            ) : (
                                <p className="text-lg font-medium text-slate-200">{employee.designation}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 block mb-1">Phone</label>
                            {editMode ? (
                                <input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="input py-2" />
                            ) : (
                                <p className="text-lg font-medium text-slate-200">{employee.phone || '-'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Overview */}
                <div className="card space-y-6">
                    <h3 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-2">Financial Overview</h3>

                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-900/30 rounded-full text-green-400"><IndianRupee size={20} /></div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Salary</p>
                                {editMode ? (
                                    <input type="number" name="salary" value={formData.salary || 0} onChange={handleInputChange} className="bg-slate-900 border border-slate-700 rounded px-2 w-24 text-white" />
                                ) : (
                                    <p className="text-lg font-bold text-white">₹{employee.salary.toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-900/30 rounded-full text-blue-400"><Activity size={20} /></div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Thrift Balance</p>
                                <p className="text-lg font-bold text-white">₹{employee.thriftBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        {/* Thrift adjustment could be a modal */}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-900/30 rounded-full text-purple-400"><CreditCard size={20} /></div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Loan Status</p>
                                <p className={`text-lg font-bold ${(employee.activeLoan || String(employee.loanStatus || '').toLowerCase() === 'loan') ? 'text-purple-300' : 'text-slate-400'}`}>
                                    {employee.activeLoan ? 'Active' : (String(employee.loanStatus || '').toLowerCase() === 'loan' ? 'Loan' : 'No Loan')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loan Details */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                        <h3 className="text-xl font-bold text-slate-100">Loan Details</h3>
                        {!employee.activeLoan && (
                            <button className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded flex items-center gap-1">
                                <Plus size={14} /> New Loan
                            </button>
                        )}
                    </div>

                    {employee.activeLoan ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Loan Amount</p>
                                    <p className="font-semibold text-lg text-white">₹{employee.activeLoan.loanAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Pending Balance</p>
                                    <p className="font-semibold text-lg text-white">₹{employee.activeLoan.remainingBalance.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">EMI</p>
                                    <p className="font-semibold text-lg text-indigo-300">₹{employee.activeLoan.emi.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Start Date</p>
                                    <p className="text-slate-200">{new Date(employee.activeLoan.startDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-sm text-slate-500 mb-2">Sureties</p>
                                <div className="flex flex-wrap gap-2">
                                    {employee.activeLoan.sureties?.length > 0 ? (
                                        employee.activeLoan.sureties.map((surety, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300 border border-slate-700">
                                                ID: {surety} {/* In real app populate this */}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-500 italic">No sureties listed</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <p>No active loan found for this employee.</p>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-2">Adjustment History</h3>
                    <div className="text-center py-8 text-slate-500">
                        <p>No adjustments recorded yet.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EmployeeDetails;
