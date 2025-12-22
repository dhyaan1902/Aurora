import React, { useState, useEffect } from 'react';
import { X, Plus, Music } from 'lucide-react';

export default function CreatePlaylistModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name);
        setName('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--mac-accent)]/20 text-[var(--mac-accent)]">
                            <Music size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">New Playlist</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        autoFocus
                        type="text"
                        placeholder="My Awesome Playlist"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg mb-6 border border-transparent focus:border-[var(--mac-accent)] focus:outline-none transition-colors"
                    />

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-black bg-[var(--mac-accent)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                        >
                            Create Playlist
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
