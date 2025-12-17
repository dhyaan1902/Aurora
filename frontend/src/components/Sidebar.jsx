import React from 'react';
import { Home, Library, Search, PlusCircle, Trash2, ListMusic } from 'lucide-react';

export default function Sidebar({ view, setView, playlists = [], onCreatePlaylist, onDeletePlaylist, onSelectPlaylist }) {
    const menuItems = [
        { id: 'browse', label: 'Browse', icon: Home },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'library', label: 'Library', icon: Library },
    ];

    return (
        <div className="w-64 h-full bg-[#121212] border-r border-[#2a2a2a] flex flex-col pt-8 pb-24">
            <div className="px-6 mb-8">
                <h1 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Music</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = view === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive
                                    ? 'bg-[#2a2a2a] text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={20} strokeWidth={2} className={isActive ? 'text-[#fa2d48]' : 'text-gray-400 group-hover:text-white'} />
                            {item.label}
                        </button>
                    );
                })}

                <div className="pt-8 px-2">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Playlists</h2>
                        <button onClick={onCreatePlaylist} className="text-gray-500 hover:text-white transition-colors">
                            <PlusCircle size={16} />
                        </button>
                    </div>

                    <div className="space-y-1">
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className="group flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => onSelectPlaylist(playlist)}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <ListMusic size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                                    <span className="truncate">{playlist.name}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeletePlaylist(playlist.id); }}
                                    className="text-gray-600 hover:text-[#fa2d48] opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        {playlists.length === 0 && (
                            <div className="px-3 py-4 text-xs text-gray-600 text-center border-2 border-dashed border-[#2a2a2a] rounded-lg">
                                No playlists yet
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
}
