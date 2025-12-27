import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getAccountStats } from '../services/namaService';
import { supabase } from '../supabaseClient';
import './PublicReportsPage.css';

const COLORS = ['#FF9933', '#8B0000', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4', '#E91E63'];

const PublicReportsPage = () => {
    const [loading, setLoading] = useState(true);
    const [accountStats, setAccountStats] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [userTotals, setUserTotals] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [sourceRatio, setSourceRatio] = useState([]);
    const [cityStats, setCityStats] = useState([]);
    const [newDevotees, setNewDevotees] = useState([]);
    const [topGrowing, setTopGrowing] = useState([]);
    const [totalStats, setTotalStats] = useState({ users: 0, entries: 0, total: 0 });
    const [recentEntries, setRecentEntries] = useState([]);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            await Promise.all([
                loadAccountStats(),
                loadRecentUsers(),
                loadUserTotals(),
                loadDailyData(),
                loadWeeklyData(),
                loadSourceRatio(),
                loadCityStats(),
                loadNewDevotees(),
                loadTopGrowing(),
                loadTotalStats(),
                loadRecentEntries()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAccountStats = async () => {
        const data = await getAccountStats();
        setAccountStats(data || []);
    };

    const loadRecentUsers = async () => {
        // Get users with their linked accounts and entry counts
        const { data: users } = await supabase
            .from('users')
            .select('id, name, city, profile_photo, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(8);

        if (users) {
            // Get linked accounts and totals for each user
            const enrichedUsers = await Promise.all(users.map(async (user) => {
                const { data: links } = await supabase
                    .from('user_account_links')
                    .select('nama_accounts(name)')
                    .eq('user_id', user.id);

                const { data: entries } = await supabase
                    .from('nama_entries')
                    .select('count')
                    .eq('user_id', user.id);

                const totalCount = (entries || []).reduce((sum, e) => sum + e.count, 0);
                const accounts = (links || []).map(l => l.nama_accounts?.name).filter(Boolean);

                return { ...user, accounts, totalCount };
            }));
            setRecentUsers(enrichedUsers);
        }
    };

    const loadUserTotals = async () => {
        const { data: users } = await supabase.from('users').select('id, name, city');
        const { data: entries } = await supabase.from('nama_entries').select('user_id, count');

        const userMap = {};
        (entries || []).forEach(entry => {
            if (!userMap[entry.user_id]) userMap[entry.user_id] = 0;
            userMap[entry.user_id] += entry.count;
        });

        const totals = (users || [])
            .map(user => ({
                name: user.name,
                city: user.city,
                total: userMap[user.id] || 0
            }))
            .filter(u => u.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        setUserTotals(totals);
    };

    const loadDailyData = async () => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const { data } = await supabase
            .from('nama_entries')
            .select('count, entry_date')
            .gte('entry_date', last7Days[0]);

        const dailyTotals = last7Days.map(date => {
            const dayEntries = (data || []).filter(e => e.entry_date === date);
            const total = dayEntries.reduce((sum, e) => sum + e.count, 0);
            return {
                date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
                count: total
            };
        });

        setDailyData(dailyTotals);
    };

    const loadWeeklyData = async () => {
        const last4Weeks = [];
        for (let i = 3; i >= 0; i--) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - (i * 7) - 6);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            last4Weeks.push({
                label: `Week ${4 - i}`,
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            });
        }

        const { data } = await supabase.from('nama_entries').select('count, entry_date');

        const weeklyTotals = last4Weeks.map(week => {
            const weekEntries = (data || []).filter(e => e.entry_date >= week.start && e.entry_date <= week.end);
            return {
                week: week.label,
                count: weekEntries.reduce((sum, e) => sum + e.count, 0)
            };
        });

        setWeeklyData(weeklyTotals);
    };

    const loadSourceRatio = async () => {
        const { data } = await supabase.from('nama_entries').select('source_type, count');
        const manual = (data || []).filter(e => e.source_type === 'manual').reduce((sum, e) => sum + e.count, 0);
        const audio = (data || []).filter(e => e.source_type === 'audio').reduce((sum, e) => sum + e.count, 0);
        setSourceRatio([
            { name: 'Manual', value: manual },
            { name: 'Audio', value: audio }
        ]);
    };

    const loadCityStats = async () => {
        const { data: users } = await supabase.from('users').select('id, city');
        const { data: entries } = await supabase.from('nama_entries').select('user_id, count');

        const cityMap = {};
        (users || []).forEach(user => {
            if (user.city) {
                if (!cityMap[user.city]) cityMap[user.city] = { city: user.city, count: 0 };
                const userEntries = (entries || []).filter(e => e.user_id === user.id);
                cityMap[user.city].count += userEntries.reduce((sum, e) => sum + e.count, 0);
            }
        });

        const sorted = Object.values(cityMap).sort((a, b) => b.count - a.count).slice(0, 6);
        setCityStats(sorted);
    };

    const loadNewDevotees = async () => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const { data } = await supabase.from('users').select('created_at');

        const dailyNew = last7Days.map(date => {
            const count = (data || []).filter(u => u.created_at?.split('T')[0] === date).length;
            return {
                date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
                count
            };
        });

        setNewDevotees(dailyNew);
    };

    const loadTopGrowing = async () => {
        // Get this week's entries per account
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const { data } = await supabase
            .from('nama_entries')
            .select('account_id, count, nama_accounts(name)')
            .gte('entry_date', weekStart.toISOString().split('T')[0]);

        const accountMap = {};
        (data || []).forEach(entry => {
            const name = entry.nama_accounts?.name || 'Unknown';
            if (!accountMap[name]) accountMap[name] = 0;
            accountMap[name] += entry.count;
        });

        const sorted = Object.entries(accountMap)
            .map(([name, count]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, growth: count }))
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 5);

        setTopGrowing(sorted);
    };

    const loadTotalStats = async () => {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { data: entries } = await supabase.from('nama_entries').select('count');
        const total = (entries || []).reduce((sum, e) => sum + e.count, 0);
        setTotalStats({ users: userCount || 0, entries: (entries || []).length, total });
    };

    const loadRecentEntries = async () => {
        const { data } = await supabase
            .from('nama_entries')
            .select(`
                id,
                count,
                entry_date,
                start_date,
                end_date,
                source_type,
                users (name),
                nama_accounts (name)
            `)
            .order('created_at', { ascending: false })
            .limit(15);
        setRecentEntries(data || []);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatNumber = (num) => {
        return num?.toLocaleString() || '0';
    };

    if (loading) {
        return (
            <div className="public-reports-page">
                <div className="page-loader">
                    <span className="loader"></span>
                    <p>Loading community reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="public-reports-page page-enter">
            <header className="reports-header">
                <div className="container">
                    <Link to="/" className="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Home
                    </Link>
                    <div className="header-content">
                        <div className="om-symbol">ॐ</div>
                        <h1>Nama Bank Reports</h1>
                        <p>Community devotion statistics and insights</p>
                    </div>
                </div>
            </header>

            <main className="reports-main">
                <div className="container">
                    {/* Global Stats */}
                    <section className="global-stats">
                        <div className="stat-card highlight">
                            <div className="stat-value">{formatNumber(totalStats.total)}</div>
                            <div className="stat-label">Total Namas</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{formatNumber(totalStats.users)}</div>
                            <div className="stat-label">Devotees</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{formatNumber(totalStats.entries)}</div>
                            <div className="stat-label">Entries</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{accountStats.length}</div>
                            <div className="stat-label">Nama Banks</div>
                        </div>
                    </section>

                    {/* Recently Joined Users - Enhanced */}
                    <section className="section recently-joined">
                        <h2>Recently Joined Devotees</h2>
                        <div className="users-grid-enhanced">
                            {recentUsers.map(user => (
                                <div key={user.id} className="user-card-enhanced">
                                    <div className="user-avatar-lg">
                                        {user.profile_photo ? (
                                            <img src={user.profile_photo} alt={user.name} />
                                        ) : (
                                            <span>{user.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="user-details">
                                        <h4>{user.name}</h4>
                                        {user.city && <p className="user-city"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>{user.city}</p>}
                                        <div className="user-accounts">
                                            {user.accounts?.slice(0, 2).map((acc, i) => (
                                                <span key={i} className="mini-tag">{acc}</span>
                                            ))}
                                        </div>
                                        <div className="user-contribution">
                                            <strong>{formatNumber(user.totalCount)}</strong> Namas
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* User Consolidated Totals */}
                    <section className="section user-totals">
                        <h2>Top Contributors</h2>
                        <div className="leaderboard">
                            {userTotals.map((user, index) => (
                                <div key={index} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                                    <span className="rank">{index + 1}</span>
                                    <div className="contributor-info">
                                        <span className="contributor-name">{user.name}</span>
                                        {user.city && <span className="contributor-city">{user.city}</span>}
                                    </div>
                                    <span className="contributor-total">{formatNumber(user.total)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Account Level Reports */}
                    <section className="section account-stats">
                        <div className="section-header">
                            <h2>Account-wise Statistics</h2>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nama Bank</th><th>Today</th><th>This Week</th>
                                        <th>This Month</th><th>This Year</th><th>Overall</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accountStats.map(account => (
                                        <tr key={account.id}>
                                            <td><strong>{account.name}</strong></td>
                                            <td>{formatNumber(account.today)}</td>
                                            <td>{formatNumber(account.thisWeek)}</td>
                                            <td>{formatNumber(account.thisMonth)}</td>
                                            <td>{formatNumber(account.thisYear)}</td>
                                            <td className="highlight-cell">{formatNumber(account.overall)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Recent Nama Offerings with Period */}
                    <section className="section recent-offerings">
                        <h2>Recent Nama Offerings</h2>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Devotee</th>
                                        <th>Nama Bank</th>
                                        <th>Count</th>
                                        <th>Period (Start - End)</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td>{entry.users?.name || '-'}</td>
                                            <td><strong>{entry.nama_accounts?.name || '-'}</strong></td>
                                            <td className="highlight-cell">{formatNumber(entry.count)}</td>
                                            <td>
                                                {entry.start_date || entry.end_date ? (
                                                    <span className="date-range-badge">
                                                        {formatDate(entry.start_date) || '...'} - {formatDate(entry.end_date) || '...'}
                                                    </span>
                                                ) : (
                                                    <span className="single-day-badge">Single Day</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${entry.source_type === 'audio' ? 'info' : 'success'}`}>
                                                    {entry.source_type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Charts Section */}
                    <section className="section charts-section">
                        <h2>Advanced Metrics</h2>
                        <div className="charts-grid">
                            {/* Daily Growth */}
                            <div className="chart-card">
                                <h3>Daily Nama Growth (7 Days)</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="count" stroke="#FF9933" fill="rgba(255,153,51,0.3)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Weekly Momentum */}
                            <div className="chart-card">
                                <h3>Weekly Momentum</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#8B0000" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Account Contribution */}
                            <div className="chart-card">
                                <h3>Account Contribution</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={accountStats.filter(a => a.overall > 0)} dataKey="overall" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                            {accountStats.map((e, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip /><Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Audio vs Manual */}
                            <div className="chart-card">
                                <h3>Audio vs Manual</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={sourceRatio} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                                            <Cell fill="#4CAF50" /><Cell fill="#2196F3" />
                                        </Pie>
                                        <Tooltip /><Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* City Distribution */}
                            <div className="chart-card">
                                <h3>Top Cities</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={cityStats} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis dataKey="city" type="category" tick={{ fontSize: 10 }} width={80} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#9C27B0" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* New Devotees Timeline */}
                            <div className="chart-card">
                                <h3>New Devotees (7 Days)</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={newDevotees}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke="#E91E63" strokeWidth={2} dot={{ fill: '#E91E63' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Top Growing Accounts */}
                            <div className="chart-card chart-card-wide">
                                <h3>Top Growing Accounts (This Week)</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={topGrowing}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="growth" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    {/* Quote */}
                    <div className="quote-section">
                        <p>"When devotees unite in Nama Japa, the collective energy transcends individual efforts."</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicReportsPage;
