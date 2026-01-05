/**
 * WHITEHOLE - PLAYLIST CACHING & OFFLINE SUPPORT
 */

const PlaylistCache = (() => {
    const PLAYLISTS_KEY = 'whitehole-playlists';
    const FAVORITES_KEY = 'whitehole-favorites';
    const QUEUE_KEY = 'whitehole-queue';
    const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const savePlaylist = (name, songs) => {
        const playlists = getPlaylists();
        playlists[name] = {
            name,
            songs,
            created: Date.now(),
            updated: Date.now(),
            count: songs.length
        };
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
        showNotification(`Playlist "${name}" saved!`, 'success');
        return playlists[name];
    };
    
    const getPlaylists = () => {
        const data = localStorage.getItem(PLAYLISTS_KEY);
        return data ? JSON.parse(data) : {};
    };
    
    const getPlaylist = (name) => {
        const playlists = getPlaylists();
        return playlists[name] || null;
    };
    
    const deletePlaylist = (name) => {
        const playlists = getPlaylists();
        delete playlists[name];
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
        showNotification(`Playlist "${name}" deleted`, 'info');
    };
    
    const saveFavorites = (songs) => {
        const favorites = {
            songs,
            count: songs.length,
            updated: Date.now()
        };
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    };
    
    const getFavorites = () => {
        const data = localStorage.getItem(FAVORITES_KEY);
        return data ? JSON.parse(data).songs : [];
    };
    
    const addFavorite = (song) => {
        const favorites = getFavorites();
        if (!favorites.some(s => s.id === song.id)) {
            favorites.push(song);
            saveFavorites(favorites);
            showNotification(`Added "${song.title}" to favorites`, 'success');
        }
    };
    
    const removeFavorite = (songId) => {
        const favorites = getFavorites();
        const filtered = favorites.filter(s => s.id !== songId);
        saveFavorites(filtered);
    };
    
    const isFavorite = (songId) => {
        return getFavorites().some(s => s.id === songId);
    };
    
    const saveQueue = (songs) => {
        const queue = {
            songs,
            count: songs.length,
            saved: Date.now()
        };
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    };
    
    const getQueue = () => {
        const data = localStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data).songs : [];
    };
    
    const clearOldCache = () => {
        const playlists = getPlaylists();
        const now = Date.now();
        
        Object.keys(playlists).forEach(key => {
            if (now - playlists[key].updated > CACHE_EXPIRY) {
                delete playlists[key];
            }
        });
        
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    };
    
    const getCacheStats = () => {
        const playlists = getPlaylists();
        const favorites = getFavorites();
        const queue = getQueue();
        const totalSize = new Blob([
            localStorage.getItem(PLAYLISTS_KEY) || '',
            localStorage.getItem(FAVORITES_KEY) || '',
            localStorage.getItem(QUEUE_KEY) || ''
        ]).size;
        
        return {
            playlists: Object.keys(playlists).length,
            favorites: favorites.length,
            queue: queue.length,
            size: (totalSize / 1024).toFixed(2) + ' KB'
        };
    };
    
    const init = () => {
        clearOldCache();
        console.log('📦 Cache Stats:', getCacheStats());
    };
    
    return {
        savePlaylist,
        getPlaylists,
        getPlaylist,
        deletePlaylist,
        saveFavorites,
        getFavorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        saveQueue,
        getQueue,
        getCacheStats,
        init
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    PlaylistCache.init();
});

// Expose to window
window.PlaylistCache = PlaylistCache;

// Auto-save queue every 30 seconds
setInterval(() => {
    if (window.player && window.player.queue) {
        PlaylistCache.saveQueue(window.player.queue);
    }
}, 30000);
