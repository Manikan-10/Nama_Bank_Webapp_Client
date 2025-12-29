import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitNamaEntry } from '../services/namaService';
import './AudioPlayerPage.css';

// 5 Audio files from Cloudinary
const AUDIO_FILES = [
    { id: 1, title: 'Amruthathara', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1767022775/Amruthathara_lcllo2.mp3' },
    { id: 2, title: 'Bhagawans Voice', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1767022775/BhagawansVoice_nxegdl.mp3' },
    { id: 3, title: 'Bhagawans Voice 2', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1767022774/BhagawansVoice2_uqmccp.mp3' },
    { id: 4, title: 'Bhagawans Voice 3', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1767022775/BhagawansVoice3_hs7klo.mp3' },
    { id: 5, title: 'Ma Devaki', src: 'https://res.cloudinary.com/dipqvcj8t/video/upload/v1767022775/MaDevaki_kdkcpe.mp3' }
];

const AudioPlayerPage = () => {
    const { user, linkedAccounts } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();
    const audioRef = useRef(null);
    const simulationRef = useRef(null);

    // Audio state
    const [selectedAudio, setSelectedAudio] = useState(AUDIO_FILES[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [loopCount, setLoopCount] = useState(0);
    const [namaCount, setNamaCount] = useState(0);

    // Submission state
    const [selectedAccount, setSelectedAccount] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (linkedAccounts.length > 0 && !selectedAccount) {
            setSelectedAccount(linkedAccounts[0].id);
        }
    }, [user, linkedAccounts, navigate, selectedAccount]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (simulationRef.current) {
                clearInterval(simulationRef.current);
            }
        };
    }, []);

    // Attach ended event listener to audio element
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            console.log('Audio ended - incrementing count');
            setLoopCount(prev => prev + 1);
            setNamaCount(prev => prev + 4);
            // Restart the audio for continuous loop
            if (isPlaying) {
                audio.currentTime = 0;
                audio.play().catch(err => console.log('Replay failed:', err));
            }
        };

        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
    }, [isPlaying]);

    // Handle audio loop completion
    const handleAudioEnded = () => {
        setLoopCount(prev => prev + 1);
        setNamaCount(prev => prev + 4);

        if (audioRef.current && isPlaying) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    };

    // Start simulation for demo
    const startSimulation = () => {
        if (simulationRef.current) {
            clearInterval(simulationRef.current);
        }
        simulationRef.current = setInterval(() => {
            setLoopCount(prev => prev + 1);
            setNamaCount(prev => prev + 4);
        }, 5000);
    };

    // Stop simulation
    const stopSimulation = () => {
        if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
        }
    };

    const handlePlay = (audio) => {
        // Reset if switching audio
        if (selectedAudio.id !== audio.id) {
            setLoopCount(0);
            setNamaCount(0);
        }

        setSelectedAudio(audio);
        setIsPlaying(true);
        setIsPaused(false);

        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.src = audio.src;
                audioRef.current.play().catch(err => {
                    console.log('Audio play failed, using simulation');
                    startSimulation();
                });
            }
        }, 0);
    };

    const handlePause = () => {
        setIsPlaying(false);
        setIsPaused(true);
        stopSimulation();
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const handleResume = () => {
        setIsPlaying(true);
        setIsPaused(false);
        if (audioRef.current) {
            audioRef.current.play().catch(() => {
                startSimulation();
            });
        }
    };

    const handleStop = () => {
        setIsPlaying(false);
        setIsPaused(false);
        stopSimulation();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleSubmit = async () => {
        if (!selectedAccount) {
            error('Please select a Nama Bank account.');
            return;
        }

        if (namaCount === 0) {
            error('No Namas to submit. Play audio first.');
            return;
        }

        setLoading(true);
        handleStop();

        try {
            await submitNamaEntry(user.id, selectedAccount, namaCount, 'audio');
            success(`${namaCount} Namas submitted via Audio! Hari Om 🙏`);
            setLoopCount(0);
            setNamaCount(0);
        } catch (err) {
            error('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="audio-page page-enter">
            <header className="page-header">
                <div className="container">
                    <Link to="/dashboard" className="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Dashboard
                    </Link>
                    <h1>Nama Audio</h1>
                    <p>Play & Auto Count - Chant along with the audio</p>
                </div>
            </header>

            <main className="audio-main">
                <div className="container">
                    <div className="audio-layout">
                        {/* Audio List */}
                        <div className="audio-list-section">
                            <h2>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18V5l12-2v13" />
                                    <circle cx="6" cy="18" r="3" />
                                    <circle cx="18" cy="16" r="3" />
                                </svg>
                                Audio Files
                            </h2>
                            <div className="audio-list">
                                {AUDIO_FILES.map(audio => (
                                    <div
                                        key={audio.id}
                                        className={`audio-item ${selectedAudio.id === audio.id ? 'active' : ''} ${selectedAudio.id === audio.id && isPlaying ? 'playing' : ''}`}
                                    >
                                        <div className="audio-item-info">
                                            <span className="audio-number">{audio.id}</span>
                                            <span className="audio-title">{audio.title}</span>
                                        </div>
                                        <div className="audio-item-controls">
                                            {/* Play Button */}
                                            <button
                                                className={`control-btn play-btn ${selectedAudio.id === audio.id && isPlaying ? 'disabled' : ''}`}
                                                onClick={() => {
                                                    if (selectedAudio.id === audio.id && isPaused) {
                                                        handleResume();
                                                    } else {
                                                        handlePlay(audio);
                                                    }
                                                }}
                                                disabled={selectedAudio.id === audio.id && isPlaying}
                                                title="Play"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                            </button>

                                            {/* Pause Button */}
                                            <button
                                                className={`control-btn pause-btn ${!(selectedAudio.id === audio.id && isPlaying) ? 'disabled' : ''}`}
                                                onClick={handlePause}
                                                disabled={!(selectedAudio.id === audio.id && isPlaying)}
                                                title="Pause"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <rect x="6" y="4" width="4" height="16" />
                                                    <rect x="14" y="4" width="4" height="16" />
                                                </svg>
                                            </button>

                                            {/* Stop Button */}
                                            <button
                                                className={`control-btn stop-btn ${!(selectedAudio.id === audio.id && (isPlaying || isPaused)) ? 'disabled' : ''}`}
                                                onClick={handleStop}
                                                disabled={!(selectedAudio.id === audio.id && (isPlaying || isPaused))}
                                                title="Stop"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <rect x="6" y="6" width="12" height="12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Counter & Submit Section */}
                        <div className="counter-section">
                            {/* Currently Playing */}
                            <div className="now-playing">
                                <span className="now-playing-label">NOW PLAYING</span>
                                <span className="now-playing-title">{selectedAudio.title}</span>
                                {isPlaying && (
                                    <div className="playing-indicator">
                                        <span className="bar"></span>
                                        <span className="bar"></span>
                                        <span className="bar"></span>
                                        <span className="bar"></span>
                                    </div>
                                )}
                                {isPaused && <span className="paused-badge">PAUSED</span>}
                            </div>

                            {/* Live Counter */}
                            <div className="live-counter">
                                <div className="counter-display">
                                    <div className="counter-value">{namaCount}</div>
                                    <div className="counter-label">Namas Counted</div>
                                </div>
                                <div className="loop-info">
                                    <span className="loop-count">{loopCount} loops completed</span>
                                    <span className="loop-note">+4 Namas per loop</span>
                                </div>
                            </div>

                            {/* Account Selector */}
                            <div className="account-selector">
                                <label className="form-label">Select Nama Bank Account</label>
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="form-input form-select"
                                >
                                    {linkedAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                className="btn btn-primary btn-lg w-full"
                                onClick={handleSubmit}
                                disabled={loading || namaCount === 0}
                            >
                                {loading ? (
                                    <>
                                        <span className="loader loader-sm"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Submit {namaCount} Namas
                                    </>
                                )}
                            </button>

                            {/* Info Note */}
                            <div className="audio-info">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <p>Audio loops continuously. Each loop adds <strong>+4</strong> to your count. Stop when done and submit!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                loop={false}
                crossOrigin="anonymous"
                preload="auto"
            />
        </div>
    );
};

export default AudioPlayerPage;
