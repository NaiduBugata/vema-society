import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(formData.username, formData.password);
            toast.success('Login Successful');

            if (user.isFirstLogin && user.role !== 'admin') {
                // Admin shouldn't be forced on first login unless desired, 
                // usually admins are created manually or via seed with known password.
                // But employees definitely need this.
                navigate('/change-password');
                return;
            }

            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login Failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-dark">
            <div className="card w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-primary">Vignan Thrift Society</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email / Username</label>
                        <input
                            type="text"
                            name="username"
                            className="input"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="input pr-10"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary mt-2">Login</button>
                    <div className="text-center mt-2">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
