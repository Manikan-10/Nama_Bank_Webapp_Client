import { useState, useRef } from 'react';
import { uploadBook } from '../services/namaService';
import { useToast } from '../context/ToastContext';
import './BookUpload.css';

const BookUpload = ({ onUploadSuccess }) => {
    const { success, error } = useToast();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [parseError, setParseError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/pdf') {
            error('Please upload a PDF file.');
            return;
        }

        setFile(selectedFile);
        parseFilename(selectedFile.name);
    };

    const parseFilename = (filename) => {
        // Remove extension
        const name = filename.replace(/\.pdf$/i, '');
        const parts = name.split('_');

        // Expected format: Title_Year_Month_Country_City_Language_EditionType
        // Minimum 7 parts
        if (parts.length < 7) {
            setParseError('Filename does not match format: Title_Year_Month_Country_City_Language_EditionType.pdf');
            setMetadata(null);
            return;
        }

        const [title, year, month, country, city, language, ...editionParts] = parts;
        const editionType = editionParts.join('_'); // Join remaining parts if edition has underscores? Or strict 7? 
        // User said: Title_Year_Month_Country_City_Language_EditionType.pdf
        // Let's assume strict structure but be flexible on the last part.

        setMetadata({
            title,
            year,
            month,
            country,
            city,
            language,
            edition_type: editionType
        });
        setParseError('');
    };

    const handleUpload = async () => {
        if (!file || !metadata) return;

        setUploading(true);
        try {
            await uploadBook(file, metadata);
            success('Book uploaded successfully!');
            setFile(null);
            setMetadata(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            console.error('Upload failed:', err);
            error(`Failed to upload: ${err.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="book-upload-container">
            <h3>Upload New Book</h3>
            <div className="upload-instructions">
                <p><strong>Naming Convention:</strong> <code>Title_Year_Month_Country_City_Language_EditionType.pdf</code></p>
                <p className="example-text">Example: <code>NamaSankalpa_2025_November_UK_London_English_Monthly.pdf</code></p>
            </div>

            <div className={`drop-zone ${file ? 'has-file' : ''}`}>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="file-input"
                    id="book-file-input"
                />
                <label htmlFor="book-file-input" className="file-label">
                    {file ? (
                        <div className="file-selected">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                            <span>{file.name}</span>
                        </div>
                    ) : (
                        <div className="upload-prompt">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            <span>Click to upload PDF</span>
                        </div>
                    )}
                </label>
            </div>

            {parseError && (
                <div className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {parseError}
                </div>
            )}

            {metadata && (
                <div className="metadata-preview">
                    <h4>Extracted Details</h4>
                    <div className="metadata-grid">
                        <div className="meta-item"><label>Title:</label> <span>{metadata.title}</span></div>
                        <div className="meta-item"><label>Year:</label> <span>{metadata.year}</span></div>
                        <div className="meta-item"><label>Month:</label> <span>{metadata.month}</span></div>
                        <div className="meta-item"><label>Country:</label> <span>{metadata.country}</span></div>
                        <div className="meta-item"><label>City:</label> <span>{metadata.city}</span></div>
                        <div className="meta-item"><label>Language:</label> <span>{metadata.language}</span></div>
                        <div className="meta-item"><label>Type:</label> <span>{metadata.edition_type}</span></div>
                    </div>

                    <button
                        className="btn btn-primary full-width"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookUpload;
