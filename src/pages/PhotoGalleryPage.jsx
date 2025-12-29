import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PhotoGalleryPage.css';

// Base Cloudinary URL for transformations (optional, can be basic)
const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dipqvcj8t/image/upload';
const CLOUDINARY_LIST_URL = 'https://res.cloudinary.com/dipqvcj8t/image/list/namabank_images.json';

const CATEGORIES = ['All', 'Devotional', 'Temple', 'Scriptures', 'Wallpapers'];

const PhotoGalleryPage = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const response = await fetch(CLOUDINARY_LIST_URL);
                if (!response.ok) throw new Error('Failed to fetch photos');

                const data = await response.json();

                // Transform Cloudinary resources to gallery format
                const fetchedPhotos = data.resources.map((res, index) => {
                    // Create a title from public_id (remove folder path and underscores)
                    const titleRaw = res.public_id.split('/').pop().replace(/_/g, ' ').replace(/\d+\./, ''); // Removes sort numbers usually
                    const title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1);

                    return {
                        id: res.asset_id, // Use asset_id as unique key
                        title: title || 'Divine Photo',
                        url: `${CLOUDINARY_BASE_URL}/v${res.version}/${res.public_id}.${res.format}`,
                        description: 'Divine glimpses & spiritual wallpapers.',
                        category: 'Wallpapers' // Default category since we are fetching by tag
                    };
                });

                setPhotos(fetchedPhotos);
            } catch (error) {
                console.error('Error fetching gallery:', error);
                // Fallback can be empty or static list if needed
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, []);

    const filteredPhotos = activeCategory === 'All'
        ? photos
        : photos.filter(p => p.category === activeCategory);

    const handleDownload = async (photo) => {
        setDownloading(photo.id);
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${photo.title.replace(/\s+/g, '_')}.jpg`;
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
                {loading ? (
                    <div className="loading-gallery">
                        <div className="loader-sm" style={{ width: '40px', height: '40px', borderTopColor: '#8B0000', margin: '0 auto' }}></div>
                        <p style={{ marginTop: '20px', color: '#666' }}>Loading divine images...</p>
                    </div>
                ) : filteredPhotos.length === 0 ? (
                    <div className="empty-gallery">
                        <p>No photos found in this category.</p>
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
                                {/* <span className="photo-category">{photo.category}</span> */}
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
                    More photos will automatically appear here as they are added to the cloud.
                </p>
            </div>
        </div>
    );
};

export default PhotoGalleryPage;
