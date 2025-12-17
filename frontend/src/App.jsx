import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import FullScreenPlayer from './components/FullScreenPlayer';
import { TrackRow, MediaCard } from './components/UI';

const API_BASE = 'http://localhost:4000';

export default function MusicPlayer() {
  // State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
  const [view, setView] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [feedSections, setFeedSections] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [album, setAlbum] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState(null);
  const [playlists, setPlaylists] = useState([]); // Real playlists

  const audioRef = useRef(null);
  const originalQueueRef = useRef([]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume / 100;

    audioRef.current.addEventListener('timeupdate', () => {
      setCurrentTime(audioRef.current.currentTime);
    });

    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current.duration);
    });

    audioRef.current.addEventListener('ended', () => {
      handleTrackEnd();
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Load feed and playlists on mount
  useEffect(() => {
    fetchFeed();
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (view.startsWith('album:')) {
      const albumId = view.split(':')[1];
      setAlbum(null); // Reset album when switching
      fetch(`${API_BASE}/browse/album/${albumId}`)
        .then(res => res.json())
        .then(data => setAlbum(data))
        .catch(err => console.error('Failed to fetch album', err));
    }
  }, [view]);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${API_BASE}/playlists`);
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  const createPlaylist = async () => {
    const name = prompt('Enter playlist name:');
    if (!name) return;

    try {
      const res = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tracks: [] })
      });
      const newPlaylist = await res.json();
      setPlaylists([newPlaylist, ...playlists]);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const deletePlaylist = async (id) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await fetch(`${API_BASE}/playlists/${id}`, { method: 'DELETE' });
      setPlaylists(playlists.filter(p => p.id !== id));
      if (view === `playlist:${id}`) setView('browse');
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const addToPlaylist = async (playlistId, track) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      // Check for duplicates
      if (playlist.tracks.some(t => t.id === track.id)) {
        alert('Track already in playlist');
        return;
      }

      const updatedTracks = [...playlist.tracks, track];

      await fetch(`${API_BASE}/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlist.name, tracks: updatedTracks })
      });

      // Update local state
      setPlaylists(playlists.map(p =>
        p.id === playlistId ? { ...p, tracks: updatedTracks } : p
      ));

      setShowPlaylistModal(false);
      setTrackToAdd(null);
    } catch (err) {
      console.error('Failed to update playlist:', err);
    }
  };

  const fetchFeed = async () => {
    try {
      setLoading(true);

      // 1. Fetch History for Personalization
      let seedTracks = '';
      try {
        const histRes = await fetch(`${API_BASE}/browse/history`);
        const histData = await histRes.json();
        if (histData.history && histData.history.length > 0) {
          seedTracks = histData.history.map(h => h.spotifyTrackId).join(',');
        }
      } catch (e) { console.warn('History fetch failed', e); }

      // 2. Fetch Feed Content
      const res = await fetch(`${API_BASE}/feed`);
      const data = await res.json();

      let feed = data.feed || [];

      // 3. Inject Recommendations if seed tracks exist
      if (seedTracks) {
        try {
          const recRes = await fetch(`${API_BASE}/browse/recommendations?limit=10&seed_tracks=${seedTracks}`);
          const recData = await recRes.json();
          if (recData.tracks && recData.tracks.length > 0) {
            feed.unshift({
              section: 'Based on your listening',
              tracks: recData.tracks
            });
          }
        } catch (e) { console.warn('Recs fetch failed', e); }
      }

      // Shuffle logic
      feed = feed.map(section => {
        if (!section.items && !section.tracks) return section;

        const items = section.items ? [...section.items] : [...section.tracks];
        // Fisher-Yates shuffle
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }

        return {
          ...section,
          [section.items ? 'items' : 'tracks']: items
        };
      });

      setFeedSections(feed);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.tracks || []);
      setView('search');
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (track, newQueue = null) => {
    setLoading(true);

    try {
      let trackToPlay = track;
      let effectiveQueue = newQueue;

      // Handle Album: Open Album View
      if (track.type === 'album') {
        setView(`album:${track.id}`);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyTrackId: trackToPlay.id })
      });

      const data = await res.json();

      if (data.streamUrl) {
        audioRef.current.src = data.streamUrl;
        audioRef.current.play();
        setIsPlaying(true);
        setCurrentTrack({ ...trackToPlay, metadata: data.metadata });

        if (effectiveQueue) {
          setQueue(effectiveQueue);
          originalQueueRef.current = [...effectiveQueue];
          setCurrentIndex(effectiveQueue.findIndex(t => t.id === trackToPlay.id));
        } else if (newQueue) {
          // Fallback if we didn't replace queue but passed one
          setQueue(newQueue);
          originalQueueRef.current = [...newQueue];
          setCurrentIndex(newQueue.findIndex(t => t.id === trackToPlay.id));
        }
      }
    } catch (err) {
      console.error('Play failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current.src) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const autoPlayNext = async () => {
    if (!currentTrack) return;

    console.log('Auto-playing recommendation...');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/browse/recommendations?limit=10&seed_tracks=${currentTrack.id}`);
      const data = await res.json();

      if (data.tracks && data.tracks.length > 0) {
        const nextTracks = data.tracks;
        // Add to queue
        const newQueue = [...queue, ...nextTracks];
        setQueue(newQueue);
        originalQueueRef.current = newQueue;

        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        playTrack(newQueue[nextIndex]);
      }
    } catch (err) {
      console.error('Auto-play failed:', err);
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (repeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    let nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        // Auto Play !
        autoPlayNext();
        return;
      }
    }

    setCurrentIndex(nextIndex);
    playTrack(queue[nextIndex]);
  };

  const handlePrev = () => {
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queue.length - 1;
      } else {
        return;
      }
    }

    setCurrentIndex(prevIndex);
    playTrack(queue[prevIndex]);
  };

  // This is called by the audio element event listener
  // We need to access the LATEST state, which is tricky in useEffect closure
  // So we rely on the fact that handleNext uses current state? No, it uses closure state.
  // We need a ref for the latest handleNext or similar pattern, but for simplicity:
  // We will just call the function which relies on state. Warning: stale closures possible.
  // To fix stale closures, we use a ref for the handler or queue/index
  const handleTrackEnd = () => {
    // For this hackathon scope, we assume handleNext is updated or we use a ref for queue/index if needed.
    // Actually, since we didn't use refs for everything, let's use a hidden button click or similar?
    // Better: Use a ref to hold the callback.

    // Quick fix for this code block:
    document.getElementById('hidden-next-btn')?.click();
  };

  const handleSeek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    audioRef.current.volume = vol / 100;
    if (vol > 0) setIsMuted(false);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    audioRef.current.muted = !isMuted;
  };

  const handleShuffleToggle = () => {
    const newShuffle = !shuffle;
    setShuffle(newShuffle);

    if (newShuffle) {
      // Simple shuffle implementation
      // For production, you'd want a better algorithm or backend support
      const currentTrack = queue[currentIndex];
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      // Find new index
      const newIdx = shuffled.findIndex(t => t.id === currentTrack?.id);
      setCurrentIndex(newIdx !== -1 ? newIdx : 0);
    } else {
      // Revert order if we stored original
      setQueue([...originalQueueRef.current]);
      const currentTrack = queue[currentIndex];
      const newIdx = originalQueueRef.current.findIndex(t => t.id === currentTrack?.id);
      setCurrentIndex(newIdx !== -1 ? newIdx : 0);
    }
  };

  const handleRepeatToggle = () => {
    const modes = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(repeat);
    setRepeat(modes[(currentIdx + 1) % modes.length]);
  };

  const addToQueue = (track) => {
    setQueue([...queue, track]);
    if (queue.length === 0) {
      playTrack(track, [track]);
    }
  };

  const playAll = (tracks) => {
    if (tracks.length === 0) return;
    playTrack(tracks[0], tracks);
  };


  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] select-none text-white overflow-hidden">
      {/* Hidden button for track end event to trigger next with fresh state */}
      <button id="hidden-next-btn" className="hidden" onClick={handleNext} />

      <Sidebar
        view={view}
        setView={setView}
        playlists={playlists}
        onCreatePlaylist={createPlaylist}
        onDeletePlaylist={deletePlaylist}
        onSelectPlaylist={(p) => setView(`playlist:${p.id}`)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative">
        {/* Top Header / Search Bar */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between border-b border-[#2a2a2a]">
          <div className="flex items-center gap-4 text-gray-500">
            <button onClick={() => setView('browse')} className="hover:text-white transition-colors"><ChevronLeft size={24} /></button>
            <button className="hover:text-white transition-colors"><ChevronRight size={24} /></button>
          </div>

          <div className="flex-1 max-w-xl mx-8 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-[#1a1a1a] border border-transparent focus:border-[#fa2d48]/50 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#fa2d48]/50 focus:bg-[#222] transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fa2d48] to-[#ff4d63] shadow-lg shadow-red-500/20" /> {/* User avatar placeholder */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-32 px-8 pt-6 scroll-smooth custom-scrollbar">

          {view === 'browse' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              {feedSections.length > 0 ? (
                feedSections.map((section, idx) => (
                  <section key={idx}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white tracking-tight">{section.section}</h2>
                      {section.items && <button className="text-xs font-semibold text-[#fa2d48] hover:text-[#ff4d63] transition-colors uppercase tracking-wider">Show All</button>}
                    </div>

                    {section.items ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {section.items.map((item) => (
                          <MediaCard
                            key={item.id}
                            title={item.name}
                            subtitle={item.artists?.[0]?.name}
                            imageUrl={item.images?.[0]?.url}
                            onClick={() => playTrack(item)}
                            onPlay={() => playTrack(item)}
                          />
                        ))}
                      </div>
                    ) : section.tracks ? (
                      <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] overflow-hidden">
                        {section.tracks.map((track, i) => (
                          <TrackRow
                            key={track.id}
                            index={i}
                            track={track}
                            onPlay={(t) => playTrack(t, section.tracks)}
                            isActive={currentTrack?.id === track.id}
                            onAddToQueue={addToQueue}
                            onAddToPlaylist={(t) => {
                              setTrackToAdd(t);
                              setShowPlaylistModal(true);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">{section.message}</div>
                    )}
                  </section>
                ))
              ) : (
                <div className="flex items-center justify-center p-20">
                  <div className="text-gray-500">Loading feed...</div>
                </div>
              )}
            </div>
          )}
          {view.startsWith('album:') && (
            album ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-end gap-6 mb-8">
                  <div className="w-48 h-48 bg-[#2a2a2a] rounded-lg shadow-2xl overflow-hidden">
                    <img src={album.images?.[0]?.url} alt={album.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#fa2d48] uppercase tracking-widest mb-2">Album</h4>
                    <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">{album.name}</h1>
                    <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
                      <span className="text-white">{album.artists.map(a => a.name).join(', ')}</span>
                      <span>•</span>
                      <span>{album.release_date.split('-')[0]}</span>
                      <span>•</span>
                      <span>{album.total_tracks} songs</span>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                      <button
                        onClick={() => {
                          const tracksWithMetadata = album.tracks.items.map(t => ({
                            ...t,
                            album: { images: album.images, name: album.name }
                          }));
                          playAll(tracksWithMetadata);
                        }}
                        className="px-8 py-3 bg-[#fa2d48] text-white rounded-full font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-transform"
                      >
                        Play
                      </button>
                      <button
                        onClick={() => {
                          const tracksWithMetadata = album.tracks.items.map(t => ({
                            ...t,
                            album: { images: album.images, name: album.name }
                          }));
                          const shuffled = [...tracksWithMetadata].sort(() => Math.random() - 0.5);
                          playAll(shuffled);
                        }}
                        className="px-8 py-3 bg-[#2a2a2a] text-white rounded-full font-bold hover:bg-[#333] transition-colors"
                      >
                        Shuffle
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] overflow-hidden">
                  {album.tracks.items.map((track, i) => {
                    const trackWithMetadata = {
                      ...track,
                      album: { images: album.images, name: album.name }
                    };
                    return (
                      <TrackRow
                        key={track.id}
                        index={i}
                        track={trackWithMetadata}
                        onPlay={(t) => {
                          const allTracksWithMetadata = album.tracks.items.map(t => ({
                            ...t,
                            album: { images: album.images, name: album.name }
                          }));
                          playTrack(t, allTracksWithMetadata);
                        }}
                        isActive={currentTrack?.id === track.id}
                        onAddToQueue={addToQueue}
                        onAddToPlaylist={(t) => {
                          setTrackToAdd(t);
                          setShowPlaylistModal(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )
          )}
          {view.startsWith('playlist:') && (
            (() => {
              const playlistId = view.split(':')[1];
              const playlist = playlists.find(p => p.id === playlistId);
              if (!playlist) return <div className="text-gray-500">Playlist not found</div>;

              return (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-end gap-6 mb-8">
                    <div className="w-48 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl flex items-center justify-center text-gray-700">
                      <span className="text-6xl font-bold">{playlist.name[0]}</span>
                    </div>
                    <div>
                      <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">{playlist.name}</h1>
                      <p className="text-gray-400 font-medium">{playlist.tracks.length} songs</p>
                      <div className="flex items-center gap-4 mt-6">
                        <button
                          onClick={() => playAll(playlist.tracks)}
                          className="px-8 py-3 bg-[#fa2d48] text-white rounded-full font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-transform"
                        >
                          Play All
                        </button>
                        <button
                          onClick={() => {
                            const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
                            playAll(shuffled);
                          }}
                          className="px-8 py-3 bg-[#2a2a2a] text-white rounded-full font-bold hover:bg-[#333] transition-colors"
                        >
                          Shuffle
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] overflow-hidden">
                    {playlist.tracks.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">
                        This playlist is empty. Add songs from Search or Feed.
                      </div>
                    ) : (
                      playlist.tracks.map((track, i) => (
                        <TrackRow
                          key={`${track.id}-${i}`} // Use index in key as duplicate tracks might technically be allowed or just to be safe
                          index={i}
                          track={track}
                          onPlay={(t) => playTrack(t, playlist.tracks)}
                          isActive={currentTrack?.id === track.id}
                          onAddToQueue={addToQueue}
                          onAddToPlaylist={(t) => {
                            setTrackToAdd(t);
                            setShowPlaylistModal(true);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {view === 'search' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white">Search Results</h2>
              <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] overflow-hidden">
                {searchResults.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No results found</div>
                ) : (
                  searchResults.map((track, i) => (
                    <TrackRow
                      key={track.id}
                      index={i}
                      track={track}
                      onPlay={(t) => playTrack(t, searchResults)}
                      isActive={currentTrack?.id === track.id}
                      onAddToQueue={addToQueue}
                      onAddToPlaylist={(t) => {
                        setTrackToAdd(t);
                        setShowPlaylistModal(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'library' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => setView(`playlist:${playlist.id}`)}
                    className="bg-[#1a1a1a] p-6 rounded-xl border border-[#2a2a2a] hover:border-[#333] hover:bg-[#222] transition-all cursor-pointer group relative"
                  >
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#fa2d48] transition-colors">{playlist.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{playlist.tracks.length} songs</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                      className="absolute top-4 right-4 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Player Bar */}
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          onMuteToggle={handleMuteToggle}
          shuffle={shuffle}
          onShuffleToggle={handleShuffleToggle}
          repeat={repeat}
          onRepeatToggle={handleRepeatToggle}
          showQueue={showQueue}
          setShowQueue={setShowQueue}
          onExpand={() => setIsFullScreen(true)}
        />

        {/* Playlist Selection Modal */}
        {showPlaylistModal && trackToAdd && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPlaylistModal(false)}>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
                <h3 className="font-bold text-white">Add to Playlist</h3>
                <button onClick={() => setShowPlaylistModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToPlaylist(p.id, trackToAdd)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-lg flex items-center justify-between group"
                  >
                    <span className="font-medium text-gray-300 group-hover:text-white truncate">{p.name}</span>
                    <span className="text-xs text-gray-600 group-hover:text-gray-500">{p.tracks.length} songs</span>
                  </button>
                ))}
                {playlists.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No playlists found. Create one in the sidebar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Player Overlay */}
        {isFullScreen && (
          <FullScreenPlayer
            track={currentTrack}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onClose={() => setIsFullScreen(false)}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            shuffle={shuffle}
            onShuffleToggle={handleShuffleToggle}
            repeat={repeat}
            onRepeatToggle={handleRepeatToggle}
          />
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute top-0 left-0 w-full h-0.5 bg-[#121212] overflow-hidden z-50">
            <div className="h-full bg-[#fa2d48] animate-indeterminate-bar shadow-[0_0_10px_#fa2d48]" />
          </div>
        )}
      </main>
    </div>
  );
}
