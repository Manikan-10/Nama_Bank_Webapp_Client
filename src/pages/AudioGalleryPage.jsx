import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AudioGalleryPage.css';

const AUDIO_FILES = [
    { id: 1, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 1', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666688/01.VoiceofGod_tagpxh.mp3' },
    { id: 2, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 2', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666687/02.VoiceofGod_zdvkzf.mp3' },
    { id: 3, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 3', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666690/03.VoiceofGod_e18rxd.mp3' },
    { id: 4, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 4', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666693/06.SP1_qxu4yy.mp3' },
    { id: 5, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 5', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666692/07.SS1_jr59ev.mp3' },
    { id: 6, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 6', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666693/08.SP3_mv19yp.mp3' },
    { id: 7, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 7', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666694/09.SP4_v4xauk.mp3' },
    { id: 8, album: 'Nama Japa Collection', title: 'Yogi Ramsuratkumar Nama Japa - 8', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666691/10.MA1_j2lr9g.mp3' },
    { id: 9, album: 'Satsang Bhajans', title: 'Asatoma Sadgamaya', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666688/01.VoiceofGod_tagpxh.mp3' },
    { id: 10, album: 'Satsang Bhajans', title: 'Om Namo Narayanaya', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1765666687/02.VoiceofGod_zdvkzf.mp3' }
];

const ALBUMS = [
    {
        title: 'Nama Japa Collection',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
            </svg>
        ),
        count: 8
    },
    {
        title: 'Satsang Bhajans',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
            </svg>
        ),
        count: 2
    },
    {
        title: 'Spiritual Discourses',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        count: 0
    }
];

const AudioGalleryPage = () => {
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('title');
    const [playingAudio, setPlayingAudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [favorites, setFavorites] = useState([]);

    const audioRef = useRef(null);

    useEffect(() => {
        const stored = localStorage.getItem('audio_favorites');
        if (stored) setFavorites(JSON.parse(stored));
    }, []);

    const toggleFavorite = (id) => {
        const newFavs = favorites.includes(id)
            ? favorites.filter(fid => fid !== id)
            : [...favorites, id];
        setFavorites(newFavs);
        localStorage.setItem('audio_favorites', JSON.stringify(newFavs));
    };

    const handlePlayPause = (audio) => {
        if (playingAudio?.id === audio.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            setPlayingAudio(audio);
            setIsPlaying(true);
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.src = audio.src;
                    audioRef.current.play();
                }
            }, 0);
        }
    };

    const filteredAudios = AUDIO_FILES
        .filter(a => !selectedAlbum || a.album === selectedAlbum)
        .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'id') return a.id - b.id;
            return 0;
        });

    return (
        <div className="audio-gallery-page">
            <header className="audio-header">
                <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)', textDecoration: 'none', marginBottom: '20px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Home
                </Link>
                <h1>Satsang Audios</h1>
                <p>Listen to divine chants, bhajans and spiritual discourses</p>
            </header>

            {!selectedAlbum ? (
                <div className="albums-grid">
                    {ALBUMS.map(album => (
                        <div key={album.title} className="album-card" onClick={() => setSelectedAlbum(album.title)}>
                            <div className="album-art">{album.icon}</div>
                            <h3>{album.title}</h3>
                            <div className="meta-count">{album.count} Tracks</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="audio-list-view">
                    <div className="view-header">
                        <button className="back-to-albums" onClick={() => setSelectedAlbum(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Back to Albums
                        </button>
                        <div className="view-controls">
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Search tracks..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="title">Sort by Title</option>
                                <option value="id">Sort by Date Added</option>
                            </select>
                        </div>
                    </div>

                    <h2 style={{ marginBottom: '20px', color: 'var(--maroon)' }}>{selectedAlbum}</h2>

                    <div className="audio-items-list">
                        {filteredAudios.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>No tracks found in this album.</p>
                        ) : (
                            filteredAudios.map(audio => (
                                <div key={audio.id} className="audio-gallery-item">
                                    <button
                                        className={`item-play-btn ${playingAudio?.id === audio.id && isPlaying ? 'playing' : ''}`}
                                        onClick={() => handlePlayPause(audio)}
                                    >
                                        {playingAudio?.id === audio.id && isPlaying ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3" />
                                            </svg>
                                        )}
                                    </button>
                                    <div className="item-info">
                                        <h4>{audio.title}</h4>
                                        <span>{audio.album}</span>
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            className={`action-icon ${favorites.includes(audio.id) ? 'favorite' : ''}`}
                                            onClick={() => toggleFavorite(audio.id)}
                                            title="Add to Favorites"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={favorites.includes(audio.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
                                        </button>
                                        <a href={audio.src} download className="action-icon" title="Download Audio">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {playingAudio && (
                <div className="gallery-player-bar">
                    <div className="bar-info">
                        <strong>Now Playing:</strong> {playingAudio.title}
                    </div>
                    <div className="bar-controls">
                        <button className="bar-btn main" onClick={() => handlePlayPause(playingAudio)}>
                            {isPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            )}
                        </button>
                        <button className="bar-btn" onClick={() => setPlayingAudio(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <audio
                        ref={audioRef}
                        onEnded={() => setIsPlaying(false)}
                        style={{ display: 'none' }}
                    />
                </div>
            )}
        </div>
    );
};

export default AudioGalleryPage;
