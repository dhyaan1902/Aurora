import { Play, Plus, ListPlus, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const TrackRow = ({ track, index, onPlay, isActive, onAddToQueue, onAddToPlaylist, isStarred, onToggleFavorite }) => (
    <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors cursor-default ${isActive ? 'bg-white/5' : ''}`}
        onDoubleClick={() => onPlay(track)}
    >
        {/* Drag Handle (Dots) */}
        <div className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-600 hover:text-gray-400">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="4" cy="4" r="1.5" />
                <circle cx="4" cy="8" r="1.5" />
                <circle cx="4" cy="12" r="1.5" />
                <circle cx="8" cy="4" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="12" r="1.5" />
            </svg>
        </div>

        <div className="w-8 flex justify-center text-sm text-[#a1a1aa] font-medium">
            {isActive ? (
                <div className="w-2 h-2 bg-[var(--mac-accent)] rounded-full" />
            ) : (
                <span className="group-hover:hidden">{index + 1}</span>
            )}
            {!isActive && (
                <button onClick={() => onPlay(track)} className="hidden group-hover:block text-white">
                    <Play size={14} fill="currentColor" />
                </button>
            )}
        </div>

        <img
            src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || track.images?.[0]?.url}
            alt={track.name}
            className="w-10 h-10 rounded shadow object-cover flex-shrink-0"
            onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23333"/%3E%3C/svg%3E';
            }}
        />

        <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${isActive ? 'text-[var(--mac-accent)]' : 'text-gray-100'}`}>
                {track.name}
            </div>
            <div className="text-xs text-gray-400 truncate group-hover:text-gray-300">
                {track.artists?.map(a => a.name).join(', ')}
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(track); }}
                className={`transition-all ${isStarred ? 'text-[var(--mac-accent)] opacity-100 scale-110' : 'text-gray-500 hover:text-white opacity-0 group-hover:opacity-100'}`}
            >
                <Star size={16} fill={isStarred ? "currentColor" : "none"} />
            </button>

            <div className="text-xs text-gray-500 font-medium w-10 text-right group-hover:hidden">
                {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '—'}
            </div>

            <div className="hidden group-hover:flex items-center gap-1">
                <button onClick={() => onAddToQueue(track)} title="Add to Queue" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                    <Plus size={16} />
                </button>
                <button onClick={() => onAddToPlaylist && onAddToPlaylist(track)} title="Add to Playlist" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                    <ListPlus size={16} />
                </button>
            </div>
        </div>
    </motion.div>
);

export const MediaCard = ({ title, subtitle, imageUrl, onClick, onPlay, isStarred, onToggleFavorite, type = 'track' }) => (
    <motion.div
        className="group relative flex flex-col gap-3 p-4 rounded-lg bg-[#181818]/60 hover:bg-[#282828] transition-all duration-300 cursor-pointer"
        onClick={onClick}
    >
        <div className={`relative aspect-square rounded-md overflow-hidden bg-[#242424] shadow-lg ${type === 'artist' ? 'rounded-full' : ''}`}>
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <span className="text-4xl text-gray-600">?</span>
                </div>
            )}

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="absolute top-3 left-3 flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(); }}
                    className={`p-1.5 rounded-full bg-black/40 backdrop-blur-md transition-all ${isStarred ? 'text-[var(--mac-accent)] opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white'}`}
                >
                    <Star size={16} fill={isStarred ? "currentColor" : "none"} />
                </button>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className="absolute bottom-3 right-3 w-12 h-12 bg-[var(--mac-accent)] rounded-full shadow-2xl flex items-center justify-center text-black opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
            >
                <Play size={24} fill="currentColor" className="ml-1" />
            </button>
        </div>

        <div className="min-h-[44px]">
            <h3 className="font-bold text-white text-sm truncate mb-1 group-hover:underline">{title}</h3>
            <p className="text-xs text-gray-400 font-bold truncate transition-colors leading-relaxed">{subtitle}</p>
        </div>
    </motion.div>
);

export const SkeletonCard = () => (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-white/[0.02] animate-pulse">
        <div className="aspect-square rounded-md bg-white/5" />
        <div className="h-4 w-3/4 bg-white/5 rounded mt-1" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
    </div>
);

export const SkeletonRow = () => (
    <div className="flex items-center gap-3 px-3 py-2 animate-pulse">
        <div className="w-8 h-4 bg-white/5 rounded" />
        <div className="w-10 h-10 bg-white/5 rounded" />
        <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-white/5 rounded" />
            <div className="h-3 w-1/4 bg-white/5 rounded" />
        </div>
        <div className="w-12 h-4 bg-white/5 rounded" />
    </div>
);

