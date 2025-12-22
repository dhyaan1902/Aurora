import React from 'react';
import { Home, Library, Search, PlusCircle, Trash2, ListMusic, Star } from 'lucide-react';


export default function Sidebar({ view, setView, playlists = [], onCreatePlaylist, onDeletePlaylist, onSelectPlaylist }) {
    const menuItems = [
        { id: 'browse', label: 'Browse', icon: Home },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'favorites', label: 'Favorites', icon: Star },
        { id: 'library', label: 'Library', icon: Library },
    ];


    return (
        <div className="w-64 h-full bg-black flex flex-col gap-2 p-2 pb-24 border-r border-white/5 no-select">
            {/* Main Navigation Block */}
            <div className="bg-[#121212] rounded-lg p-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = view === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-4 px-3 py-3 rounded-md text-sm font-bold transition-all duration-200 ${isActive
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white transition-colors'
                                }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-white' : 'text-gray-400'} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Library / Playlists Block */}
            <div className="flex-1 bg-[#121212] rounded-lg flex flex-col overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer group">
                        <Library size={24} className="group-hover:text-white" />
                        <span className="font-bold text-sm tracking-tight text-gray-400 group-hover:text-white">Your Library</span>
                    </div>
                    <button
                        onClick={onCreatePlaylist}
                        className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        title="Create playlist"
                    >
                        <PlusCircle size={20} />
                    </button>
                </div>

                <div className="flex-1 px-2 pb-4 overflow-y-auto custom-scrollbar space-y-0.5">
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            className={`group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-all ${view === `playlist:${playlist.id}` ? 'bg-white/10' : ''}`}
                            onClick={() => onSelectPlaylist(playlist)}
                        >
                            <div className="w-12 h-12 rounded bg-[#282828] flex items-center justify-center text-gray-400 flex-shrink-0 shadow-inner group-hover:text-white transition-colors font-bold text-lg">
                                {playlist.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold truncate ${view === `playlist:${playlist.id}` ? 'text-[var(--mac-accent)]' : 'text-white'}`}>
                                    {playlist.name}
                                </div>
                                <div className="text-xs text-secondary truncate">Playlist • {playlist.tracks.length} songs</div>
                            </div>
                        </div>
                    ))}

                    {playlists.length === 0 && (
                        <div className="mt-8 px-4 text-center">
                            <div className="bg-[#242424] p-6 rounded-xl space-y-4">
                                <div className="text-sm font-bold text-white">Create your first playlist</div>
                                <div className="text-xs text-gray-400">It's easy, we'll help you</div>
                                <button
                                    onClick={onCreatePlaylist}
                                    className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 transition-transform"
                                >
                                    Create playlist
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
