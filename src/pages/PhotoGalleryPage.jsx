import { useState } from 'react';
import { Link } from 'react-router-dom';
import './PhotoGalleryPage.css';

// Placeholder photos - will be replaced with Cloudinary URLs
const GALLERY_PHOTOS = [
    {
        id: 1,
        title: 'Divine Meditation',
        url: 'https://res.cloudinary.com/dipqvcj8t/image/upload/v1765666688/devotional_1_1766771740611.png',
        description: 'A serene meditative pose capturing spiritual peace.',
        category: 'Devotional'
    },
    {
        id: 2,
        title: 'Eternal Flame',
        url: 'https://res.cloudinary.com/dipqvcj8t/image/upload/v1765666687/devotional_2_1766771755978.png',
        description: 'Traditional temple lamps glowing with divine light.',
        category: 'Temple'
    },
    {
        id: 3,
        title: 'Bhajan Sandhya',
        url: 'https://res.cloudinary.com/dipqvcj8t/image/upload/v1765666690/devotional_3_1766771772829.png',
        description: 'Devotees coming together in joyful prayer.',
        category: 'Devotional'
    },
    {
        id: 4,
        title: 'Sacred Wisdom',
        url: 'https://res.cloudinary.com/dipqvcj8t/image/upload/v1765666693/devotional_4_1766771792362.png',
        description: 'The Bhagavad Gita and prayer beads on a sacred altar.',
        category: 'Scriptures'
    }
];

const CATEGORIES = ['All', 'Devotional', 'Temple', 'Scriptures', 'Wallpapers'];

const PhotoGalleryPage = () => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [downloading, setDownloading] = useState(null);

    const filteredPhotos = activeCategory === 'All'
        ? GALLERY_PHOTOS
        : GALLERY_PHOTOS.filter(p => p.category === activeCategory);

    const handleDownload = async (photo) => {
        setDownloading(photo.id);
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${photo.title.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="gallery-page">
            <header className="gallery-header">
                <Link to="/" className="back-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Home
                </Link>
                <h1>Photo Gallery</h1>
                <p>Divine glimpses & spiritual wallpapers for your reflection</p>
            </header>

            {/* Category Filter */}
            <div className="gallery-filters">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Gallery Grid */}
            <div className="gallery-grid">
                {filteredPhotos.length === 0 ? (
                    <div className="empty-gallery">
                        <p>No photos in this category yet.</p>
                    </div>
                ) : (
                    filteredPhotos.map(photo => (
                        <div key={photo.id} className="photo-card">
                            <div className="photo-wrapper" onClick={() => setSelectedPhoto(photo)}>
                                <img src={photo.url} alt={photo.title} loading="lazy" />
                                <div className="photo-overlay">
                                    <span className="view-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                            <line x1="11" y1="8" x2="11" y2="14" />
                                            <line x1="8" y1="11" x2="14" y2="11" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div className="photo-info">
                                <h3>{photo.title}</h3>
                                <span className="photo-category">{photo.category}</span>
                                <button
                                    className="download-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(photo);
                                    }}
                                    disabled={downloading === photo.id}
                                >
                                    {downloading === photo.id ? (
                                        <span className="loader-sm"></span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                    )}
                                    Download
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedPhoto(null)}>&times;</button>
                        <img src={selectedPhoto.url} alt={selectedPhoto.title} />
                        <div className="modal-info">
                            <h2>{selectedPhoto.title}</h2>
                            <p>{selectedPhoto.description}</p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="modal-download"
                                onClick={() => handleDownload(selectedPhoto)}
                                disabled={downloading === selectedPhoto.id}
                            >
                                {downloading === selectedPhoto.id ? (
                                    <>
                                        <span className="loader-sm"></span>
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Download Wallpaper
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="gallery-info">
                <p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    More photos will be added soon. Check back for updates!
                </p>
            </div>
        </div>
    );
};

export default PhotoGalleryPage;
