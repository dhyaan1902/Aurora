import React from 'react';
import { Play, Plus, MoreHorizontal } from 'lucide-react';

export const TrackRow = ({ track, index, onPlay, isActive, onAddToQueue, onAddToPlaylist }) => (
    <div
        className={`group flex items-center gap-3 px-4 py-2 rounded-md hover:bg-white/5 transition-colors cursor-default ${isActive ? 'bg-white/10' : ''}`}
        onDoubleClick={() => onPlay(track)}
    >
        <div className="w-8 text-right text-sm text-gray-500 font-medium group-hover:hidden">
            {isActive ? (
                <div className="w-3 h-3 mx-auto bg-[#fa2d48] rounded-full animate-pulse" />
            ) : (
                index + 1
            )}
        </div>
        <div className="w-8 flex justify-center hidden group-hover:flex">
            <button onClick={() => onPlay(track)} className="text-white hover:text-[#fa2d48]">
                <Play size={14} fill="currentColor" />
            </button>
        </div>

        {/* ADD THIS - Album Cover */}
        <img
            src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || track.images?.[0]?.url}
            alt={track.name}
            className="w-10 h-10 rounded object-cover flex-shrink-0"
            onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23333"/%3E%3C/svg%3E';
            }}
        />

        <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${isActive ? 'text-[#fa2d48]' : 'text-gray-100'}`}>
                {track.name}
            </div>
            <div className="text-xs text-gray-500 truncate group-hover:text-gray-400">
                {track.artists?.map(a => a.name).join(', ')}
            </div>
        </div>

        <div className="text-sm text-gray-500 group-hover:hidden">
            {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '—'}
        </div>

        <div className="hidden group-hover:flex items-center gap-2">
            <button onClick={() => onAddToQueue(track)} title="Add to Queue" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded shadow-sm transition-colors">
                <Plus size={16} />
            </button>
            <button onClick={() => onAddToPlaylist && onAddToPlaylist(track)} title="Add to Playlist" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded shadow-sm transition-colors">
                <MoreHorizontal size={16} />
            </button>
        </div>
    </div>
);

export const MediaCard = ({ title, subtitle, imageUrl, onClick, onPlay }) => (
    <div
        className="group relative flex flex-col gap-3 p-3 rounded-xl hover:bg-[#1a1a1a] transition-colors cursor-pointer"
        onClick={onClick}
    >
        <div className="relative aspect-square rounded-lg overflow-hidden bg-[#2a2a2a] shadow-lg border border-[#2a2a2a]">
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <span className="text-4xl text-gray-600">?</span>
                </div>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className="absolute bottom-3 right-3 w-12 h-12 bg-[#fa2d48] rounded-full shadow-xl flex items-center justify-center text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
            >
                <Play size={24} fill="currentColor" className="ml-1" />
            </button>
        </div>

        <div>
            <h3 className="font-semibold text-white text-sm truncate">{title}</h3>
            <p className="text-xs text-gray-500 truncate group-hover:text-gray-400 transition-colors">{subtitle}</p>
        </div>
    </div>
);
