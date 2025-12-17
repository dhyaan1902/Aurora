import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, List, Maximize2 } from 'lucide-react';

export default function PlayerBar({
    currentTrack,
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    currentTime,
    duration,
    onSeek,
    volume,
    onVolumeChange,
    isMuted,
    onMuteToggle,
    shuffle,
    onShuffleToggle,
    repeat,
    onRepeatToggle,
    showQueue,
    setShowQueue,
    onExpand
}) {
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-24 bg-[#121212]/95 border-t border-[#2a2a2a] backdrop-blur-xl flex items-center px-6 fixed bottom-0 left-0 w-full z-50 transition-all duration-300">
            {/* Track Info */}
            <div className="w-1/3 flex items-center gap-4">
                {currentTrack ? (
                    <>
                        <div className="w-16 h-16 rounded-md shadow-lg overflow-hidden relative group border border-[#2a2a2a]">
                            <img
                                src={currentTrack.album?.images?.[0]?.url || '/api/placeholder/64/64'}
                                alt={currentTrack.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-base text-white truncate hover:underline cursor-pointer">{currentTrack.name}</div>
                            <div className="text-sm text-gray-400 truncate hover:text-white cursor-pointer transition-colors">
                                {currentTrack.artists?.map(a => a.name).join(', ')}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-4 opacity-50">
                        <div className="w-16 h-16 bg-[#2a2a2a] rounded-md animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-32 h-4 bg-[#2a2a2a] rounded animate-pulse" />
                            <div className="w-20 h-3 bg-[#2a2a2a] rounded animate-pulse" />
                        </div>
                    </div>
                )}
                <button
                    onClick={onExpand}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors ml-2"
                >
                    <Maximize2 size={18} />
                </button>
            </div>

            {/* Controls */}
            <div className="w-1/3 flex flex-col items-center gap-2">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onShuffleToggle}
                        className={`p-2 rounded-full transition-colors ${shuffle ? 'text-[#fa2d48] bg-[#fa2d48]/10' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Shuffle size={18} />
                    </button>

                    <button onClick={onPrev} className="text-gray-300 hover:text-white transition-colors p-1">
                        <SkipBack size={24} fill="currentColor" />
                    </button>

                    <button
                        onClick={onPlayPause}
                        className="w-12 h-12 flex items-center justify-center bg-white hover:scale-105 active:scale-95 rounded-full text-black transition-all shadow-lg shadow-white/10"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors p-1">
                        <SkipForward size={24} fill="currentColor" />
                    </button>

                    <button
                        onClick={onRepeatToggle}
                        className={`p-2 rounded-full transition-colors relative ${repeat !== 'off' ? 'text-[#fa2d48] bg-[#fa2d48]/10' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Repeat size={18} />
                        {repeat === 'one' && (
                            <span className="absolute top-0 right-0 text-[8px] font-bold bg-[#fa2d48] text-white w-3 h-3 flex items-center justify-center rounded-full">1</span>
                        )}
                    </button>
                </div>

                <div className="w-full max-w-md flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                    <div className="relative flex-1 h-1 group cursor-pointer">
                        <div className="absolute inset-0 bg-[#333] rounded-full"></div>
                        <div
                            className="absolute inset-y-0 left-0 bg-[#fa2d48] rounded-full group-hover:bg-[#ff4d63] transition-colors"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime || 0}
                            onChange={(e) => onSeek(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        />
                    </div>
                    <span className="w-10 tabular-nums">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume & Extras */}
            <div className="w-1/3 flex items-center justify-end gap-4">
                <button
                    onClick={() => setShowQueue(!showQueue)}
                    className={`p-2 rounded-lg transition-colors ${showQueue ? 'text-[#fa2d48] bg-[#fa2d48]/10' : 'text-gray-400 hover:text-white'}`}
                >
                    <List size={20} />
                </button>

                <div className="flex items-center gap-3 w-32 group">
                    <button onClick={onMuteToggle} className="text-gray-400 hover:text-white">
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <div className="relative flex-1 h-1 bg-[#333] rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-white rounded-full"
                            style={{ width: `${isMuted ? 0 : volume}%` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
