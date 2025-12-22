import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Shuffle, Repeat, Mic } from 'lucide-react';

export default function FullScreenPlayer({
    track,
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    currentTime = 0,
    duration = 0,
    onSeek,
    onClose,
    volume,
    onVolumeChange,
    shuffle,
    onShuffleToggle,
    repeat,
    onRepeatToggle
}) {
    const [animate, setAnimate] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyrics, setLyrics] = useState(null);
    const [loadingLyrics, setLoadingLyrics] = useState(false);
    const [hasTimestamps, setHasTimestamps] = useState(false);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const lyricsScrollRef = useRef(null);
    const activeLyricRef = useRef(null);
    const lastScrollTime = useRef(0);

    useEffect(() => {
        setAnimate(true);
        return () => setAnimate(false);
    }, []);

    useEffect(() => {
        if (showLyrics && track?.id) {
            fetchLyrics();
        }
    }, [track?.id, showLyrics]);

    // Calculate current lyric index efficiently
    useEffect(() => {
        if (!hasTimestamps || !lyrics || lyrics.length === 0) {
            setCurrentLyricIndex(-1);
            return;
        }

        let newIndex = -1;
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].start) {
                newIndex = i;
                break;
            }
        }

        setCurrentLyricIndex(newIndex);
    }, [currentTime, hasTimestamps, lyrics]);

    // Smooth scroll with optimized throttling
    useEffect(() => {
        if (!showLyrics || !hasTimestamps || currentLyricIndex === -1) return;
        if (!lyricsScrollRef.current || !activeLyricRef.current) return;

        const now = Date.now();
        if (now - lastScrollTime.current < 150) return; // Throttle to 150ms for smoother performance
        lastScrollTime.current = now;

        // Use requestAnimationFrame for smooth 60fps scrolling
        requestAnimationFrame(() => {
            if (activeLyricRef.current && lyricsScrollRef.current) {
                activeLyricRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        });
    }, [currentLyricIndex, showLyrics, hasTimestamps]);

    const API_BASE = 'http://localhost:4000';

    const fetchLyrics = async () => {
        if (!track?.id) return;

        setLoadingLyrics(true);
        setLyrics(null);
        setHasTimestamps(false);
        try {
            const res = await fetch(`${API_BASE}/lyrics/${track.id}`);
            if (!res.ok) throw new Error('Lyrics not found');

            const data = await res.json();
            if (data.lyrics && Array.isArray(data.lyrics) && data.lyrics.length > 0) {
                setLyrics(data.lyrics);
                // Check if lyrics have timestamps
                setHasTimestamps(typeof data.lyrics[0].start === 'number');
            } else {
                setLyrics(null);
            }
        } catch (err) {
            console.error('Failed to fetch lyrics:', err);
            setLyrics(null);
        } finally {
            setLoadingLyrics(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!track) return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-black flex flex-col transition-opacity duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-[-50%] bg-center bg-no-repeat bg-cover blur-[140px] opacity-20 scale-150 transition-all duration-1000"
                    style={{ backgroundImage: `url(${track.album?.images?.[0]?.url || track.images?.[0]?.url})` }}
                />
            </div>

            {/* Content */}
            <div className="relative flex-1 flex flex-col p-8 md:p-12 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronDown size={28} />
                    </button>
                    <div className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase">Now Playing</div>
                    <button
                        onClick={() => setShowLyrics(!showLyrics)}
                        className={`p-2 rounded-full transition-colors ${showLyrics ? 'text-[var(--mac-accent)] bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Lyrics"
                    >
                        <Mic size={24} />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex flex-col md:flex-row items-center gap-8 md:gap-16 justify-center overflow-hidden px-4 md:px-0">
                    {/* Lyrics Section */}
                    {showLyrics && (
                        <div
                            className="w-full md:w-[60%] h-[50vh] md:h-[70vh] overflow-y-auto pl-0 pr-12"
                            ref={lyricsScrollRef}
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                                scrollbarGutter: 'stable',
                                scrollBehavior: 'smooth',
                                transform: 'translateZ(0)', // Hardware acceleration
                                WebkitOverflowScrolling: 'touch' // Smooth scrolling on mobile
                            }}
                        >
                            {loadingLyrics ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <div className="animate-pulse text-2xl font-bold text-gray-500">Loading lyrics...</div>
                                </div>
                            ) : lyrics && lyrics.length > 0 ? (
                                <div className="space-y-8 py-20">
                                    {lyrics.map((line, i) => {
                                        const isActive = i === currentLyricIndex;
                                        const isPast = i < currentLyricIndex;
                                        const isFuture = i > currentLyricIndex;

                                        return (
                                            <div
                                                key={`lyric-${i}`}
                                                ref={isActive ? activeLyricRef : null}
                                                style={{
                                                    willChange: isActive ? 'transform, opacity' : 'auto',
                                                    transform: hasTimestamps
                                                        ? `translateZ(0) scale(${isActive ? 1.4 : 0.7})`
                                                        : 'translateZ(0)',
                                                    transformOrigin: 'left center',
                                                    backfaceVisibility: 'hidden',
                                                    WebkitFontSmoothing: 'antialiased',
                                                    opacity: hasTimestamps
                                                        ? (isActive ? 1 : isPast ? 0.35 : 0.5)
                                                        : 0.7
                                                }}
                                                className={`
                                                    transition-all duration-700 ease-in-out break-words max-w-full
                                                    ${hasTimestamps
                                                        ? 'text-xl md:text-2xl font-bold leading-relaxed'
                                                        : 'text-base md:text-xl font-medium leading-relaxed'
                                                    }
                                                    ${isActive ? 'text-white font-black' : isPast ? 'text-white/40' : 'text-white/60'}
                                                    ${hasTimestamps && line.start !== undefined ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200' : ''}
                                                `}
                                                onClick={hasTimestamps && line.start !== undefined ? () => onSeek(line.start) : undefined}
                                            >
                                                {line.text}
                                            </div>
                                        );
                                    })}
                                    <div className="h-[40vh]" /> {/* Bottom padding for scroll */}
                                    {!hasTimestamps && (
                                        <div className="text-xs text-gray-600 italic text-center">
                                            Synced lyrics not available
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <div className="text-xl font-bold text-gray-600">Lyrics not available</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Artwork (only show when lyrics are hidden) */}
                    {!showLyrics && (
                        <div className="w-full md:w-auto max-w-md aspect-square relative group">
                            <img
                                src={track.album?.images?.[0]?.url || track.images?.[0]?.url || '/api/placeholder/400/400'}
                                alt={track.name}
                                className={`w-full h-full object-cover rounded shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-1000 ${isPlaying ? 'scale-100' : 'scale-95'}`}
                            />
                        </div>
                    )}

                    {/* Controls Section */}
                    <div className={`w-full md:w-[35%] max-w-md flex flex-col justify-center gap-10 ${showLyrics ? 'hidden md:flex' : 'flex'}`}>
                        {/* Track Info */}
                        <div className="space-y-3 text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter break-words">
                                {track.name}
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-400 font-medium break-words">
                                {track.artists?.map(a => a.name).join(', ')}
                            </p>
                        </div>

                        {/* Progress */}
                        <div className="space-y-3">
                            <div className="relative h-1 bg-white/10 rounded-full group cursor-pointer">
                                <div
                                    className="absolute inset-y-0 left-0 bg-[var(--mac-accent)] rounded-full transition-colors"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime || 0}
                                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 tabular-nums uppercase tracking-wider">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={onShuffleToggle}
                                className={`p-3 rounded-full transition-colors ${shuffle ? 'text-[var(--mac-accent)] scale-110' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Shuffle size={20} />
                            </button>

                            <div className="flex items-center gap-8">
                                <button onClick={onPrev} className="text-white/80 hover:text-white transition-colors">
                                    <SkipBack size={32} fill="currentColor" />
                                </button>

                                <button
                                    onClick={onPlayPause}
                                    className="w-16 h-16 flex items-center justify-center bg-white hover:scale-110 active:scale-95 rounded-full text-black transition-all shadow-2xl"
                                >
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                </button>

                                <button onClick={onNext} className="text-white/80 hover:text-white transition-colors">
                                    <SkipForward size={32} fill="currentColor" />
                                </button>
                            </div>

                            <button
                                onClick={onRepeatToggle}
                                className={`p-3 rounded-full transition-colors relative ${repeat !== 'off' ? 'text-[var(--mac-accent)] scale-110' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Repeat size={20} />
                                {repeat === 'one' && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--mac-accent)] rounded-full border-2 border-black" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>v
            </div>
        </div>
    );
}