import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getBooks, getApprovedPrayers } from '../services/namaService';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [liveStats, setLiveStats] = useState({
        totalUsers: 0,
        totalNamaCount: 0,
        activeAccounts: 0,
        totalBooks: 0,
        totalPrayers: 0
    });
    const [recentBooks, setRecentBooks] = useState([]);
    const [recentPrayers, setRecentPrayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get total users
                const { count: userCount } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });

                // Get total nama count
                const { data: namaData } = await supabase
                    .from('nama_entries')
                    .select('count, account_id');

                const totalNama = namaData?.reduce((sum, entry) => sum + (entry.count || 0), 0) || 0;

                // Get active accounts count (accounts with at least one entry)
                const activeAccountIds = new Set(namaData?.map(entry => entry.account_id).filter(Boolean));
                const accountCount = activeAccountIds.size;

                // Get total books
                const { count: bookCount } = await supabase
                    .from('books')
                    .select('*', { count: 'exact', head: true });

                // Get total prayers
                const { count: prayerCount } = await supabase
                    .from('prayers')
                    .select('*', { count: 'exact', head: true });

                setLiveStats({
                    totalUsers: userCount || 0,
                    totalNamaCount: totalNama,
                    activeAccounts: accountCount || 0,
                    totalBooks: bookCount || 0,
                    totalPrayers: prayerCount || 0
                });

            } catch (err) {
                console.error('Error fetching landing data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
        if (num >= 100000) return (num / 100000).toFixed(2) + ' Lacs';
        if (num >= 1000) return num.toLocaleString('en-IN');
        return num.toString();
    };

    return (
        <div className="landing-page">
            <div className="landing-container">
                {/* Header Section */}
                <header className="landing-header">
                    <div className="om-symbol">ॐ</div>
                    <h1 className="landing-title">Nama Bank</h1>
                    <p className="landing-subtitle">
                        A humble digital space for devotees to record their daily Nama Japa
                        and track their spiritual journey with sincerity.
                    </p>
                </header>

                {/* About Nama Bank - Intro Section */}
                <section className="intro-section">
                    <div className="intro-card">
                        <h2 className="intro-greeting">Yogi Ramsuratkumar Jaya Guru Raya!</h2>
                        <div className="intro-content">
                            <p>
                                <strong>Nama Bank</strong> is a humble devotional initiative to encourage continuous Nama Japa.
                            </p>
                            <p>
                                <strong>Why Chant the Divine Name?</strong><br />
                                Chanting the Divine Name purifies the mind and prepares the soul for the journey beyond this life.
                            </p>
                            <p>
                                <strong>Why Count Nama?</strong><br />
                                Counting Nama is not for comparison, but for discipline, continuity, and sincere remembrance.
                            </p>
                            <p>
                                <strong>Why Offer Nama Collectively?</strong><br />
                                When Nama is offered towards a shared goal, even a small effort becomes part of a greater spiritual sankalpa.
                            </p>
                            <p className="intro-quote">
                                <em>"All wealth stays behind. Only Nama travels with us."</em>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <main className="landing-main">
                    <div className="landing-cards">
                        {/* New User Card */}
                        <Link to="/register" className="landing-card hover-lift">
                            <div className="card-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            </div>
                            <h2 className="card-title">Join the Nama Sankalpa</h2>
                            <p className="card-description">
                                Begin your Nama journey and participate in the collective offering
                            </p>
                            <span className="card-action">
                                Open Account
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </span>
                        </Link>

                        {/* User State Card */}
                        {authLoading ? (
                            <div className="landing-card">
                                <div className="card-icon-wrapper">
                                    <div className="loader" style={{ width: '24px', height: '24px', border: '3px solid var(--saffron-light)', borderTopColor: 'var(--saffron-dark)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                </div>
                                <h2 className="card-title">Checking Status...</h2>
                                <p className="card-description">Please wait while we verify your session</p>
                            </div>
                        ) : user ? (
                            <Link to="/dashboard" className="landing-card hover-lift">
                                <div className="card-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                </div>
                                <h2 className="card-title">Go to Dashboard</h2>
                                <p className="card-description">
                                    Welcome back, {user.name?.split(' ')[0]}! Continue your journey
                                </p>
                                <span className="card-action">
                                    Dashboard
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </span>
                            </Link>
                        ) : (
                            <Link to="/login" className="landing-card hover-lift">
                                <div className="card-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                </div>
                                <h2 className="card-title">Continue Nama Offering</h2>
                                <p className="card-description">
                                    Continue your daily Nama Japa and record your offering
                                </p>
                                <span className="card-action">
                                    Login
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </span>
                            </Link>
                        )}

                        {/* Reports Card - Public */}
                        <Link to="/reports/public" className="landing-card hover-lift">
                            <div className="card-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                            </div>
                            <h2 className="card-title">Reports</h2>
                            <p className="card-description">
                                View community Nama statistics, charts, and devotion metrics
                            </p>
                            <span className="card-action">
                                View Reports
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </span>
                        </Link>

                        {/* Live Summary Box - Small */}
                        <div className="landing-card live-summary-card hover-lift" style={{ textAlign: 'left' }}>
                            <div className="card-icon-wrapper" style={{ marginBottom: '1rem', background: 'var(--saffron-light)', width: '48px', height: '48px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <h2 className="card-title" style={{ textAlign: 'left', marginBottom: '0.25rem', fontSize: '1rem' }}>LIVE SUMMARY</h2>
                            <p className="summary-header" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.9rem' }}>🌸</span> Nama Bank at a Glance
                            </p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                                <li>• {formatNumber(liveStats.totalUsers)} devotees participating</li>
                                <li>• {formatNumber(liveStats.totalNamaCount)} Nama offered</li>
                                <li>• {liveStats.activeAccounts} active Sankalpas</li>
                            </ul>
                        </div>


                        {/* Featured Books Section */}
                        {recentBooks.length > 0 && (
                            <div className="landing-card" style={{ gridColumn: '1 / -1', background: 'var(--white)', overflow: 'hidden' }}>
                                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h2 className="card-title" style={{ color: 'var(--maroon)', marginBottom: '0.25rem' }}>LATEST EDITIONS</h2>
                                        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Read our monthly digital books</p>
                                    </div>
                                    <Link to="/books" style={{ color: 'var(--saffron-dark)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        View Library
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </Link>
                                </div>

                                <div className="featured-books-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {recentBooks.map(book => (
                                        <Link to={`/books/${book.id}`} key={book.id} className="book-preview-card hover-lift" style={{
                                            textDecoration: 'none',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            background: '#fcfcfc',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            border: '1px solid #eee'
                                        }}>
                                            <div style={{
                                                height: '160px',
                                                background: `linear-gradient(45deg, var(--saffron-light) 0%, #fff 100%)`,
                                                borderRadius: '4px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                boxShadow: '2px 2px 5px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '10px',
                                                    top: '0',
                                                    bottom: '0',
                                                    width: '4px',
                                                    background: 'rgba(0,0,0,0.1)'
                                                }}></div>
                                                <span style={{ fontSize: '2rem' }}>📖</span>
                                            </div>
                                            <h4 style={{ color: 'var(--text-dark)', fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h4>
                                            <span style={{ color: 'var(--saffron-dark)', fontSize: '0.8rem', fontWeight: '500' }}>{book.month} {book.year}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Media Section Box */}
                        <div className="landing-card media-selection-card" style={{ gridColumn: '1 / -1', background: 'var(--white)' }}>
                            <div className="media-section-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <h2 className="card-title" style={{ color: 'var(--maroon)' }}>MEDIA & DEVOTION</h2>
                                <p style={{ color: 'var(--gray-500)' }}>Explore spiritual gallery and satsang audios</p>
                            </div>
                            <div className="media-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                <Link to="/gallery" className="media-option hover-lift" style={{ textDecoration: 'none', padding: '20px', borderRadius: '12px', background: 'var(--cream-light)', border: '1px solid var(--saffron-light)', textAlign: 'center' }}>
                                    <div className="media-icon" style={{ color: 'var(--saffron-dark)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                    <h3 style={{ color: 'var(--maroon)', marginBottom: '5px', fontSize: '1.1rem' }}>Gallery</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Photos & Wallpapers</p>
                                </Link>
                                <Link to="/audios" className="media-option hover-lift" style={{ textDecoration: 'none', padding: '20px', borderRadius: '12px', background: 'var(--cream-light)', border: '1px solid var(--saffron-light)', textAlign: 'center' }}>
                                    <div className="media-icon" style={{ color: 'var(--saffron-dark)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 18V5l12-2v13" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="16" r="3" />
                                        </svg>
                                    </div>
                                    <h3 style={{ color: 'var(--maroon)', marginBottom: '5px', fontSize: '1.1rem' }}>Audios</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Satsang Bhajans</p>
                                </Link>
                                <Link to="/books" className="media-option hover-lift" style={{ textDecoration: 'none', padding: '20px', borderRadius: '12px', background: 'var(--cream-light)', border: '1px solid var(--saffron-light)', textAlign: 'center' }}>
                                    <div className="media-icon" style={{ color: 'var(--saffron-dark)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    </div>
                                    <h3 style={{ color: 'var(--maroon)', marginBottom: '5px', fontSize: '1.1rem' }}>Library</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{liveStats.totalBooks > 0 ? `${liveStats.totalBooks} Books` : 'Monthly Editions'}</p>
                                </Link>
                                <Link to="/prayers" className="media-option hover-lift" style={{ textDecoration: 'none', padding: '20px', borderRadius: '12px', background: 'var(--cream-light)', border: '1px solid var(--saffron-light)', textAlign: 'center' }}>
                                    <div className="media-icon" style={{ color: 'var(--saffron-dark)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M7 11v-1a5 5 0 0 1 10 0v1" />
                                            <path d="M5.5 13H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1.5a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z" />
                                            <path d="M18.5 13H20a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5z" />
                                            <path d="M12 18v2" />
                                            <path d="M8 22h8" />
                                        </svg>
                                    </div>
                                    <h3 style={{ color: 'var(--maroon)', marginBottom: '5px', fontSize: '1.1rem' }}>Prayers</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{liveStats.totalPrayers > 0 ? `${liveStats.totalPrayers} Prayers` : 'Community'}</p>
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* Moderator & Admin Links */}
                    <div className="admin-section">
                        <Link to="/moderator/login" className="admin-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Moderator Login
                        </Link>
                        <Link to="/admin/login" className="admin-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Admin Access
                        </Link>
                        <p className="admin-disclaimer">Moderator and Admin access are restricted.</p>
                    </div>
                </main>

                {/* Footer Quote */}
                <footer className="landing-footer">
                    <div className="quote-wrapper">
                        <p className="quote">
                            "With sincerity in heart and devotion in mind, each Nama brings us closer to the Divine."
                        </p>
                    </div>
                </footer>
            </div>

            {/* Decorative Elements */}
            <div className="decoration decoration-1"></div>
            <div className="decoration decoration-2"></div>
        </div>
    );
};

export default LandingPage;
