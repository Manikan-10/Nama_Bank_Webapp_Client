import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';
import PasswordInput from '../components/PasswordInput';
import { validatePassword, validatePasswordMatch } from '../utils/validation';
import './LoginPage.css';

const ResetPasswordPage = () => {
    const { updatePassword } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Session state
    const [sessionUser, setSessionUser] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [errorDescription, setErrorDescription] = useState('');

    // Safety flag to prevent double success
    const successTriggered = useRef(false);

    const handleSuccess = () => {
        if (successTriggered.current) return;
        successTriggered.current = true;
        setLoading(false);
        success('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
            navigate('/login');
        }, 1500);
    };

    // 1. Initial Session Verification (Mount Only)
    useEffect(() => {
        console.log('RESET_PAGE: Initialization started...');

        // A. Check for explicit error in hash immediately
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDesc = params.get('error_description') || 'Invalid or expired link';
            console.log('RESET_PAGE: Hash error detected:', errorDesc);
            setErrorDescription(errorDesc.replace(/\+/g, ' '));
            setCheckingSession(false);
            return;
        }

        // B. Setup a listener that can clear the "checking" state if session arrives
        // This is often faster for recovery links than manual getSession()
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('RESET_PAGE: Auth event:', event, session?.user ? 'User present' : 'No user');
            if (session?.user) {
                setSessionUser(session.user);
                setCheckingSession(false);
            }
        });

        // C. Fallback manual check with a generous timeout (15s)
        const checkSession = async () => {
            try {
                console.log('RESET_PAGE: Manual getSession check starting...');
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('timeout')), 15000)
                );

                const result = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]);

                const { data, error: sessionError } = result;
                if (sessionError) throw sessionError;

                if (data?.session?.user) {
                    console.log('RESET_PAGE: Manual check found session user');
                    setSessionUser(data.session.user);
                } else {
                    console.log('RESET_PAGE: Manual check found no session');
                }
            } catch (err) {
                console.error('RESET_PAGE: Session verification error:', err);
                if (err.message === 'timeout' && !sessionUser) {
                    setErrorDescription('Session validation timed out. Your connection may be slow or the link has expired. Please refresh or request a new link.');
                }
            } finally {
                // Only stop checking if we haven't already moved to the error state
                setCheckingSession(false);
            }
        };

        checkSession();

        return () => subscription.unsubscribe();
    }, []); // Run exactly once on mount

    // 2. Success Event Listener (When loading is true)
    useEffect(() => {
        if (!loading) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'USER_UPDATED') {
                console.log('RESET_PAGE: Auth event USER_UPDATED detected - Success!');
                handleSuccess();
            }
        });

        return () => subscription.unsubscribe();
    }, [loading]);

    const handleChange = (e) => {
        if (e.target.name === 'password') setPassword(e.target.value);
        if (e.target.name === 'confirmPassword') setConfirmPassword(e.target.value);

        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) newErrors.password = passwordValidation.error;

        const matchValidation = validatePasswordMatch(password, confirmPassword);
        if (!matchValidation.valid) newErrors.confirmPassword = matchValidation.error;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('RESET_PAGE: handleSubmit triggered');

        if (!sessionUser) {
            console.error('RESET_PAGE: No sessionUser during submit');
            error('Session expired or invalid. Please request a new link.');
            navigate('/forgot-password');
            return;
        }

        if (!validate()) {
            console.log('RESET_PAGE: Validation failed');
            return;
        }

        setLoading(true);
        console.log('RESET_PAGE: Starting updatePassword process...');

        try {
            const result = await updatePassword(password);
            console.log('RESET_PAGE: updatePassword result:', result);

            if (result.success) {
                console.log('RESET_PAGE: Password update success returned');
                handleSuccess();
            } else {
                console.error('RESET_PAGE: Password update error returned:', result.error);
                setLoading(false);
                error(result.error || 'Failed to update password.');
            }
        } catch (err) {
            console.error('RESET_PAGE: Submission exception:', err);
            setLoading(false);
            error('An unforeseen error occurred. Please try again.');
        } finally {
            console.log('RESET_PAGE: Submission flow completed');
            // Safety: if after 10s we are still loading, something is very wrong, clear it
            setTimeout(() => {
                setLoading(current => {
                    if (current) {
                        console.log('RESET_PAGE: Safety timeout clearing loading state');
                        return false;
                    }
                    return current;
                });
            }, 10000);
        }
    };

    if (checkingSession) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="login-card text-center py-5">
                        <span className="loader loader-sm mb-3"></span>
                        <p>Verifying recovery session...</p>
                        <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                            Waiting for token validation...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!sessionUser) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <div className="om-symbol">ॐ</div>
                            <h1>Link Expired</h1>
                            <p className="text-danger">
                                {errorDescription || 'This password reset link is invalid or has already been used.'}
                            </p>
                            <button onClick={() => navigate('/forgot-password')} className="btn btn-primary mt-4 w-full">
                                Request New Link
                            </button>
                        </div>
                    </div>
                </div>

                {/* Debug Info for troubleshooting */}
                <div style={{ marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', fontSize: '11px', color: '#666', maxWidth: '400px', margin: '20px auto', border: '1px solid #ddd' }}>
                    <strong>Debug Status:</strong>
                    <div>Session: {sessionUser ? 'Active' : 'No'}</div>
                    <div>Error: {errorDescription || 'None'}</div>
                    <div>Wait: {checkingSession ? 'Yes' : 'No'}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page page-enter">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="om-symbol">ॐ</div>
                        <h1>Set New Password</h1>
                        <p style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                            Resetting for: {sessionUser.email}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <PasswordInput
                                name="password"
                                value={password}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                error={errors.password}
                            />
                            {errors.password && <span className="form-error">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <PasswordInput
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                error={errors.confirmPassword}
                            />
                            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loader loader-sm mr-2"></span>
                                    Saving...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
