import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../components/PasswordInput';
import { validatePhone, validatePassword } from '../utils/validation';
import './LoginPage.css';

const LoginPage = () => {
    const { login } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        whatsapp: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        const phoneValidation = validatePhone(formData.whatsapp);
        if (!phoneValidation.valid) newErrors.whatsapp = phoneValidation.error;

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) newErrors.password = passwordValidation.error;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        const result = await login(formData.whatsapp.trim(), formData.password);

        setLoading(false);

        if (result.success) {
            success('Welcome back! Hari Om');
            navigate('/dashboard');
        } else {
            error(result.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="login-page page-enter">
            <div className="login-container">
                <Link to="/" className="back-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Home
                </Link>

                <div className="login-card">
                    <div className="login-header">
                        <div className="om-symbol">ॐ</div>
                        <h1>Welcome Back</h1>
                        <p>Continue your devotion</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                        {/* WhatsApp */}
                        <div className="form-group">
                            <label className="form-label">WhatsApp Number</label>
                            <input
                                type="tel"
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                className={`form-input ${errors.whatsapp ? 'error' : ''}`}
                                placeholder="+91 9876543210"
                                autoComplete="off"
                            />
                            {errors.whatsapp && <span className="form-error">{errors.whatsapp}</span>}
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <PasswordInput
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                error={errors.password}
                            />
                            {errors.password && <span className="form-error">{errors.password}</span>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loader loader-sm"></span>
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            New devotee?{' '}
                            <Link to="/register">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
