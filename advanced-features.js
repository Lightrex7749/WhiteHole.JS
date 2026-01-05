/* =============================================================================
   WHITEHOLE MUSIC PLAYER - ADVANCED FEATURES
   ============================================================================= */

/* =============================================================================
   ADVANCED FEATURES STATE & DOM REFERENCES
   ============================================================================= */

// Advanced Features State
let isShuffleEnabled = false;
let repeatMode = 'off'; // 'off', 'queue', 'single'
let favorites = JSON.parse(localStorage.getItem('whitehole-favorites')) || [];
let originalQueue = []; // Store original queue for shuffle
let currentVolume = 0.5; // Default volume (50%)

// Additional DOM Elements
const volumeBtn = document.getElementById('volume-btn');
const volumeSlider = document.getElementById('volume-slider');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');

/* =============================================================================
   VOLUME CONTROL FUNCTIONALITY
   ============================================================================= */

/**
 * Initialize volume control
 */
function initializeVolumeControl() {
    // Set initial volume
    currentAudio.volume = currentVolume;
    volumeSlider.value = currentVolume * 100;
    updateVolumeIcon();
    
    // Volume slider event listener
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        setVolume(volume);
    });
    
    // Volume button click to mute/unmute
    volumeBtn.addEventListener('click', toggleMute);
}

/**
 * Set audio volume and save to Local Storage
 * @param {number} volume - Volume level (0-1)
 */
function setVolume(volume) {
    currentVolume = volume;
    currentAudio.volume = volume;
    volumeSlider.value = volume * 100;
    updateVolumeIcon();

    if(typeof musicStorage !== 'undefined') {
        musicStorage.saveVolume(volume);
        console.log(`💾 Volume ${Math.round(volume * 100)}% saved automatically`);
    }
}

/**
 * Toggle mute/unmute
 */
function toggleMute() {
    if (currentAudio.volume > 0) {
        // Mute
        currentAudio.volume = 0;
        volumeSlider.value = 0;
        updateVolumeIcon();
    } else {
        // Unmute to previous volume
        currentAudio.volume = currentVolume;
        volumeSlider.value = currentVolume * 100;
        updateVolumeIcon();
    }
}

/**
 * Update volume icon based on current volume
 */
function updateVolumeIcon() {
    const volume = currentAudio.volume;
    const icon = volumeBtn.querySelector('i');
    
    if (volume === 0) {
        icon.className = 'fa-solid fa-volume-xmark';
    } else if (volume < 0.5) {
        icon.className = 'fa-solid fa-volume-low';
    } else {
        icon.className = 'fa-solid fa-volume-high';
    }
}

/* =============================================================================
   SHUFFLE FUNCTIONALITY
   ============================================================================= */

/**
 * Toggle shuffle mode (no localStorage saving)
 */
function toggleShuffle() {
    isShuffleEnabled = !isShuffleEnabled;
    updateShuffleButton();

    if (typeof musicStorage !== 'undefined') {
        musicStorage.saveShuffle(isShuffleEnabled);
        console.log(`💾 Shuffle ${isShuffleEnabled ? 'ON' : 'OFF'} saved automatically`);
    }
    
    if (isShuffleEnabled) {
        enableShuffle();
        showNotification('Shuffle enabled', 'info');
    } else {
        disableShuffle();
        showNotification('Shuffle disabled', 'info');
    }
}

/**
 * Enable shuffle mode
 */
function enableShuffle() {
    // Store original queue order
    originalQueue = [...queue];
    
    // Shuffle the queue (except currently playing song)
    if (currentQueueIndex >= 0 && queue.length > 1) {
        const currentSong = queue[currentQueueIndex];
        const otherSongs = queue.filter((_, index) => index !== currentQueueIndex);
        
        // Shuffle other songs
        for (let i = otherSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
        }
        
        // Rebuild queue with current song first, then shuffled songs
        queue.length = 0;
        queue.push(currentSong, ...otherSongs);
        currentQueueIndex = 0;
        
        updateQueueDisplay();
        updateQueueHighlight();
    }
}

/**
 * Disable shuffle mode
 */
function disableShuffle() {
    if (originalQueue.length > 0) {
        // Find current song in original queue
        const currentSong = currentPlayingSong;
        
        // Restore original queue
        queue.length = 0;
        queue.push(...originalQueue);
        
        // Update current index
        if (currentSong) {
            currentQueueIndex = queue.findIndex(song => song.id === currentSong.id);
        }
        
        updateQueueDisplay();
        updateQueueHighlight();
    }
}

/**
 * Update shuffle button appearance
 */
function updateShuffleButton() {
    if (isShuffleEnabled) {
        shuffleBtn.classList.add('active');
        shuffleBtn.style.color = '#8a2be2';
    } else {
        shuffleBtn.classList.remove('active');
        shuffleBtn.style.color = 'var(--text-base)';
    }
}

/* =============================================================================
   REPEAT/LOOP FUNCTIONALITY
   ============================================================================= */

/**
 * Toggle repeat mode (off -> queue -> single -> off)
 */
function toggleRepeat() {
    switch(repeatMode) {
        case 'off':
            repeatMode = 'queue';
            showNotification('Repeat queue enabled (session only)', 'info');
            break;
        case 'queue':
            repeatMode = 'single';
            showNotification('Repeat single song enabled (session only)', 'info');
            break;
        case 'single':
            repeatMode = 'off';
            showNotification('Repeat disabled', 'info');
            break;
    }
    
    updateRepeatButton();
}

/**
 * Update repeat button appearance
 */
function updateRepeatButton() {
    const icon = repeatBtn.querySelector('i');
    
    // Remove existing indicator first
    const existingIndicator = repeatBtn.querySelector('.repeat-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    switch(repeatMode) {
        case 'off':
            repeatBtn.classList.remove('repeat-off', 'repeat-queue', 'repeat-single', 'active');
            repeatBtn.classList.add('repeat-off');
            repeatBtn.style.color = 'var(--text-base)';
            repeatBtn.style.background = 'none';
            icon.className = 'fa-solid fa-repeat';
            break;
        case 'queue':
            repeatBtn.classList.remove('repeat-off', 'repeat-queue', 'repeat-single', 'active');
            repeatBtn.classList.add('repeat-queue', 'active');
            repeatBtn.style.color = '#8a2be2';
            repeatBtn.style.background = 'rgba(138, 43, 226, 0.15)';
            icon.className = 'fa-solid fa-repeat';
            break;
        case 'single':
            repeatBtn.classList.remove('repeat-off', 'repeat-queue', 'repeat-single', 'active');
            repeatBtn.classList.add('repeat-single', 'active');
            repeatBtn.style.color = '#8a2be2';
            repeatBtn.style.background = 'rgba(138, 43, 226, 0.2)';
            icon.className = 'fa-solid fa-repeat';
            
            // Add clean number indicator
            const indicator = document.createElement('span');
            indicator.className = 'repeat-indicator';
            indicator.textContent = '1';
            repeatBtn.appendChild(indicator);
            break;
    }
}

/* =============================================================================
   FAVORITES FUNCTIONALITY - ENHANCED WITH STORAGE
   ============================================================================= */

/**
 * Toggle favorite status of current song
 */
function toggleFavorite(song = currentPlayingSong) {
    if (!song || !song.id) {
        showNotification('No valid song to favorite', 'warning');
        return;
    }
    
    console.log('💝 Toggling favorite for:', song.title);
    
    // Load current favorites
    let currentFavorites = [];
    if (typeof musicStorage !== 'undefined') {
        currentFavorites = musicStorage.loadFavorites();
    } else if (typeof favorites !== 'undefined') {
        currentFavorites = [...favorites]; // Create copy
    }
    
    // Check if song is already favorited
    const isFavorited = currentFavorites.some(fav => fav.id === song.id);
    
    if (isFavorited) {
        // Remove from favorites
        currentFavorites = currentFavorites.filter(fav => fav.id !== song.id);
        showNotification(`💔 Removed "${song.title}" from favorites`, 'success');
        console.log(`💔 Removed "${song.title}" from favorites`);
    } else {
        // Add to favorites with timestamp
        const favoriteEntry = {
            ...song,
            favoritedAt: new Date().toISOString()
        };
        currentFavorites.push(favoriteEntry);
        showNotification(`💝 Added "${song.title}" to favorites`, 'success');
        console.log(`💝 Added "${song.title}" to favorites`);
    }
    
    // Save to localStorage
    if (typeof musicStorage !== 'undefined') {
        musicStorage.saveFavorites(currentFavorites);
        console.log('💾 Favorites saved to localStorage');
    }
    
    // Update global favorites variable
    if (typeof favorites !== 'undefined') {
        favorites.length = 0;
        favorites.push(...currentFavorites);
    }
    
    // Update heart button immediately
    updateHeartButton(song);
    
    // Update any other favorite UI elements
    if (typeof updateFavoriteButtons === 'function') {
        updateFavoriteButtons();
    }
    
    console.log(`💝 Toggle complete. Total favorites: ${currentFavorites.length}`);
}


/**
 * Check if a song is favorited
 */
function isFavorited(song) {
    // USE SIMPLE favorites ARRAY
    return favorites.some(fav => fav.id === song.id);
    
    // NOT:
    // return storageManager.favorites.isFavorited(song);
}

/**
 * Update favorite button states throughout the UI
 */
function updateFavoriteButtons() {
    // Update heart button in player controls
    const heartBtn = document.getElementById('heart-btn');
    if (heartBtn && currentPlayingSong) {
        if (isFavorited(currentPlayingSong)) {
            heartBtn.classList.add('favorited');
            heartBtn.style.color = '#e74c3c';
        } else {
            heartBtn.classList.remove('favorited');
            heartBtn.style.color = '';
        }
    }
    
    // Update favorite buttons in search results
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const songId = btn.dataset.songId;
        // USE SIMPLE favorites ARRAY, NOT storageManager
        if (favorites.some(fav => fav.id == songId)) {
            btn.classList.add('favorited');
            btn.style.color = '#e74c3c';
        } else {
            btn.classList.remove('favorited');
            btn.style.color = '';
        }
    });
}

/**
 * Display all favorited songs safely
 */
function showFavorites() {
    console.log('💝 Showing favorites...');
    
    // Load favorites from localStorage
    let currentFavorites = [];
    if (typeof musicStorage !== 'undefined') {
        currentFavorites = musicStorage.loadFavorites();
    } else if (typeof favorites !== 'undefined') {
        currentFavorites = favorites;
    }
    
    console.log('💝 Raw favorites loaded:', currentFavorites);
    
    // Sanitize favorites data to prevent errors
    const safeFavorites = currentFavorites.map(song => {
        const safeSong = {
            id: song.id || Math.random().toString(),
            title: song.title || 'Unknown Title',
            artist: {
                name: (song.artist && song.artist.name) || 'Unknown Artist'
            },
            album: {
                cover_medium: (song.album && song.album.cover_medium) || 
                             (song.album && song.album.cover_small) || 
                             (song.album && song.album.cover) || 
                             createPlaceholderImage() // LOCAL placeholder
            },
            duration: song.duration || 30,
            preview: song.preview || '',
            favoritedAt: song.favoritedAt || new Date().toISOString()
        };
        
        return safeSong;
    });
    
    console.log('💝 Sanitized favorites with local placeholders:', safeFavorites);
    
    // Display favorites safely with 'favorites' context
    if (typeof showResults === 'function') {
        showResults(safeFavorites, 'favorites'); // Add context parameter
    } else {
        console.error('❌ showResults function not found');
    }
    
    showNotification(`Showing ${safeFavorites.length} favorite songs`, 'info');
    console.log(`💝 Displayed ${safeFavorites.length} favorites safely`);
}

/**
 * Update heart button to show if current song is favorited
 * @param {Object} song - Current playing song (optional)
 */
function updateHeartButton(song = currentPlayingSong) {
    const heartBtn = document.getElementById('heart-btn');
    if (!heartBtn || !song) {
        console.log('💔 Heart button or song not found for update');
        return;
    }
    
    // Load current favorites from localStorage
    let currentFavorites = [];
    if (typeof musicStorage !== 'undefined') {
        currentFavorites = musicStorage.loadFavorites();
    } else if (typeof favorites !== 'undefined') {
        currentFavorites = favorites;
    }
    
    // Check if current song is favorited
    const isFavorited = currentFavorites.some(fav => fav.id === song.id);
    
    // Update heart button appearance
    const heartIcon = heartBtn.querySelector('i');
    
    if (isFavorited) {
        // Song is favorited - show filled red heart
        heartBtn.classList.add('favorited');
        heartBtn.style.color = '#ff6b6b';
        if (heartIcon) {
            heartIcon.className = 'fa-solid fa-heart'; // Filled heart
        }
        heartBtn.title = 'Remove from Favorites';
        console.log(`💝 Heart button updated: "${song.title}" is favorited`);
    } else {
        // Song not favorited - show empty heart
        heartBtn.classList.remove('favorited');
        heartBtn.style.color = '';
        if (heartIcon) {
            heartIcon.className = 'fa-regular fa-heart'; // Empty heart
        }
        heartBtn.title = 'Add to Favorites';
        console.log(`🤍 Heart button updated: "${song.title}" not favorited`);
    }
}

/* =============================================================================
   ENHANCED PLAYBACK LOGIC WITH ADVANCED FEATURES
   ============================================================================= */

/**
 * Enhanced playNext with repeat and shuffle logic
 */
function playNext() {
    if (queue.length === 0) {
        showNotification('Queue is empty', 'warning');
        return;
    }
    
    // Handle single song repeat
    if (repeatMode === 'single' && currentQueueIndex >= 0) {
        playFromQueue(currentQueueIndex);
        return;
    }
    
    // If no song playing from queue, start from beginning
    if (currentQueueIndex === -1) {
        playFromQueue(0);
        return;
    }
    
    const nextIndex = currentQueueIndex + 1;
    
    if (nextIndex < queue.length) {
        playFromQueue(nextIndex);
    } else {
        // Reached end of queue
        if (repeatMode === 'queue') {
            // Loop back to beginning
            playFromQueue(0);
            showNotification('Queue restarted', 'info');
        } else {
            // No repeat - stop or show notification
            showNotification('Reached end of queue', 'info');
            if (isShuffleEnabled) {
                // Re-shuffle and start over
                enableShuffle();
                playFromQueue(0);
            }
        }
    }
}

/**
 * Enhanced playPrevious with repeat logic
 */
function playPrevious() {
    if (queue.length === 0) {
        showNotification('Queue is empty', 'warning');
        return;
    }
    
    // If no song playing from queue, start from end
    if (currentQueueIndex === -1) {
        playFromQueue(queue.length - 1);
        return;
    }
    
    const prevIndex = currentQueueIndex - 1;
    
    if (prevIndex >= 0) {
        playFromQueue(prevIndex);
    } else {
        // Reached beginning
        if (repeatMode === 'queue') {
            // Loop to end
            playFromQueue(queue.length - 1);
            showNotification('Jumped to end of queue', 'info');
        } else {
            // No repeat - restart current song or go to end
            playFromQueue(queue.length - 1);
        }
    }
}

/* =============================================================================
   KEYBOARD SHORTCUTS
   ============================================================================= */

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') return;
    
    switch(e.key) {
        case ' ': // Spacebar - play/pause
            e.preventDefault();
            document.getElementById('play-btn').click();
            break;
        case 'ArrowRight': // Right arrow - next song
            e.preventDefault();
            playNext();
            break;
        case 'ArrowLeft': // Left arrow - previous song
            e.preventDefault();
            playPrevious();
            break;
        case 'ArrowUp': // Up arrow - volume up
            e.preventDefault();
            setVolume(Math.min(1, currentAudio.volume + 0.1));
            break;
        case 'ArrowDown': // Down arrow - volume down
            e.preventDefault();
            setVolume(Math.max(0, currentAudio.volume - 0.1));
            break;
        case 'm': // M - mute/unmute
        case 'M':
            e.preventDefault();
            toggleMute();
            break;
        case 's': // S - shuffle
        case 'S':
            e.preventDefault();
            toggleShuffle();
            break;
        case 'r': // R - repeat
        case 'R':
            e.preventDefault();
            toggleRepeat();
            break;
        case 'f': // F - favorite
        case 'F':
            e.preventDefault();
            toggleFavorite();
            break;
    }
});

/* =============================================================================
   INITIALIZATION
   ============================================================================= */

/**
 * Initialize all advanced features (no localStorage)
 */
function initializeAdvancedFeatures() {
    // Initialize volume control
    initializeVolumeControl();
    
    // Event listeners for control buttons
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', toggleShuffle);
    }
    
    if (repeatBtn) {
        repeatBtn.addEventListener('click', toggleRepeat);
    }
    
    
    console.log('🎵 Advanced features (no storage) initialized!');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAdvancedFeatures();
});

console.log('🎵 Advanced Features initialized successfully!');

/**
 * Initialize heart button event listener
 */
function initializeHeartButton() {
    const heartBtn = document.getElementById('heart-btn');
    
    if (heartBtn) {
        // Remove any existing event listeners
        heartBtn.replaceWith(heartBtn.cloneNode(true));
        const newHeartBtn = document.getElementById('heart-btn');
        
        // Add click event listener
        newHeartBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            console.log('💝 Heart button clicked!');
            
            if (currentPlayingSong) {
                toggleFavorite(currentPlayingSong);
            } else {
                showNotification('No song is currently playing', 'warning');
            }
        });
        
        console.log('💝 Heart button event listener initialized');
    } else {
        console.warn('⚠️ Heart button (#heart-btn) not found in DOM');
    }
}

function initializeFavoritesSystem() {
    console.log('💝 Initializing favorites system...');
    
    // Initialize heart button
    setTimeout(() => {
        initializeHeartButton();
        
        // Update heart button if song is playing
        if (currentPlayingSong) {
            updateHeartButton(currentPlayingSong);
        }
        
        console.log('💝 Favorites system initialized');
    }, 1500);
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeFavoritesSystem);

// Also initialize on window load (backup)
window.addEventListener('load', function() {
    if (!window.favoritesSystemInitialized) {
        initializeFavoritesSystem();
        window.favoritesSystemInitialized = true;
    }
});

/**
 * Debug function to test favorites system
 */
function debugFavorites() {
    console.log('🔍 FAVORITES DEBUG INFO:');
    console.log('Heart button element:', document.getElementById('heart-btn'));
    console.log('Current playing song:', currentPlayingSong);
    console.log('Favorites array:', typeof favorites !== 'undefined' ? favorites : 'undefined');
    console.log('localStorage favorites:', typeof musicStorage !== 'undefined' ? musicStorage.loadFavorites() : 'musicStorage undefined');
    console.log('updateHeartButton function:', typeof updateHeartButton);
    console.log('toggleFavorite function:', typeof toggleFavorite);
}

// Make debug function available globally
window.debugFavorites = debugFavorites;

/**
 * Display recently played songs
 */
function showRecentlyPlayed() {
    console.log('🕒 Showing recently played songs...');
    
    // Load recently played from localStorage
    let recentlyPlayed = [];
    if (typeof musicStorage !== 'undefined') {
        recentlyPlayed = musicStorage.loadRecentlyPlayed();
    }
    
    console.log('🕒 Raw recently played loaded:', recentlyPlayed);
    
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
        showEmptyRecentlyPlayedAdvanced();
        return;
    }
    
    // Sanitize recently played data (same as favorites)
    const safeRecentlyPlayed = recentlyPlayed.map(song => {
        const safeSong = {
            id: song.id || Math.random().toString(),
            title: song.title || 'Unknown Title',
            artist: {
                name: (song.artist && song.artist.name) || 'Unknown Artist'
            },
            album: {
                cover_medium: (song.album && song.album.cover_medium) || 
                             (song.album && song.album.cover_small) || 
                             (song.album && song.album.cover) || 
                             createPlaceholderImage() // LOCAL placeholder
            },
            duration: song.duration || 30,
            preview: song.preview || '',
            playedAt: song.playedAt || new Date().toISOString()
        };
        
        return safeSong;
    });
    
    console.log('🕒 Sanitized recently played:', safeRecentlyPlayed);
    
    // Display recently played using the same grid system as favorites
    showRecentlyPlayedResults(safeRecentlyPlayed);
    
    showNotification(`Showing ${safeRecentlyPlayed.length} recently played songs`, 'info');
    console.log(`🕒 Displayed ${safeRecentlyPlayed.length} recently played songs`);
}

/**
 * Display recently played results with timestamp info
 * @param {Array} songs - Array of recently played songs
 */
function showRecentlyPlayedResults(songs) {
    // Use showResults with 'recent' context instead of custom function
    if (typeof showResults === 'function') {
        showResults(songs, 'recent'); // Add context parameter
    } else {
        console.error('❌ showResults function not found');
    }
}

/**
 * Calculate time ago from a date
 * @param {Date} date - Date to calculate from
 * @returns {string} Human readable time ago
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

/**
 * Show empty recently played state (from advanced-features.js)
 */
function showEmptyRecentlyPlayedAdvanced() {
    const resultsContainer = document.querySelector('.main-content');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fa-solid fa-clock-rotate-left" style="font-size: 3rem; color: #666; margin-bottom: 1rem;"></i>
                <h3>No recently played songs</h3>
                <p>Start playing some music to see your listening history here!</p>
                <div style="margin-top: 2rem;">
                    <button onclick="document.querySelector('.searchInput').focus()" style="background: #8a2be2; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 25px; cursor: pointer; font-size: 0.875rem;">
                        <i class="fa-solid fa-search" style="margin-right: 0.5rem;"></i>
                        Search for Music
                    </button>
                </div>
            </div>
        `;
    }
}