import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    getAllNamaAccounts,
    createNamaAccount,
    updateNamaAccount,
    getAllUsers,
    getUserAccountLinks,
    linkUserToAccounts,
    getPendingPrayers,
    approvePrayer,
    rejectPrayer,
    bulkCreateUsers,
    getBooks,
    deleteBook
} from '../services/namaService';
import ExcelUpload from '../components/ExcelUpload';
import BookUpload from '../components/BookUpload';
import './ModeratorDashboardPage.css';

const ModeratorDashboardPage = () => {
    const { moderator, logout } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('accounts');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [newAccountData, setNewAccountData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        target_goal: ''
    });
    const [editData, setEditData] = useState({ name: '', description: '', start_date: '', end_date: '', target_goal: '' });
    const [saving, setSaving] = useState(false);

    // Bank allocation modal states
    const [showBankAllocationModal, setShowBankAllocationModal] = useState(false);
    const [selectedUserForAllocation, setSelectedUserForAllocation] = useState(null);
    const [selectedBanksForAllocation, setSelectedBanksForAllocation] = useState([]);
    const [userCurrentBanks, setUserCurrentBanks] = useState([]);

    // Prayers state
    const [prayers, setPrayers] = useState([]);

    // Books state
    const [books, setBooks] = useState([]);

    // Convert number to Indian numbering words (lacs, crores)
    const numberToWords = (num) => {
        if (!num || isNaN(num)) return '';
        const n = parseInt(num);
        if (n >= 10000000) return (n / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Crores';
        if (n >= 100000) return (n / 100000).toFixed(2).replace(/\.?0+$/, '') + ' Lacs';
        if (n >= 1000) return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + ' Thousand';
        return n.toString();
    };

    useEffect(() => {
        if (!moderator) {
            navigate('/moderator/login');
            return;
        }
        loadData();
    }, [moderator, navigate]);

    const loadData = async () => {
        try {
            const [accountsData, usersData, prayersData, booksData] = await Promise.all([
                getAllNamaAccounts(),
                getAllUsers(),
                getPendingPrayers(),
                getBooks()
            ]);
            setAccounts(accountsData);
            setUsers(usersData);
            setPrayers(prayersData);
            setBooks(booksData);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Prayer approval handlers
    const handleApprovePrayer = async (prayerId) => {
        try {
            await approvePrayer(prayerId, moderator?.id);
            success('Prayer approved and now visible to public!');
            loadData();
        } catch (err) {
            console.error('Error approving prayer:', err);
            error('Failed to approve prayer');
        }
    };

    const handleRejectPrayer = async (prayerId) => {
        try {
            await rejectPrayer(prayerId);
            success('Prayer rejected');
            loadData();
        } catch (err) {
            console.error('Error rejecting prayer:', err);
            error('Failed to reject prayer');
        }
    };

    const handleDeleteBook = async (book) => {
        if (!confirm('Are you sure you want to delete this book?')) return;
        try {
            await deleteBook(book.id, book.file_url);
            success('Book deleted successfully');
            loadData();
        } catch (err) {
            console.error('Error deleting book:', err);
            error('Failed to delete book');
        }
    };


    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Bank allocation handlers
    const handleOpenBankAllocation = async (user) => {
        setSelectedUserForAllocation(user);
        try {
            const links = await getUserAccountLinks(user.id);
            const linkedAccountIds = links.map(l => l.account_id);
            setUserCurrentBanks(linkedAccountIds);
            setSelectedBanksForAllocation(linkedAccountIds);
            setShowBankAllocationModal(true);
        } catch (err) {
            error('Failed to load user bank links');
        }
    };

    const handleSaveBankAllocation = async () => {
        if (!selectedUserForAllocation) return;

        try {
            const newBanks = selectedBanksForAllocation.filter(
                id => !userCurrentBanks.includes(id)
            );

            if (newBanks.length > 0) {
                await linkUserToAccounts(selectedUserForAllocation.id, newBanks);
            }

            success('Bank accounts allocated successfully!');
            setShowBankAllocationModal(false);
            setSelectedUserForAllocation(null);
            setSelectedBanksForAllocation([]);
        } catch (err) {
            console.error('Error allocating banks:', err);
            error('Failed to allocate banks');
        }
    };

    // Bulk Upload Handler
    const [showUploadModal, setShowUploadModal] = useState(false);

    const handleBulkUpload = async (usersToUpload) => {
        try {
            setLoading(true); // Re-use loading or specific state? Using main loading for simplicity

            // Extract defaultAccountIds if any (assuming they are passed in the first user object or separate param)
            // The ExcelUpload component passes users with 'accountIds' property on each user object.
            // But bulkCreateUsers service expects (users, defaultAccountIds) where defaultAccountIds applies to all.
            // Let's check how ExcelUpload constructs data.
            // It maps: user.accountIds = selectedDefaultAccounts. So it's per user but all same.

            const defaultAccountIds = usersToUpload[0]?.accountIds || [];

            const { results: createdUsers, errors: failedUsers } = await bulkCreateUsers(usersToUpload, defaultAccountIds);

            const successCount = createdUsers.length;
            const errorCount = failedUsers.length;

            if (successCount > 0) {
                const skipMsg = errorCount > 0 ? ` (${errorCount} duplicates skipped)` : '';
                success(`Successfully added ${successCount} new users${skipMsg}!`);
            } else if (errorCount > 0) {
                // If only duplicates found, treat as info/success rather than error
                success(`No new users added. All ${errorCount} records were duplicates.`);
            }

            setShowUploadModal(false);
            loadData();
        } catch (err) {
            console.error('Bulk upload failed:', err);
            error('Bulk upload failed');
        } finally {
            setLoading(false);
        }
    };


    const toggleBankSelection = (accountId) => {
        setSelectedBanksForAllocation(prev =>
            prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        if (!newAccountData.name.trim()) {
            error('Please enter an account name.');
            return;
        }
        if (!newAccountData.start_date) {
            error('Please select a start date.');
            return;
        }

        setSaving(true);
        try {
            await createNamaAccount(
                newAccountData.name.trim(),
                newAccountData.start_date,
                newAccountData.end_date || null,
                newAccountData.target_goal ? parseInt(newAccountData.target_goal) : null
            );
            success('Nama Bank account created successfully!');
            setNewAccountData({ name: '', start_date: '', end_date: '', target_goal: '' });
            setShowAddModal(false);
            loadData();
        } catch (err) {
            console.error('Account creation error:', err);
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
            loadData();
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
                    {/* Tab Navigation */}
                    <div className="tab-navigation">
                        <button
                            className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('accounts')}
                        >
                            Nama Bank Accounts
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Users ({users.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'prayers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('prayers')}
                        >
                            Prayers ({prayers.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
                            onClick={() => setActiveTab('books')}
                        >
                            Books ({books.length})
                        </button>
                    </div>

                    {/* Nama Bank Accounts Tab */}
                    {activeTab === 'accounts' && (
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
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <section className="accounts-section">
                            <div className="section-header">
                                <h2>Registered Users</h2>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowUploadModal(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    Bulk Upload
                                </button>
                            </div>

                            {loading ? (
                                <div className="loading-state">
                                    <span className="loader"></span>
                                    <p>Loading users...</p>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="empty-state">
                                    <p>No users registered yet.</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="users-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>WhatsApp</th>
                                                <th>Location</th>
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
                                                    <td>{formatDate(user.created_at)}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleOpenBankAllocation(user)}
                                                        >
                                                            Allocate Banks
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Prayers Tab */}
                    {activeTab === 'prayers' && (
                        <section className="accounts-section">
                            <div className="section-header">
                                <h2>Pending Prayer Requests</h2>
                            </div>

                            {loading ? (
                                <div className="loading-state">
                                    <span className="loader"></span>
                                    <p>Loading prayers...</p>
                                </div>
                            ) : prayers.length === 0 ? (
                                <div className="empty-state">
                                    <p>No pending prayer requests.</p>
                                </div>
                            ) : (
                                <div className="prayer-cards">
                                    {prayers.map(prayer => (
                                        <div key={prayer.id} className="prayer-review-card">
                                            <div className="prayer-meta">
                                                <span className="prayer-author">
                                                    {prayer.privacy === 'anonymous' ? 'Anonymous' : prayer.name}
                                                </span>
                                                <span className="prayer-privacy">{prayer.privacy}</span>
                                            </div>
                                            <p className="prayer-text">{prayer.prayer_text}</p>
                                            <div className="prayer-info">
                                                <span>Email: {prayer.email}</span>
                                                {prayer.phone && <span>Phone: {prayer.phone}</span>}
                                                <span>Submitted: {formatDate(prayer.created_at)}</span>
                                            </div>
                                            <div className="prayer-actions">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleApprovePrayer(prayer.id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleRejectPrayer(prayer.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Books Tab */}
                    {activeTab === 'books' && (
                        <section className="accounts-section">
                            <div className="section-header">
                                <h2>Digital Bookshelf</h2>
                            </div>

                            <BookUpload onUploadSuccess={loadData} />

                            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: 'var(--text-color)' }}>Library Collection ({books.length})</h3>

                            {loading ? (
                                <div className="loading-state">
                                    <span className="loader"></span>
                                    <p>Loading books...</p>
                                </div>
                            ) : books.length === 0 ? (
                                <div className="empty-state">
                                    <p>No books in the library yet.</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="users-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Details</th>
                                                <th>Views</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {books.map(book => (
                                                <tr key={book.id}>
                                                    <td>
                                                        <strong>{book.title}</strong>
                                                        <br />
                                                        <a href={book.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85em', color: 'var(--primary-color)' }}>View PDF</a>
                                                    </td>
                                                    <td>
                                                        {book.year} {book.month}<br />
                                                        <small>{book.city}, {book.country}</small><br />
                                                        <small>{book.language} • {book.edition_type}</small>
                                                    </td>
                                                    <td>{book.view_count}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            style={{ color: '#ef4444' }}
                                                            onClick={() => handleDeleteBook(book)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    )}
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
                                    <label className="form-label">Account Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={newAccountData.name}
                                        onChange={(e) => setNewAccountData(prev => ({ ...prev, name: e.target.value }))}
                                        className="form-input"
                                        placeholder="e.g., Vizag Nama Bank"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-row" style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Start Date <span className="required">*</span></label>
                                        <input
                                            type="date"
                                            value={newAccountData.start_date}
                                            onChange={(e) => setNewAccountData(prev => ({ ...prev, start_date: e.target.value }))}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">End Date</label>
                                        <input
                                            type="date"
                                            value={newAccountData.end_date}
                                            onChange={(e) => setNewAccountData(prev => ({ ...prev, end_date: e.target.value }))}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Goal</label>
                                    <input
                                        type="number"
                                        value={newAccountData.target_goal}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.length <= 15) {
                                                setNewAccountData(prev => ({ ...prev, target_goal: val }));
                                            }
                                        }}
                                        className="form-input"
                                        placeholder="e.g., 1000000"
                                        min="0"
                                        max="999999999999999"
                                    />
                                    {newAccountData.target_goal && (
                                        <span className="form-hint target-label">{numberToWords(newAccountData.target_goal)}</span>
                                    )}
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

            {/* Bank Allocation Modal */}
            {showBankAllocationModal && selectedUserForAllocation && (
                <div className="modal-overlay" onClick={() => setShowBankAllocationModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Allocate Banks to {selectedUserForAllocation.name}</h2>
                            <button className="modal-close" onClick={() => setShowBankAllocationModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-description">Select Nama Bank accounts to allocate:</p>
                            <div className="checkbox-group">
                                {accounts.filter(acc => acc.is_active).map(account => (
                                    <label key={account.id} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedBanksForAllocation.includes(account.id)}
                                            onChange={() => toggleBankSelection(account.id)}
                                            disabled={userCurrentBanks.includes(account.id)}
                                        />
                                        <span>
                                            {account.name}
                                            {userCurrentBanks.includes(account.id) && (
                                                <small className="already-linked"> (Already linked)</small>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowBankAllocationModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveBankAllocation}>
                                Allocate Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <ExcelUpload
                            onUpload={handleBulkUpload}
                            onClose={() => setShowUploadModal(false)}
                            accounts={accounts}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModeratorDashboardPage;
