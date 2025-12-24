import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { getBooks, incrementBookView } from '../services/namaService';
import './BookReaderPage.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();


const BookReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        loadBook();
    }, [id]);

    const loadBook = async () => {
        try {
            // Fetch all books and find the one (optimize later to fetch single)
            // Ideally we should have getBookById in service. 
            // Reuse getBooks for now or fetch specific.
            const books = await getBooks();
            const found = books.find(b => b.id === id);

            if (found) {
                setBook(found);
                // Increment view count
                incrementBookView(id);
            } else {
                navigate('/books');
            }
        } catch (err) {
            console.error('Error loading book:', err);
        } finally {
            setLoading(false);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const changePage = (offset) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    if (loading) return <div className="reader-loading"><span className="loader"></span></div>;
    if (!book) return null;

    return (
        <div className="book-reader-page" ref={containerRef}>
            {/* Header / Toolbar */}
            <header className="reader-toolbar">
                <button className="btn-icon" onClick={() => navigate('/books')} title="Back to Library">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>

                <div className="book-title-mini">
                    <strong>{book.title}</strong>
                    <span>Page {pageNumber} of {numPages}</span>
                </div>

                <div className="reader-controls">
                    <button className="btn-icon" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} title="Zoom Out">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                    </button>
                    <button className="btn-icon" onClick={() => setScale(s => Math.min(2.5, s + 0.2))} title="Zoom In">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                    </button>
                    <button className="btn-icon" onClick={toggleFullscreen} title="Fullscreen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="reader-content">
                <div className="pdf-container">
                    <Document
                        file={book.file_url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="loader"></div>}
                        error={<div className="error">Failed to load PDF. Check internet or file permission.</div>}
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </Document>
                </div>

                {/* Navigation Overlay Arrows */}
                <button
                    className="nav-arrow prev"
                    disabled={pageNumber <= 1}
                    onClick={previousPage}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>

                <button
                    className="nav-arrow next"
                    disabled={pageNumber >= numPages}
                    onClick={nextPage}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </main>
        </div>
    );
};

export default BookReaderPage;
