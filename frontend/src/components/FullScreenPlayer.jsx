import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Shuffle, Repeat, Volume2, VolumeX } from 'lucide-react';

export default function FullScreenPlayer({
    track,
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    currentTime,
    duration,
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

    useEffect(() => {
        setAnimate(true);
        return () => setAnimate(false);
    }, []);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!track) return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col transition-opacity duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-[-50%] bg-center bg-no-repeat bg-cover blur-[120px] opacity-40 scale-150 transition-all duration-1000"
                    style={{ backgroundImage: `url(${track.album?.images?.[0]?.url})` }}
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content */}
            <div className="relative flex-1 flex flex-col p-8 md:p-12 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    >
                        <ChevronDown size={32} />
                    </button>
                    <div className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Now Playing</div>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Main Body */}
                <div className="flex-1 flex flex-col md:flex-row items-center gap-12 md:gap-24 justify-center">
                    {/* Artwork */}
                    <div className="w-full max-w-md aspect-square relative group">
                        <img
                            src={track.album?.images?.[0]?.url || '/api/placeholder/400/400'}
                            alt={track.name}
                            className={`w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95'}`}
                        />
                    </div>

                    {/* Controls Section */}
                    <div className="w-full max-w-md flex flex-col justify-center gap-8">
                        {/* Track Info */}
                        <div className="space-y-2 text-center md:text-left">
                            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">{track.name}</h1>
                            <p className="text-xl md:text-2xl text-gray-400 font-medium">{track.artists?.map(a => a.name).join(', ')}</p>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-2">{track.album?.name}</p>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="relative h-1.5 bg-white/10 rounded-full group cursor-pointer">
                                <div
                                    className="absolute inset-y-0 left-0 bg-[#fa2d48] rounded-full group-hover:bg-[#ff4d63] transition-colors"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            <div className="flex justify-between text-xs font-medium text-gray-400 tabular-nums">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={onShuffleToggle}
                                className={`p-3 rounded-full transition-colors ${shuffle ? 'text-[#fa2d48] bg-[#fa2d48]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Shuffle size={20} />
                            </button>

                            <div className="flex items-center gap-6">
                                <button onClick={onPrev} className="p-4 rounded-full text-white hover:bg-white/10 transition-colors">
                                    <SkipBack size={32} fill="currentColor" />
                                </button>

                                <button
                                    onClick={onPlayPause}
                                    className="w-20 h-20 flex items-center justify-center bg-white hover:scale-105 active:scale-95 rounded-full text-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                                </button>

                                <button onClick={onNext} className="p-4 rounded-full text-white hover:bg-white/10 transition-colors">
                                    <SkipForward size={32} fill="currentColor" />
                                </button>
                            </div>

                            <button
                                onClick={onRepeatToggle}
                                className={`p-3 rounded-full transition-colors relative ${repeat !== 'off' ? 'text-[#fa2d48] bg-[#fa2d48]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Repeat size={20} />
                                {repeat === 'one' && (
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#fa2d48] rounded-full" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
