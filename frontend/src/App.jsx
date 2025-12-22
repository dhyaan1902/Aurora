import { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Star, Clock, Music2, ListMusic, Trash2, X, Music, GripVertical, ListPlus, Play, CheckCircle, Plus, List } from 'lucide-react';

import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import FullScreenPlayer from './components/FullScreenPlayer';
import { TrackRow, MediaCard, SkeletonCard, SkeletonRow } from './components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePlaylistModal from './components/CreatePlaylistModal';
import ConfirmationModal from './components/ConfirmationModal';
import './App.css';

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
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '' });

  const audioRef = useRef(null);
  const originalQueueRef = useRef([]);

  const [draggedTrack, setDraggedTrack] = useState(null);
  const [prefetchedUrls, setPrefetchedUrls] = useState({});
  const [prefetching, setPrefetching] = useState(false);
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
    fetchFavorites();
  }, []);
  useEffect(() => {
    if (view.startsWith('album:')) {
      const albumId = view.split(':')[1];
      setAlbum(null);
      fetch(`${API_BASE}/browse/album/${albumId}`)
        .then(res => res.json())
        .then(data => setAlbum(data))
        .catch(err => console.error('Failed to fetch album', err));
    }
  }, [view]);

  useEffect(() => {
    if (view.startsWith('playlist:')) {  // <--- THIS WAS MISSING
      const playlistId = view.split(':')[1];
      const playlist = playlists.find(p => p.id === playlistId);

      if (playlist && playlist.tracks.length > 0) {
        prefetchStreams(playlist.tracks);
      }
    }
  }, [view, playlists]);

  const prefetchStreams = async (tracks) => {
    if (!tracks || tracks.length === 0) return;

    // Support both single track object and array of tracks
    const trackList = Array.isArray(tracks) ? tracks : [tracks];
    const tracksToFetch = trackList.filter(t => !prefetchedUrls[t.id]).slice(0, 20);

    if (tracksToFetch.length === 0) return;

    setPrefetching(true);
    console.log(`🌀 Prefetching ${tracksToFetch.length} tracks...`);

    try {
      if (tracksToFetch.length === 1) {
        // Individual fetch for single track
        const track = tracksToFetch[0];
        const res = await fetch(`${API_BASE}/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spotifyTrackId: track.id })
        });
        const data = await res.json();
        if (data.streamUrl) {
          const fullUrl = data.streamUrl.startsWith('/') ? `${API_BASE}${data.streamUrl}` : data.streamUrl;
          setPrefetchedUrls(prev => ({ ...prev, [track.id]: fullUrl }));
        }
      } else {
        // Bulk fetch for multiple tracks
        const res = await fetch(`${API_BASE}/queue/prepare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackIds: tracksToFetch.map(t => t.id) })
        });
        const data = await res.json();
        const urlMap = {};
        data.results?.forEach(r => {
          if (r.streamUrl) {
            const fullUrl = r.streamUrl.startsWith('/') ? `${API_BASE}${r.streamUrl}` : r.streamUrl;
            urlMap[r.trackId] = fullUrl;
          }
        });
        setPrefetchedUrls(prev => ({ ...prev, ...urlMap }));
      }
    } catch (err) {
      console.warn('Prefetch failed', err);
    } finally {
      setPrefetching(false);
    }
  };

  // ==========================================
  // ADD THIS useEffect AFTER YOUR OTHER useEffects
  // (Around line 95, after the playlist prefetch useEffect)
  // ==========================================

  // Prefetch top search result stream URL
  // FIND THE SEARCH PREFETCH useEffect AND REPLACE IT WITH THIS:

  // Prefetch top search result stream URL
  useEffect(() => {
    if (view === 'search' && searchResults.tracks && searchResults.tracks.length > 0) {
      const topResult = searchResults.tracks[0];

      // Don't prefetch if already cached
      if (prefetchedUrls[topResult.id]) {
        console.log('✅ Top result already cached');
        return;
      }

      // Prefetch top result
      const prefetchTopResult = async () => {
        console.log(`🔄 Prefetching top result: ${topResult.name}`);

        try {
          const res = await fetch(`${API_BASE}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spotifyTrackId: topResult.id })
          });

          const data = await res.json();

          if (data.streamUrl) {
            const fullUrl = data.streamUrl.startsWith('/') ? `${API_BASE}${data.streamUrl}` : data.streamUrl;
            setPrefetchedUrls(prev => ({
              ...prev,
              [topResult.id]: fullUrl
            }));
            console.log(`✅ Top result prefetched: ${topResult.name}`);
          }
        } catch (err) {
          console.error('❌ Top result prefetch failed:', err);
        }
      };

      prefetchTopResult();
    }
  }, [view, searchResults]);
  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${API_BASE}/playlists`);
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_BASE}/favorites`);
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  };

  useEffect(() => {
    if (view === 'favorites' && favorites.length > 0) {
      const tracks = favorites.filter(f => f.type === 'track').map(f => f.data);
      if (tracks.length > 0) {
        prefetchStreams(tracks.slice(0, 5));
      }
    }
  }, [view, favorites]);

  // Prefetch next 5 songs in queue
  useEffect(() => {
    if (currentIndex !== -1 && queue.length > 0) {
      const nextSongs = queue.slice(currentIndex + 1, currentIndex + 6);
      if (nextSongs.length > 0) {
        console.log(`🌀 Prefetching next 5 songs in queue...`);
        prefetchStreams(nextSongs);
      }
    }
  }, [currentIndex, queue]);

  const toggleFavorite = async (item, type = 'track') => {
    const isStarred = favorites.some(f => f.id === item.id);
    try {
      if (isStarred) {
        await fetch(`${API_BASE}/favorites/${item.id}`, { method: 'DELETE' });
        setFavorites(favorites.filter(f => f.id !== item.id));
      } else {
        await fetch(`${API_BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, type, data: item })
        });
        setFavorites([{ id: item.id, type, data: item, createdAt: new Date().toISOString() }, ...favorites]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Playlist Creation Modal State
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName, tracks: [] })
      });
      const newPlaylist = await res.json();
      setPlaylists([newPlaylist, ...playlists]);
      setShowCreatePlaylistModal(false);
      setNewPlaylistName('');
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const addToPlaylist = async (playlistId, track) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      // Check for duplicates
      if (playlist.tracks.some(t => t.id === track.id)) {
        setToast({ show: true, message: 'Track already in playlist' });
        setTimeout(() => setToast({ show: false, message: '' }), 2000);
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

  const removeTrackFromPlaylist = async (playlistId, trackIndex) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const updatedTracks = [...playlist.tracks];
      updatedTracks.splice(trackIndex, 1);

      await fetch(`${API_BASE}/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlist.name, tracks: updatedTracks })
      });

      setPlaylists(playlists.map(p =>
        p.id === playlistId ? { ...p, tracks: updatedTracks } : p
      ));
    } catch (err) {
      console.error('Failed to remove track from playlist:', err);
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

  // FIND YOUR handleSearch FUNCTION AND REPLACE IT WITH THIS:

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      // Store the entire structured response
      setSearchResults(data);
      setView('search');

      // Smart Prefetching: Top Result
      if (data.tracks && data.tracks.length > 0) {
        prefetchStreams(data.tracks.slice(0, 1));
      }
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
      // Check if we have prefetched URL
      if (prefetchedUrls[trackToPlay.id]) {
        console.log('🚀 Using prefetched URL');
        audioRef.current.src = prefetchedUrls[trackToPlay.id];
        audioRef.current.play();
        setIsPlaying(true);
        setCurrentTrack({ ...trackToPlay });

        if (effectiveQueue) {
          setQueue(effectiveQueue);
          originalQueueRef.current = [...effectiveQueue];
          setCurrentIndex(effectiveQueue.findIndex(t => t.id === trackToPlay.id));
        } else if (newQueue) {
          setQueue(newQueue);
          originalQueueRef.current = [...newQueue];
          setCurrentIndex(newQueue.findIndex(t => t.id === trackToPlay.id));
        }

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
        const fullUrl = data.streamUrl.startsWith('/') ? `${API_BASE}${data.streamUrl}` : data.streamUrl;
        audioRef.current.src = fullUrl;
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
      if (queue.length <= 1) return;

      const currentTrack = queue[currentIndex];
      const otherTracks = queue.filter(t => t.id !== currentTrack?.id);

      // Fischer-Yates Shuffle for better randomness
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }

      const shuffled = currentTrack ? [currentTrack, ...otherTracks] : otherTracks;
      setQueue(shuffled);
      setCurrentIndex(0);
    } else {
      const currentTrack = queue[currentIndex];
      setQueue([...originalQueueRef.current]);
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
    setQueue(prev => [...prev, track]);
    setToast({ show: true, message: `Added to Queue: ${track.name}` });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);

    if (queue.length === 0) {
      playTrack(track, [track]);
    }
  };

  const removeFromQueue = (index) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });

    // Adjust currentIndex if necessary
    if (index === currentIndex) {
      // If we remove the current track, maybe we should stop or play next?
      // Usually in Spotify, removing the current track from queue just keeps it playing but it's gone from list.
    } else if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const playAll = (tracks) => {
    if (tracks.length === 0) return;
    playTrack(tracks[0], tracks);
  };



  // Handle drag start
  const handleDragStart = (e, track, index) => {
    // Allow dragging from entire row in playlists for better UX
    setDraggedTrack({ track, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = async (e, dropIndex, playlistId, fromIndex) => {
    e.preventDefault();

    const fromIdx = fromIndex !== undefined ? fromIndex : (draggedTrack ? draggedTrack.index : -1);

    if (fromIdx === -1 || fromIdx === dropIndex) {
      setDraggedTrack(null);
      return;
    }

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    // Reorder tracks array
    const newTracks = [...playlist.tracks];
    const [removed] = newTracks.splice(fromIdx, 1);

    // Adjustment: If we removed an item from BEFORE the drop target,
    // the target's index has shifted down by 1.
    let targetIdx = dropIndex;
    if (fromIdx < targetIdx) {
      targetIdx--;
    }
    newTracks.splice(targetIdx, 0, removed);

    // Optimistic update
    setPlaylists(playlists.map(p =>
      p.id === playlistId ? { ...p, tracks: newTracks } : p
    ));

    // Update backend
    try {
      await fetch(`${API_BASE}/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlist.name, tracks: newTracks })
      });
      console.log('✅ Playlist order updated');
    } catch (err) {
      console.error('❌ Failed to update playlist order:', err);
      // Revert on error
      fetchPlaylists();
    }

    setDraggedTrack(null);
  };

  // Handle download
  const handleDownload = async () => {
    if (!currentTrack) return;
    setToast({ show: true, message: `Downloading ${currentTrack.name}...` });

    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyTrackId: currentTrack.id })
      });
      const data = await res.json();
      if (data.status === 'downloaded' || data.status === 'exists') {
        setToast({ show: true, message: `Downloaded: ${currentTrack.name}` });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
        // Refresh downloads list if we are in library view
        if (view === 'library') fetchDownloads();
      }
    } catch (err) {
      console.error('Download failed:', err);
      setToast({ show: true, message: 'Download failed' });
    }
  };

  const [downloads, setDownloads] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const deleteDownload = (spotifyId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Download',
      message: 'Are you sure you want to remove this track from your downloads?',
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE}/download/${spotifyId}`, { method: 'DELETE' });
          setDownloads(downloads.filter(d => d.spotifyId !== spotifyId));
          setToast({ show: true, message: 'Removed from downloads' });
          setTimeout(() => setToast({ show: false, message: '' }), 2000);
        } catch (err) {
          console.error('Failed to delete download:', err);
        }
      }
    });
  };
  const fetchDownloads = async () => {
    try {
      const res = await fetch(`${API_BASE}/download`);
      const data = await res.json();
      setDownloads(data.downloads || []);
    } catch (err) {
      console.error('Failed to fetch downloads:', err);
    }
  };


  const handleCreatePlaylist = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          tracks: []
        })
      });
      const data = await res.json();
      setPlaylists([...playlists, data]);
      setToast({ show: true, message: 'Playlist created' });
      setTimeout(() => setToast({ show: false, message: '' }), 2000);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const deletePlaylist = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Playlist',
      message: 'Are you sure you want to delete this playlist? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE}/playlists/${id}`, { method: 'DELETE' });
          setPlaylists(playlists.filter(p => p.id !== id));
          if (view === `playlist:${id}`) setView('browse');
        } catch (err) {
          console.error('Failed to delete playlist:', err);
        }
      }
    });
  };

  useEffect(() => {
    if (view === 'library') {
      fetchDownloads();
    }
  }, [view]);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] select-none text-white overflow-hidden">
      {/* Hidden button for track end event to trigger next with fresh state */}
      <button id="hidden-next-btn" className="hidden" onClick={handleNext} />

      <Sidebar
        view={view}
        setView={setView}
        playlists={playlists}
        onCreatePlaylist={() => setShowCreatePlaylistModal(true)}
        onDeletePlaylist={deletePlaylist}
        onSelectPlaylist={(p) => setView(`playlist:${p.id}`)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-black relative overflow-hidden">
        {/* Top Header / Search Bar */}
        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-2xl px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-gray-500">
            <button onClick={() => setView('browse')} className="p-2 rounded-full bg-black/40 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
            <button className="p-2 rounded-full bg-black/40 hover:text-white transition-colors"><ChevronRight size={20} /></button>
          </div>

          <div className="flex-1 max-w-md mx-8 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="What do you want to listen to?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-[#242424] border border-transparent focus:border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:bg-[#2a2a2a] transition-all placeholder:text-gray-500"
            />
          </div>

          <div className="w-10" /> {/* Spacer instead of avatar */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-32 px-8 pt-6 scroll-smooth custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'browse' && (
                <div className="space-y-10">
                  {loading ? (
                    <div className="space-y-10">
                      {[1, 2].map(i => (
                        <section key={i}>
                          <div className="h-8 w-48 bg-[#1a1a1a] rounded mb-6" />
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[1, 2, 3, 4, 5].map(j => <SkeletonCard key={j} />)}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : feedSections.length > 0 ? (
                    <div className="space-y-12">
                      {feedSections.map((section, idx) => (
                        <section key={idx} className="animate-in fade-in duration-700">
                          <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{section.section || section.title}</h2>
                            {section.section === 'Featured' && (
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] border border-white/10 px-2 py-0.5 rounded">Special</span>
                            )}
                          </div>

                          {section.items ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                              {section.items.map((item) => (
                                <MediaCard
                                  key={item.id}
                                  title={item.name}
                                  subtitle={item.artists?.[0]?.name || (item.type === 'album' ? 'Album' : 'Playlist')}
                                  imageUrl={item.images?.[0]?.url}
                                  onClick={() => item.type === 'album' ? setView(`album:${item.id}`) : playTrack(item)}
                                  onPlay={() => item.type === 'album' ? setView(`album:${item.id}`) : playTrack(item)}
                                  isStarred={favorites.some(f => f.id === item.id)}
                                  onToggleFavorite={() => toggleFavorite(item, item.type || 'track')}
                                  type={item.type}
                                />
                              ))}
                            </div>
                          ) : section.tracks ? (
                            <div className="bg-[#121212] rounded-xl border border-white/5 overflow-hidden">
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
                                  isStarred={favorites.some(f => f.id === track.id)}
                                  onToggleFavorite={toggleFavorite}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center text-gray-600 border border-dashed border-white/5 rounded-xl">
                              {section.message || "Working on your recommendations..."}
                            </div>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-32 gap-6">
                      <div className="relative">
                        <Music2 size={64} className="text-white/5" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-[var(--mac-accent)] border-t-transparent rounded-full animate-spin" />
                        </div>
                      </div>
                      <div className="text-gray-500 font-bold tracking-tight">Building your music feed...</div>
                    </div>
                  )}
                </div>
              )}
              {view.startsWith('album:') && (
                album ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-end gap-8 mb-8 pb-4">
                      <div className="w-60 h-60 bg-[#282828] rounded shadow-2xl overflow-hidden flex-shrink-0">
                        <img src={album.images?.[0]?.url} alt={album.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--mac-accent)] uppercase tracking-[0.2em] mb-2">Album</h4>
                        <h1 className="text-6xl font-black text-white mb-6 tracking-tighter">{album.name}</h1>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                          <span className="text-white hover:underline cursor-pointer">{album.artists.map(a => a.name).join(', ')}</span>
                          <span className="text-gray-600">•</span>
                          <span>{album.release_date.split('-')[0]}</span>
                          <span className="text-gray-600">•</span>
                          <span>{album.total_tracks} songs</span>
                        </div>
                        <div className="flex items-center gap-6 mt-8">
                          <button
                            onClick={() => {
                              const tracksWithMetadata = album.tracks.items.map(t => ({
                                ...t,
                                album: { images: album.images, name: album.name }
                              }));
                              playAll(tracksWithMetadata);
                            }}
                            className="w-14 h-14 bg-[var(--mac-accent)] text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
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
                            isStarred={favorites.some(f => f.id === track.id)}
                            onToggleFavorite={toggleFavorite}
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
                      <div className="flex items-end gap-8 mb-8 pb-4">
                        <div className="w-60 h-60 bg-[#282828] rounded shadow-2xl flex items-center justify-center text-gray-700 flex-shrink-0">
                          <span className="text-8xl font-bold">{playlist.name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Playlist</h4>
                          <h1 className="text-8xl font-black text-white mb-6 tracking-tighter truncate">{playlist.name}</h1>
                          <div className="flex items-center gap-2 text-gray-300 font-bold text-sm">
                            <span className="text-white hover:underline cursor-pointer">Aurora User</span>
                            <span className="text-gray-600">•</span>
                            <span>{playlist.tracks.length} songs</span>
                          </div>

                          {/* Prefetch indicator */}
                          {prefetching && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                              <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                              <span>Preparing tracks for instant playback...</span>
                            </div>
                          )}

                          <div className="flex items-center gap-6 mt-8">
                            <button
                              onClick={() => playAll(playlist.tracks)}
                              className="w-14 h-14 bg-[var(--mac-accent)] text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
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
                            <div
                              key={`${track.id}-${i}`}
                              draggable
                              onDragStart={(e) => {
                                handleDragStart(e, track, i);
                                e.dataTransfer.setData('sourceIndex', i);
                                e.dataTransfer.setData('sourcePlaylistId', playlistId);
                                e.currentTarget.classList.add('opacity-40');
                              }}
                              onDragEnd={(e) => {
                                e.currentTarget.classList.remove('opacity-40');
                                setDraggedTrack(null);
                              }}
                              onDragOver={handleDragOver}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fromIdx = parseInt(e.dataTransfer.getData('sourceIndex'));
                                const sourceId = e.dataTransfer.getData('sourcePlaylistId');

                                if (sourceId !== playlistId || fromIdx === i) return;

                                handleDrop(e, i, playlistId, fromIdx);
                              }}
                              className={`
                                group flex items-center gap-4 p-4 border-b border-[#2a2a2a] last:border-0
                                hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing
                                ${currentTrack?.id === track.id ? 'bg-white/5' : ''}
                              `}
                            >
                              {/* Drag Handle */}
                              <div className="drag-handle text-gray-600 group-hover:text-gray-400 transition-colors">
                                <List size={16} />
                              </div>

                              {/* Track Number */}
                              <div className="w-8 text-gray-500 text-sm font-medium tabular-nums">
                                {i + 1}
                              </div>

                              {/* Album Art */}
                              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-[#2a2a2a]">
                                <img
                                  src={track.album?.images?.[0]?.url || '/api/placeholder/48/48'}
                                  alt={track.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Track Info */}
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-sm truncate ${currentTrack?.id === track.id ? 'text-[var(--mac-accent)]' : 'text-white'}`}>
                                  {track.name}
                                </div>
                                <div className="text-sm text-gray-400 truncate">
                                  {track.artists?.map(a => a.name).join(', ')}
                                </div>
                              </div>

                              {/* Album Name */}
                              <div className="hidden lg:block text-sm text-gray-400 truncate w-48">
                                {track.album?.name}
                              </div>

                              {/* Duration */}
                              <div className="text-sm text-gray-400 tabular-nums w-12 text-right">
                                {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                              </div>

                              {/* Actions (visible on hover) */}
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playTrack(track, playlist.tracks);
                                  }}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M3 2l10 6-10 6V2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToQueue(track);
                                  }}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M8 3v10M3 8h10" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTrackToAdd(track);
                                    setShowPlaylistModal(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="2" width="12" height="12" rx="2" />
                                    <path d="M6 8h4M8 6v4" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Remove from playlist
                                    removeTrackFromPlaylist(playlistId, i);
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/10 rounded-full transition-colors"
                                  title="Remove from Playlist"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
              {view === 'search' && (
                <div className="space-y-10 animate-in fade-in duration-500 pb-20">
                  {(!searchResults.tracks && !searchResults.albums && !searchResults.albumContext) || (searchResults.tracks?.length === 0 && searchResults.albums?.length === 0) ? (
                    <div className="flex flex-col items-center justify-center p-32 text-center">
                      <Search size={80} className="text-gray-800 mb-6" />
                      <h2 className="text-2xl font-bold text-white mb-2">No results for "{searchQuery}"</h2>
                      <p className="text-gray-500 max-w-sm">Please make sure your words are spelled correctly or use fewer or different keywords.</p>
                    </div>
                  ) : (
                    <>
                      {/* Top Row: Top Result & Songs */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Top Result */}
                        {searchResults.tracks && searchResults.tracks.length > 0 && (
                          <div className="lg:col-span-5">
                            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Top Result</h2>
                            <div
                              onClick={() => playTrack(searchResults.tracks[0], searchResults.tracks)}
                              className="group bg-[#181818] p-6 rounded-xl hover:bg-[#282828] transition-all cursor-pointer border border-white/5 relative flex flex-col gap-5 min-h-[240px]"
                            >
                              <div className="w-24 h-24 rounded-lg overflow-hidden shadow-2xl bg-[#242424] transition-all flex-shrink-0">
                                <img
                                  src={searchResults.tracks[0].album?.images?.[0]?.url || '/api/placeholder/128/128'}
                                  alt={searchResults.tracks[0].name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>

                              <div className="flex-1">
                                <h3 className="text-5xl font-black text-white truncate tracking-tighter mb-1.5 group-hover:text-[var(--mac-accent)] transition-colors pr-20">
                                  {searchResults.tracks[0].name}
                                </h3>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="text-sm text-gray-400 capitalize">{searchResults.tracks[0].type}</span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-sm text-white hover:underline truncate">{searchResults.tracks[0].artists?.map(a => a.name).join(', ')}</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="absolute top-6 right-6 flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(searchResults.tracks[0], 'track');
                                  }}
                                  className={`p-2 rounded-full hover:bg-white/5 transition-all ${favorites.some(f => f.id === searchResults.tracks[0].id) ? 'text-[var(--mac-accent)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                  <Star size={20} fill={favorites.some(f => f.id === searchResults.tracks[0].id) ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTrackToAdd(searchResults.tracks[0]);
                                    setShowPlaylistModal(true);
                                  }}
                                  className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                                  title="Add to Playlist"
                                >
                                  <ListPlus size={20} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToQueue(searchResults.tracks[0]);
                                  }}
                                  className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                                  title="Add to Queue"
                                >
                                  <Plus size={20} />
                                </button>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTrack(searchResults.tracks[0], searchResults.tracks);
                                }}
                                className="absolute bottom-6 right-6 w-14 h-14 bg-[var(--mac-accent)] rounded-full flex items-center justify-center shadow-2xl text-black hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                              >
                                <Play size={28} fill="currentColor" className="ml-1" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Right: Songs (Top 4) */}
                        {searchResults.tracks && searchResults.tracks.length > 1 && (
                          <div className="lg:col-span-7">
                            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Songs</h2>
                            <div className="space-y-0.5">
                              {searchResults.tracks.slice(1, 5).map((track, i) => (
                                <TrackRow
                                  key={track.id}
                                  index={i}
                                  track={track}
                                  onPlay={(t) => playTrack(t, searchResults.tracks)}
                                  isActive={currentTrack?.id === track.id}
                                  onAddToQueue={addToQueue}
                                  onAddToPlaylist={(t) => {
                                    setTrackToAdd(t);
                                    setShowPlaylistModal(true);
                                  }}
                                  isStarred={favorites.some(f => f.id === track.id)}
                                  onToggleFavorite={toggleFavorite}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* All Songs Section - Grid View for Better Scanning */}
                      {searchResults.tracks && searchResults.tracks.length > 1 && (
                        <section>
                          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
                            All Songs
                            <span className="text-sm font-normal text-gray-500 ml-3">
                              {searchResults.tracks.length} results
                            </span>
                          </h2>
                          <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] overflow-hidden">
                            {searchResults.tracks.slice(1).map((track, i) => (
                              <TrackRow
                                key={track.id}
                                index={i + 1}
                                track={track}
                                onPlay={(t) => playTrack(t, searchResults.tracks)}
                                isActive={currentTrack?.id === track.id}
                                onAddToQueue={addToQueue}
                                onAddToPlaylist={(t) => {
                                  setTrackToAdd(t);
                                  setShowPlaylistModal(true);
                                }}
                                isStarred={favorites.some(f => f.id === track.id)}
                                onToggleFavorite={toggleFavorite}
                              />
                            ))}
                          </div>
                        </section>
                      )}


                      {/* Albums Section - Enhanced Cards */}
                      {searchResults.albums && searchResults.albums.length > 0 && (
                        <section className="pt-4">
                          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
                            Albums
                            <span className="text-sm font-normal text-gray-500 ml-3">
                              {searchResults.albums.length} results
                            </span>
                          </h2>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {searchResults.albums.map((album) => (
                              <MediaCard
                                key={album.id}
                                title={album.name}
                                subtitle={album.artists?.map(a => a.name).join(', ')}
                                imageUrl={album.images?.[0]?.url}
                                onClick={() => setView(`album:${album.id}`)}
                                onPlay={() => setView(`album:${album.id}`)}
                                isStarred={favorites.some(f => f.id === album.id)}
                                onToggleFavorite={() => toggleFavorite(album, 'album')}
                                type="album"
                              />
                            ))}
                          </div>
                        </section>
                      )}
                    </>
                  )}
                </div>
              )}
              {view === 'favorites' && (
                <div className="space-y-8">
                  <div className="flex items-end gap-6 mb-10">
                    <div className="w-56 h-56 bg-gradient-to-br from-[#1e3a8a] to-[#1e1b4b] rounded shadow-2xl flex items-center justify-center text-white">
                      <Star size={80} fill="currentColor" />
                    </div>
                    <div className="pb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-2">Collection</h4>
                      <h1 className="text-7xl font-black text-white mb-6 tracking-tighter">Your Favorites</h1>
                      <p className="text-gray-400 font-bold ml-1">{favorites.length} items</p>
                    </div>
                  </div>

                  {favorites.length > 0 ? (
                    <div className="space-y-10">
                      {/* Favorite Tracks */}
                      {favorites.some(f => f.type === 'track') && (
                        <section>
                          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Clock size={20} className="text-[var(--mac-accent)]" /> Starred Tracks
                          </h2>
                          <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] overflow-hidden">
                            {favorites.filter(f => f.type === 'track').map((fav, i) => (
                              <TrackRow
                                key={fav.id}
                                index={i}
                                track={fav.data}
                                onPlay={(t) => playTrack(t, favorites.filter(f => f.type === 'track').map(f => f.data))}
                                isActive={currentTrack?.id === fav.id}
                                onAddToQueue={addToQueue}
                                onAddToPlaylist={(t) => {
                                  setTrackToAdd(t);
                                  setShowPlaylistModal(true);
                                }}
                                isStarred={true}
                                onToggleFavorite={toggleFavorite}
                              />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Favorite Albums */}
                      {favorites.some(f => f.type === 'album') && (
                        <section>
                          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Music2 size={20} className="text-[var(--mac-accent)]" /> Starred Albums
                          </h2>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {favorites.filter(f => f.type === 'album').map((fav) => (
                              <MediaCard
                                key={fav.id}
                                title={fav.data.name}
                                subtitle={fav.data.artists?.[0]?.name}
                                imageUrl={fav.data.images?.[0]?.url}
                                onClick={() => setView(`album:${fav.id}`)}
                                onPlay={() => playTrack(fav.data)}
                                isStarred={true}
                                onToggleFavorite={() => toggleFavorite(fav.data, 'album')}
                                type="album"
                              />
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
                      <Star size={48} className="text-gray-700" />
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
                        <p className="text-gray-500">Star tracks or albums to see them here.</p>
                      </div>
                      <button onClick={() => setView('browse')} className="mt-4 px-8 py-2.5 bg-[var(--mac-accent)] text-black rounded-full font-bold hover:scale-105 transition-transform">Discover Music</button>
                    </div>
                  )}
                </div>
              )}

              {view === 'library' && (
                <div className="space-y-12">
                  <section>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                      <ListMusic className="text-[var(--mac-accent)]" /> Your Playlists
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          onClick={() => setView(`playlist:${playlist.id}`)}
                          className="bg-[#181818] p-6 rounded-xl border border-white/5 hover:border-[var(--mac-accent)]/30 hover:bg-[#282828] transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--mac-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--mac-accent)] transition-colors relative z-10">{playlist.name}</h3>
                          <p className="text-sm text-gray-500 font-medium relative z-10">{playlist.tracks.length} songs</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                            className="absolute top-4 right-4 text-gray-600 hover:text-[var(--mac-accent)] opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-white/5 relative z-20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {playlists.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-[#2a2a2a] rounded-xl">
                          <ListMusic size={48} className="text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-500">No playlists yet. Create one in the sidebar.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Downloads Section */}
                  <section>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--mac-accent)]">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Downloaded Tracks
                    </h2>
                    <div className="bg-[#121212] rounded-xl border border-[#2a2a2a] overflow-hidden">
                      {downloads.length > 0 ? (
                        downloads.map((item, i) => {
                          const track = {
                            id: item.spotifyId,
                            name: item.name || item.filePath.split('.')[0], // Fallback if name missing
                            artists: [{ name: item.artist || 'Offline' }],
                            album: { images: [{ url: item.image || '/api/placeholder/64/64' }] },
                            duration_ms: item.duration || 0,
                            isLocal: true,
                            streamUrl: `${API_BASE}/download/serve/${encodeURIComponent(item.filePath)}`
                          };

                          return (
                            <div
                              key={item.spotifyId}
                              className="group flex items-center gap-4 p-4 border-b border-[#2a2a2a] last:border-0 hover:bg-white/5 transition-all cursor-pointer"
                              onClick={() => {
                                // Play local file
                                audioRef.current.src = track.streamUrl;
                                audioRef.current.play();
                                setIsPlaying(true);
                                setCurrentTrack(track);
                                setQueue([track]);
                                setCurrentIndex(0);
                              }}
                            >
                              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-[#282828]">
                                {track.album.images[0]?.url ? (
                                  <img src={track.album.images[0].url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500"><Music size={24} /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-white truncate">{track.name}</div>
                                <div className="text-xs text-gray-500 truncate">{track.artists[0].name}</div>
                              </div>
                              <div className="text-xs text-gray-500 mr-4">
                                {new Date(item.downloadedAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-[10px] bg-[var(--mac-accent)]/20 text-[var(--mac-accent)] px-2 py-1 rounded">
                                  OFFLINE
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteDownload(item.spotifyId); }}
                                  className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          No downloads yet.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Queue Side Panel */}
        <AnimatePresence>
          {showQueue && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 w-[400px] h-full bg-[#121212] border-l border-white/5 z-40 shadow-2xl flex flex-col pt-20"
            >
              <div className="px-6 py-5 flex items-center justify-between">
                <h2 className="text-xl font-bold">Next Up</h2>
                <button
                  onClick={() => setShowQueue(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-2">
                <h3 className="text-sm font-bold text-gray-400 mb-4 px-1 uppercase tracking-wider">Now Playing</h3>
                {currentTrack && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 mb-8 border border-[var(--mac-accent)]/30">
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 shadow-lg">
                      <img src={currentTrack.album?.images?.[2]?.url || currentTrack.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[var(--mac-accent)] truncate">{currentTrack.name}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{currentTrack.artists?.[0]?.name}</div>
                    </div>
                    <div className="mr-2">
                      <div className="w-2 h-2 bg-[var(--mac-accent)] rounded-full animate-pulse" />
                    </div>
                  </div>
                )}

                <h3 className="text-sm font-bold text-gray-400 mb-4 px-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Queue</span>
                  <button
                    onClick={() => {
                      const newQueue = queue.slice(0, currentIndex + 1);
                      setQueue(newQueue);
                    }}
                    className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                  >
                    CLEAR NEXT
                  </button>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-32">
                {queue.map((track, i) => {
                  // Show all tracks, but dim played ones
                  const isPlayed = i < currentIndex;
                  const isCurrent = i === currentIndex;

                  if (isCurrent) return null; // Already shown in Now Playing

                  return (
                    <div
                      key={`${track.id}-${i}`}
                      draggable={!isPlayed}
                      onDragStart={(e) => {
                        if (isPlayed) return;
                        // Allow dragging from anywhere in the row for better UX
                        e.dataTransfer.setData('trackIndex', i);
                        e.currentTarget.classList.add('opacity-40');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-40');
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (isPlayed) return;

                        const fromIdx = parseInt(e.dataTransfer.getData('trackIndex'));
                        let toIdx = i; // The index we dropped ON

                        // Prevent dragging played items or dropping onto played items
                        if (fromIdx < currentIndex + 1 || toIdx < currentIndex + 1) return;
                        if (fromIdx === toIdx) return;

                        const newQueue = [...queue];
                        const [removed] = newQueue.splice(fromIdx, 1);

                        // Adjustment: If we removed an item from BEFORE the drop target,
                        // the target's index has shifted down by 1.
                        // We want to insert *at* the target's new position (effectively before it).
                        if (fromIdx < toIdx) {
                          toIdx--;
                        }

                        newQueue.splice(toIdx, 0, removed);
                        setQueue(newQueue);
                      }}
                      className={`
                        group flex items-center gap-3 p-2 rounded-md mb-1 transition-all
                        ${isPlayed ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-white/5 cursor-grab active:cursor-grabbing'}
                      `}
                    >
                      {/* Drag Handle (Visual only now, since entire row is draggable) */}
                      {!isPlayed && (
                        <div className="drag-handle text-gray-600 group-hover:text-gray-400 cursor-grab">
                          <List size={16} />
                        </div>
                      )}

                      <div
                        className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                        onClick={() => {
                          setCurrentIndex(i);
                          playTrack(track);
                        }}
                      >
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          <img src={track.album?.images?.[2]?.url || track.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${isPlayed ? 'text-gray-500' : 'text-white'}`}>{track.name}</div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{track.artists?.[0]?.name}</div>
                        </div>
                      </div>

                      {!isPlayed && (
                        <button
                          onClick={() => removeFromQueue(i)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-white transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {queue.length <= currentIndex + 1 && (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    <Music size={32} className="mx-auto mb-3 opacity-10" />
                    Queue is empty
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


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
          onAddToPlaylist={() => {
            if (currentTrack) {
              setTrackToAdd(currentTrack);
              setShowPlaylistModal(true);
            }
          }}
          onDownload={handleDownload}
          onAlbumClick={() => {
            if (currentTrack?.album?.id) {
              setView(`album:${currentTrack.album.id}`);
            }
          }}
        />

        {/* Playlist Selection Modal */}
        {showPlaylistModal && trackToAdd && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowPlaylistModal(false)}>
            <div className="bg-[#121212] border border-white/5 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">Add to Playlist</h3>
                <button onClick={() => setShowPlaylistModal(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
              </div>
              <div className="max-h-80 overflow-y-auto p-3">
                {playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToPlaylist(p.id, trackToAdd)}
                    className="w-full text-left px-4 py-4 hover:bg-white/5 rounded-xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-gray-500 font-bold">
                        {p.name[0]}
                      </div>
                      <span className="font-bold text-gray-200 group-hover:text-white truncate">{p.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-bold group-hover:text-[var(--mac-accent)]">{p.tracks.length} songs</span>
                  </button>
                ))}
                {playlists.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <ListMusic size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No playlists found. Create one in the sidebar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Playlist Modal Component */}
        <CreatePlaylistModal
          isOpen={showCreatePlaylistModal}
          onClose={() => setShowCreatePlaylistModal(false)}
          onCreate={handleCreatePlaylist}
        />

        {/* Toast Notification */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] bg-[var(--mac-accent)] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold"
            >
              <CheckCircle size={20} />
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
        />

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
          <div className="absolute top-0 left-0 w-full h-0.5 bg-black overflow-hidden z-[60]">
            <div className="h-full bg-[var(--mac-accent)] animate-indeterminate-bar" />
          </div>
        )}
      </main>
    </div >
  );
}

