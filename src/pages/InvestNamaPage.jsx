import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitMultipleNamaEntries, getUserStats } from '../services/namaService';
import './InvestNamaPage.css';

const InvestNamaPage = () => {
    const { user, linkedAccounts } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [todayStats, setTodayStats] = useState({ today: 0 });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        // Initialize counts for each account
        const initialCounts = {};
        linkedAccounts.forEach(acc => {
            initialCounts[acc.id] = 0;
        });
        setCounts(initialCounts);
        loadTodayStats();
    }, [user, linkedAccounts, navigate]);

    const loadTodayStats = async () => {
        try {
            const stats = await getUserStats(user.id);
            setTodayStats(stats);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleCountChange = (accountId, value) => {
        const numValue = Math.max(0, parseInt(value) || 0);
        setCounts(prev => ({ ...prev, [accountId]: numValue }));
    };

    const handleQuickAdd = (accountId, amount) => {
        setCounts(prev => ({
            ...prev,
            [accountId]: (prev[accountId] || 0) + amount
        }));
    };

    const getTotalCount = () => {
        return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const entries = Object.entries(counts)
            .filter(([_, count]) => count > 0)
            .map(([accountId, count]) => ({
                accountId,
                count,
                sourceType: 'manual'
            }));

        if (entries.length === 0) {
            error('Please enter at least one Nama count.');
            return;
        }

        setLoading(true);

        try {
            await submitMultipleNamaEntries(user.id, entries);
            success(`${getTotalCount()} Namas offered successfully! Hari Om`);

            // Reset counts
            const resetCounts = {};
            linkedAccounts.forEach(acc => {
                resetCounts[acc.id] = 0;
            });
            setCounts(resetCounts);
            loadTodayStats();
        } catch (err) {
            error('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="invest-page page-enter">
            <header className="page-header">
                <div className="container">
                    <Link to="/dashboard" className="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Dashboard
                    </Link>
                    <h1>Credit Nama</h1>
                    <p>Manual Entry - Record your daily devotion</p>
                </div>
            </header>

            <main className="invest-main">
                <div className="container container-sm">
                    {/* User Info Section */}
                    <div className="user-info-section">
                        <div className="user-profile">
                            <div className="user-avatar-large">
                                {user.profile_photo ? (
                                    <img src={user.profile_photo} alt={user.name} />
                                ) : (
                                    <span>{user.name?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="user-details">
                                <h2 className="user-name-display">{user.name}</h2>
                                <p className="user-city-display">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    {user.city || 'Location not set'}
                                </p>
                            </div>
                        </div>
                        <div className="linked-accounts-info">
                            <span className="accounts-label">Linked Accounts:</span>
                            <div className="accounts-tags">
                                {linkedAccounts.map(acc => (
                                    <span key={acc.id} className="account-tag">{acc.name}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Today's Summary */}
                    <div className="today-summary">
                        <div className="summary-content">
                            <span className="summary-label">Today's Total</span>
                            <span className="summary-value">{todayStats.today.toLocaleString()}</span>
                        </div>
                        <div className="summary-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </div>
                    </div>

                    {linkedAccounts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <p className="empty-state-title">No Nama Banks Linked</p>
                            <p className="empty-state-text">Contact admin to link your account to a Nama Bank.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="invest-form">
                            <div className="accounts-form">
                                {linkedAccounts.map(account => (
                                    <div key={account.id} className="account-entry">
                                        <div className="account-info">
                                            <span className="account-name">{account.name}</span>
                                        </div>

                                        <div className="count-controls">
                                            <div className="quick-buttons">
                                                <button
                                                    type="button"
                                                    className="quick-btn"
                                                    onClick={() => handleQuickAdd(account.id, 108)}
                                                >
                                                    +108
                                                </button>
                                                <button
                                                    type="button"
                                                    className="quick-btn"
                                                    onClick={() => handleQuickAdd(account.id, 54)}
                                                >
                                                    +54
                                                </button>
                                                <button
                                                    type="button"
                                                    className="quick-btn"
                                                    onClick={() => handleQuickAdd(account.id, 27)}
                                                >
                                                    +27
                                                </button>
                                            </div>

                                            <div className="count-input-wrapper">
                                                <input
                                                    type="number"
                                                    value={counts[account.id] || 0}
                                                    onChange={(e) => handleCountChange(account.id, e.target.value)}
                                                    className="form-input count-input"
                                                    min="0"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total Display */}
                            <div className="total-display">
                                <span className="total-label">Session Total</span>
                                <span className="total-value">{getTotalCount().toLocaleString()}</span>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={loading || getTotalCount() === 0}
                            >
                                {loading ? (
                                    <>
                                        <span className="loader loader-sm"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'Offer Namas'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InvestNamaPage;
