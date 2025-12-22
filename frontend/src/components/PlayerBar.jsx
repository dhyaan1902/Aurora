import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, List, Maximize2, ListPlus, Download } from 'lucide-react';

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
    onExpand,
    onAddToPlaylist,
    onDownload,
    onAlbumClick  // New prop for clicking album art
}) {
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-24 bg-black/95 border-t border-white/5 backdrop-blur-2xl flex items-center px-6 fixed bottom-0 left-0 w-full z-50 transition-all duration-300">
            {/* Track Info */}
            <div className="w-1/3 flex items-center gap-4">
                {currentTrack ? (
                    <>
                        <div
                            onClick={onAlbumClick}
                            className="w-14 h-14 rounded shadow-lg overflow-hidden relative group border border-white/10 cursor-pointer hover:border-[var(--mac-accent)] transition-all"
                            title="View Album"
                        >
                            <img
                                src={currentTrack.album?.images?.[0]?.url || '/api/placeholder/64/64'}
                                alt={currentTrack.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div
                                onClick={onExpand}
                                className="font-bold text-sm text-white truncate hover:text-[var(--mac-accent)] cursor-pointer transition-colors"
                                title={currentTrack.name}
                            >
                                {currentTrack.name}
                            </div>
                            <div
                                onClick={onAlbumClick}
                                className="text-[11px] text-gray-400 truncate hover:text-white cursor-pointer transition-colors mt-0.5 font-bold"
                                title={`${currentTrack.artists?.map(a => a.name).join(', ')} - ${currentTrack.album?.name || 'Album'}`}
                            >
                                {currentTrack.artists?.map(a => a.name).join(', ')}
                            </div>
                        </div>
                        <button
                            onClick={onAddToPlaylist}
                            className="p-2 text-gray-400 hover:text-[var(--mac-accent)] hover:bg-white/5 rounded-full transition-all"
                            title="Add to Playlist"
                        >
                            <ListPlus size={20} />
                        </button>
                        <button
                            onClick={onDownload}
                            className="p-2 text-gray-400 hover:text-[var(--mac-accent)] hover:bg-white/5 rounded-full transition-all"
                            title="Download Track"
                        >
                            <Download size={20} />
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-4 opacity-30">
                        <div className="w-14 h-14 bg-white/10 rounded animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-32 h-3 bg-white/10 rounded animate-pulse" />
                            <div className="w-20 h-2 bg-white/10 rounded animate-pulse" />
                        </div>
                    </div>
                )}
                <button
                    onClick={onExpand}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all ml-2"
                    title="Expand Player"
                >
                    <Maximize2 size={16} />
                </button>
            </div>

            {/* Controls */}
            <div className="w-1/3 flex flex-col items-center gap-2">
                <div className="flex items-center gap-5">
                    <button
                        onClick={onShuffleToggle}
                        className={`p-1.5 rounded-full transition-colors ${shuffle ? 'text-[var(--mac-accent)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Shuffle size={16} />
                    </button>

                    <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors p-1">
                        <SkipBack size={20} fill="currentColor" />
                    </button>

                    <button
                        onClick={onPlayPause}
                        className="w-10 h-10 flex items-center justify-center bg-white hover:scale-105 active:scale-95 rounded-full text-black transition-all shadow-xl"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors p-1">
                        <SkipForward size={20} fill="currentColor" />
                    </button>

                    <button
                        onClick={onRepeatToggle}
                        className={`p-1.5 rounded-full transition-colors relative ${repeat !== 'off' ? 'text-[var(--mac-accent)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Repeat size={16} />
                        {repeat === 'one' && (
                            <span className="absolute top-0 right-0 text-[7px] font-bold bg-[var(--mac-accent)] text-black w-2.5 h-2.5 flex items-center justify-center rounded-full">1</span>
                        )}
                    </button>
                </div>

                <div className="w-full max-w-md flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                    <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                    <div className="relative flex-1 h-1 group cursor-pointer">
                        <div className="absolute inset-0 bg-white/10 rounded-full"></div>
                        <div
                            className="absolute inset-y-0 left-0 bg-[var(--mac-accent)] rounded-full group-hover:bg-[var(--mac-accent)] transition-colors"
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
                            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        />
                    </div>
                    <span className="w-10 tabular-nums">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume & Extras */}
            <div className="w-1/3 flex items-center justify-end gap-3">
                <button
                    onClick={() => setShowQueue(!showQueue)}
                    className={`p-2 rounded-lg transition-colors ${showQueue ? 'text-[var(--mac-accent)] bg-white/5' : 'text-gray-400 hover:text-white'}`}
                >
                    <List size={18} />
                </button>

                <div className="flex items-center gap-2 w-28 group">
                    <button onClick={onMuteToggle} className="text-gray-400 hover:text-white">
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-white group-hover:bg-[var(--mac-accent)] transition-colors"
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
