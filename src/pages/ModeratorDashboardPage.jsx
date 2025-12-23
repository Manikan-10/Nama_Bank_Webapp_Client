import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAllNamaAccounts, createNamaAccount, updateNamaAccount } from '../services/namaService';
import './ModeratorDashboardPage.css';

const ModeratorDashboardPage = () => {
    const { moderator, logout } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [newAccountName, setNewAccountName] = useState('');
    const [editData, setEditData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!moderator) {
            navigate('/moderator/login');
            return;
        }
        loadAccounts();
    }, [moderator, navigate]);

    const loadAccounts = async () => {
        try {
            const data = await getAllNamaAccounts();
            setAccounts(data);
        } catch (err) {
            console.error('Error loading accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        if (!newAccountName.trim()) {
            error('Please enter an account name.');
            return;
        }

        setSaving(true);
        try {
            await createNamaAccount(newAccountName.trim());
            success('Nama Bank account created successfully!');
            setNewAccountName('');
            setShowAddModal(false);
            loadAccounts();
        } catch (err) {
            error('Failed to create account. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (account) => {
        setSelectedAccount(account);
        setEditData({ name: account.name, description: account.description || '' });
        setShowEditModal(true);
    };

    const handleEditAccount = async (e) => {
        e.preventDefault();
        if (!editData.name.trim()) {
            error('Account name cannot be empty.');
            return;
        }

        setSaving(true);
        try {
            await updateNamaAccount(selectedAccount.id, {
                name: editData.name.trim(),
                description: editData.description.trim() || null
            });
            success('Account updated successfully!');
            setShowEditModal(false);
            setSelectedAccount(null);
            loadAccounts();
        } catch (err) {
            error('Failed to update account. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!moderator) return null;

    return (
        <div className="moderator-dashboard page-enter">
            <header className="dashboard-header">
                <div className="container">
                    <div className="header-content">
                        <div className="header-left">
                            <span className="om-symbol-small">ॐ</span>
                            <div>
                                <h1>Moderator Dashboard</h1>
                                <p className="welcome-text">Welcome, {moderator.name}</p>
                            </div>
                        </div>
                        <div className="header-right">
                            <Link to="/" className="btn btn-ghost btn-sm">Home</Link>
                            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    {/* Nama Bank Accounts */}
                    <section className="accounts-section">
                        <div className="section-header">
                            <h2>Nama Bank Accounts</h2>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddModal(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Account
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <span className="loader"></span>
                                <p>Loading accounts...</p>
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="empty-state">
                                <p>No Nama Bank accounts yet. Create one to get started!</p>
                            </div>
                        ) : (
                            <div className="accounts-grid">
                                {accounts.map(account => (
                                    <div key={account.id} className={`account-card ${!account.is_active ? 'inactive' : ''}`}>
                                        <div className="account-header">
                                            <h3>{account.name}</h3>
                                            <span className={`status-badge ${account.is_active ? 'active' : 'inactive'}`}>
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {account.description && (
                                            <p className="account-description">{account.description}</p>
                                        )}
                                        <div className="account-actions">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openEditModal(account)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Nama Bank Account</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddAccount}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Account Name</label>
                                    <input
                                        type="text"
                                        value={newAccountName}
                                        onChange={(e) => setNewAccountName(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g., Chennai Nama Bank"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Account Modal */}
            {showEditModal && selectedAccount && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Account</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleEditAccount}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Account Name</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                        className="form-input"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description (Optional)</label>
                                    <textarea
                                        value={editData.description}
                                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                        className="form-input"
                                        rows="3"
                                        placeholder="Enter a description for this Nama Bank..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModeratorDashboardPage;
