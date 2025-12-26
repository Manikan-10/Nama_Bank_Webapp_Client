import { useState } from 'react';
import { Link } from 'react-router-dom';
import './PhotoGalleryPage.css';

const DUMMY_PHOTOS = [
    {
        id: 1,
        title: 'Divine Meditation',
        url: '/brain/5680e0fd-5186-48e5-a851-1c2e69def77d/devotional_1_1766771740611.png',
        description: 'A serene meditative pose capturing spiritual peace.'
    },
    {
        id: 2,
        title: 'Eternal Flame',
        url: '/brain/5680e0fd-5186-48e5-a851-1c2e69def77d/devotional_2_1766771755978.png',
        description: 'Traditional temple lamps glowing with divine light.'
    },
    {
        id: 3,
        title: 'Bhajan Sandhya',
        url: '/brain/5680e0fd-5186-48e5-a851-1c2e69def77d/devotional_3_1766771772829.png',
        description: 'Devotees coming together in joyful prayer.'
    },
    {
        id: 4,
        title: 'Sacred Wisdom',
        url: '/brain/5680e0fd-5186-48e5-a851-1c2e69def77d/devotional_4_1766771792362.png',
        description: 'The Bhagavad Gita and prayer beads on a sacred altar.'
    }
];

const PhotoGalleryPage = () => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const handleDownload = (photo) => {
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = `${photo.title.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="gallery-page">
            <header className="gallery-header">
                <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)', textDecoration: 'none', marginBottom: '20px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Home
                </Link>
                <h1>Photo Gallery</h1>
                <p>Divine glimpses & spiritual wallpapers for your reflection</p>
            </header>

            <div className="gallery-grid">
                {DUMMY_PHOTOS.map(photo => (
                    <div key={photo.id} className="photo-card">
                        <div className="photo-wrapper" onClick={() => setSelectedPhoto(photo)}>
                            <img src={photo.url} alt={photo.title} />
                            <div className="photo-overlay">
                                <button className="view-btn">View Full Size</button>
                            </div>
                        </div>
                        <div className="photo-info">
                            <h3>{photo.title}</h3>
                            <a
                                href={photo.url}
                                download
                                className="download-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDownload(photo);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {selectedPhoto && (
                <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedPhoto(null)}>&times;</button>
                        <img src={selectedPhoto.url} alt={selectedPhoto.title} />
                        <div className="modal-actions">
                            <a
                                href={selectedPhoto.url}
                                download
                                className="modal-download"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDownload(selectedPhoto);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download Wallpaper
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoGalleryPage;
