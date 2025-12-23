import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    getAllNamaAccounts,
    createNamaAccount,
    updateNamaAccount,
    getAllUsers,
    updateUser,
    getAllNamaEntries,
    getAccountStats
} from '../services/namaService';
import { supabase } from '../supabaseClient';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const { isAdmin, logout } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('accounts');
    const [loading, setLoading] = useState(true);

    // Data states
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);
    const [entries, setEntries] = useState([]);
    const [accountStats, setAccountStats] = useState([]);
    const [moderators, setModerators] = useState([]);

    // Modal states
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [accountName, setAccountName] = useState('');

    // Moderator modal states
    const [showModeratorModal, setShowModeratorModal] = useState(false);
    const [moderatorName, setModeratorName] = useState('');
    const [moderatorUsername, setModeratorUsername] = useState('');
    const [moderatorPassword, setModeratorPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/admin/login');
            return;
        }
        loadData();
    }, [isAdmin, navigate]);

    const loadData = async () => {
        try {
            const [accountsData, usersData, entriesData, statsData] = await Promise.all([
                getAllNamaAccounts(),
                getAllUsers(),
                getAllNamaEntries(),
                getAccountStats()
            ]);
            setAccounts(accountsData);
            setUsers(usersData);
            setEntries(entriesData);
            setAccountStats(statsData);

            // Load moderators
            const { data: modsData } = await supabase.from('moderators').select('*').order('created_at', { ascending: false });
            setModerators(modsData || []);
        } catch (err) {
            console.error('Error loading data:', err);
            error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Account CRUD
    const handleSaveAccount = async () => {
        if (!accountName.trim()) {
            error('Account name is required');
            return;
        }

        try {
            if (editingAccount) {
                await updateNamaAccount(editingAccount.id, { name: accountName });
                success('Account updated successfully');
            } else {
                await createNamaAccount(accountName);
                success('Account created successfully');
            }
            setShowAccountModal(false);
            setAccountName('');
            setEditingAccount(null);
            loadData();
        } catch (err) {
            error('Failed to save account');
        }
    };

    const handleToggleAccountStatus = async (account) => {
        try {
            await updateNamaAccount(account.id, { is_active: !account.is_active });
            success(`Account ${account.is_active ? 'disabled' : 'enabled'}`);
            loadData();
        } catch (err) {
            error('Failed to update account status');
        }
    };

    // User management
    const handleToggleUserStatus = async (user) => {
        try {
            await updateUser(user.id, { is_active: !user.is_active });
            success(`User ${user.is_active ? 'disabled' : 'enabled'}`);
            loadData();
        } catch (err) {
            error('Failed to update user status');
        }
    };

    // Moderator management
    const handleCreateModerator = async () => {
        if (!moderatorName.trim() || !moderatorUsername.trim() || !moderatorPassword.trim()) {
            error('All fields are required');
            return;
        }

        try {
            const { error: insertError } = await supabase.from('moderators').insert({
                name: moderatorName,
                username: moderatorUsername,
                password_hash: moderatorPassword,
                is_active: true
            });

            if (insertError) throw insertError;

            success('Moderator created successfully');
            setShowModeratorModal(false);
            setModeratorName('');
            setModeratorUsername('');
            setModeratorPassword('');
            loadData();
        } catch (err) {
            error('Failed to create moderator. Username may already exist.');
        }
    };

    const handleToggleModeratorStatus = async (mod) => {
        try {
            const { error: updateError } = await supabase
                .from('moderators')
                .update({ is_active: !mod.is_active })
                .eq('id', mod.id);

            if (updateError) throw updateError;

            success(`Moderator ${mod.is_active ? 'disabled' : 'enabled'}`);
            loadData();
        } catch (err) {
            error('Failed to update moderator status');
        }
    };

    const handleDeleteModerator = async (id) => {
        if (!confirm('Are you sure you want to delete this moderator?')) return;

        try {
            const { error: deleteError } = await supabase
                .from('moderators')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            success('Moderator deleted');
            loadData();
        } catch (err) {
            error('Failed to delete moderator');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatNumber = (num) => num?.toLocaleString() || '0';

    if (!isAdmin) return null;

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="container">
                    <div className="header-content">
                        <div className="header-left">
                            <span className="admin-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                Admin
                            </span>
                            <h1>Nama Bank Admin</h1>
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <nav className="admin-nav">
                <div className="container">
                    <div className="nav-tabs">
                        <button
                            className={`nav-tab ${activeTab === 'accounts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('accounts')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                            Accounts
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Users
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'entries' ? 'active' : ''}`}
                            onClick={() => setActiveTab('entries')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Entries
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            Reports
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'moderators' ? 'active' : ''}`}
                            onClick={() => setActiveTab('moderators')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M12 8v4m0 4h.01" />
                            </svg>
                            Moderators
                        </button>
                    </div>
                </div>
            </nav>

            <main className="admin-main">
                <div className="container">
                    {loading ? (
                        <div className="page-loader">
                            <span className="loader"></span>
                            <p>Loading admin data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Accounts Tab */}
                            {activeTab === 'accounts' && (
                                <section className="admin-section">
                                    <div className="section-header">
                                        <h2>Nama Bank Accounts</h2>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setEditingAccount(null);
                                                setAccountName('');
                                                setShowAccountModal(true);
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Add Account
                                        </button>
                                    </div>

                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.map(account => (
                                                    <tr key={account.id}>
                                                        <td><strong>{account.name}</strong></td>
                                                        <td>
                                                            <span className={`badge badge-${account.is_active ? 'success' : 'error'}`}>
                                                                {account.is_active ? 'Active' : 'Disabled'}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(account.created_at)}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="btn btn-sm btn-ghost"
                                                                    onClick={() => {
                                                                        setEditingAccount(account);
                                                                        setAccountName(account.name);
                                                                        setShowAccountModal(true);
                                                                    }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className={`btn btn-sm ${account.is_active ? 'btn-secondary' : 'btn-primary'}`}
                                                                    onClick={() => handleToggleAccountStatus(account)}
                                                                >
                                                                    {account.is_active ? 'Disable' : 'Enable'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <section className="admin-section">
                                    <div className="section-header">
                                        <h2>Registered Users ({users.length})</h2>
                                    </div>

                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>WhatsApp</th>
                                                    <th>Location</th>
                                                    <th>Status</th>
                                                    <th>Joined</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.id}>
                                                        <td><strong>{user.name}</strong></td>
                                                        <td>{user.whatsapp}</td>
                                                        <td>
                                                            {[user.city, user.state, user.country]
                                                                .filter(Boolean)
                                                                .join(', ') || '-'}
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-${user.is_active ? 'success' : 'error'}`}>
                                                                {user.is_active ? 'Active' : 'Disabled'}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(user.created_at)}</td>
                                                        <td>
                                                            <button
                                                                className={`btn btn-sm ${user.is_active ? 'btn-secondary' : 'btn-primary'}`}
                                                                onClick={() => handleToggleUserStatus(user)}
                                                            >
                                                                {user.is_active ? 'Disable' : 'Enable'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Entries Tab */}
                            {activeTab === 'entries' && (
                                <section className="admin-section">
                                    <div className="section-header">
                                        <h2>Recent Nama Entries</h2>
                                    </div>

                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>User</th>
                                                    <th>Account</th>
                                                    <th>Count</th>
                                                    <th>Type</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {entries.map(entry => (
                                                    <tr key={entry.id}>
                                                        <td>{entry.users?.name || 'Unknown'}</td>
                                                        <td>{entry.nama_accounts?.name || 'Unknown'}</td>
                                                        <td className="count-cell">{formatNumber(entry.count)}</td>
                                                        <td>
                                                            <span className={`badge badge-${entry.source_type === 'audio' ? 'info' : 'success'}`}>
                                                                {entry.source_type}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(entry.entry_date)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="admin-note">
                                        <p><strong>Note:</strong> Entries are view-only. Admin cannot edit Nama counts or alter historical devotion data.</p>
                                    </div>
                                </section>
                            )}

                            {/* Reports Tab */}
                            {activeTab === 'reports' && (
                                <section className="admin-section">
                                    <div className="section-header">
                                        <h2>Account-wise Reports</h2>
                                    </div>

                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Account</th>
                                                    <th>Today</th>
                                                    <th>This Week</th>
                                                    <th>This Month</th>
                                                    <th>This Year</th>
                                                    <th>Overall</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accountStats.map(stat => (
                                                    <tr key={stat.id}>
                                                        <td><strong>{stat.name}</strong></td>
                                                        <td>{formatNumber(stat.today)}</td>
                                                        <td>{formatNumber(stat.thisWeek)}</td>
                                                        <td>{formatNumber(stat.thisMonth)}</td>
                                                        <td>{formatNumber(stat.thisYear)}</td>
                                                        <td className="count-cell">{formatNumber(stat.overall)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Moderators Tab */}
                            {activeTab === 'moderators' && (
                                <section className="admin-section">
                                    <div className="section-header">
                                        <h2>Moderator Accounts</h2>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setShowModeratorModal(true)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Add Moderator
                                        </button>
                                    </div>

                                    {moderators.length === 0 ? (
                                        <div className="empty-state">
                                            <p>No moderators yet. Create one to get started.</p>
                                        </div>
                                    ) : (
                                        <div className="table-container">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Username</th>
                                                        <th>Status</th>
                                                        <th>Created</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {moderators.map(mod => (
                                                        <tr key={mod.id}>
                                                            <td><strong>{mod.name}</strong></td>
                                                            <td>{mod.username}</td>
                                                            <td>
                                                                <span className={`badge badge-${mod.is_active ? 'success' : 'error'}`}>
                                                                    {mod.is_active ? 'Active' : 'Disabled'}
                                                                </span>
                                                            </td>
                                                            <td>{formatDate(mod.created_at)}</td>
                                                            <td>
                                                                <div className="action-buttons">
                                                                    <button
                                                                        className={`btn btn-sm ${mod.is_active ? 'btn-secondary' : 'btn-primary'}`}
                                                                        onClick={() => handleToggleModeratorStatus(mod)}
                                                                    >
                                                                        {mod.is_active ? 'Disable' : 'Enable'}
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-ghost btn-danger"
                                                                        onClick={() => handleDeleteModerator(mod.id)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <div className="admin-note">
                                        <p><strong>Note:</strong> Moderators can add and rename Nama Bank accounts, but cannot delete accounts or manage users.</p>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Account Modal */}
            {showAccountModal && (
                <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingAccount ? 'Edit Account' : 'Add New Account'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowAccountModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Account Name</label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value)}
                                    className="form-input"
                                    placeholder="e.g., Chennai Nama Bank"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAccountModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveAccount}>
                                {editingAccount ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Moderator Modal */}
            {showModeratorModal && (
                <div className="modal-overlay" onClick={() => setShowModeratorModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create Moderator</h3>
                            <button className="modal-close" onClick={() => setShowModeratorModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    value={moderatorName}
                                    onChange={e => setModeratorName(e.target.value)}
                                    className="form-input"
                                    placeholder="e.g., John Doe"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    value={moderatorUsername}
                                    onChange={e => setModeratorUsername(e.target.value)}
                                    className="form-input"
                                    placeholder="e.g., johndoe"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={moderatorPassword}
                                        onChange={e => setModeratorPassword(e.target.value)}
                                        className="form-input"
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModeratorModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleCreateModerator}>
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
