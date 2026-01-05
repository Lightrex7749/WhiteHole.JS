/* =============================================================================
   WHITEHOLE MUSIC PLAYER - AUTO SUGGESTIONS & RECOMMENDATIONS
   Generates song suggestions based on currently playing music
   ============================================================================= */

(function() {
    'use strict';

    const SUGGESTION_LIMIT = 12;
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    let suggestionCache = {};

    /* =============================================================================
       FETCH SIMILAR SONGS (ARTIST, GENRE, POPULARITY)
       ============================================================================= */

    /**
     * Fetch recommendations based on current song
     */
    async function fetchSuggestionsForSong(song) {
        if (!song || !song.id) return [];

        // Check cache first
        const cacheKey = `suggestions_${song.id}`;
        if (suggestionCache[cacheKey] && Date.now() - suggestionCache[cacheKey].timestamp < CACHE_DURATION) {
            console.log('📌 Using cached suggestions for', song.title);
            return suggestionCache[cacheKey].data;
        }

        try {
            // Try multiple API calls for recommendations
            const [similarByArtist, similarByGenre, trendingSimilar] = await Promise.all([
                fetchSimilarByArtist(song),
                fetchSimilarByGenre(song),
                fetchTrendingSimilar(song)
            ]);

            // Merge and deduplicate results
            const allSuggestions = [...similarByArtist, ...similarByGenre, ...trendingSimilar];
            const deduplicated = deduplicateSongs(allSuggestions, [song.id]);
            const topSuggestions = deduplicated.slice(0, SUGGESTION_LIMIT);

            // Cache results
            suggestionCache[cacheKey] = {
                data: topSuggestions,
                timestamp: Date.now()
            };

            console.log(`✅ Found ${topSuggestions.length} suggestions for "${song.title}"`);
            return topSuggestions;
        } catch (err) {
            console.error('❌ Error fetching suggestions:', err);
            return [];
        }
    }

    /**
     * Fetch songs by same artist
     */
    async function fetchSimilarByArtist(song) {
        try {
            if (!song.artist?.id) return [];
            const res = await fetch(`https://api.deezer.com/artist/${song.artist.id}/top?limit=12`);
            const data = await res.json();
            return data.data || [];
        } catch (err) {
            console.warn('⚠️ Could not fetch artist tracks:', err);
            return [];
        }
    }

    /**
     * Fetch songs by genre/style (via related artists)
     */
    async function fetchSimilarByGenre(song) {
        try {
            if (!song.artist?.id) return [];
            const res = await fetch(`https://api.deezer.com/artist/${song.artist.id}/related`);
            const data = await res.json();
            
            if (!data.data || data.data.length === 0) return [];

            // Get top tracks from related artists
            const relatedArtistIds = data.data.slice(0, 3).map(a => a.id);
            const relatedTracks = await Promise.all(
                relatedArtistIds.map(id =>
                    fetch(`https://api.deezer.com/artist/${id}/top?limit=5`)
                        .then(r => r.json())
                        .then(d => d.data || [])
                        .catch(() => [])
                )
            );

            return relatedTracks.flat();
        } catch (err) {
            console.warn('⚠️ Could not fetch genre-similar songs:', err);
            return [];
        }
    }

    /**
     * Fetch trending songs by searching similar keywords
     */
    async function fetchTrendingSimilar(song) {
        try {
            // Extract keywords from song title
            const keywords = song.title
                .split(/[\s\-()]/)
                .filter(w => w.length > 3)
                .slice(0, 2);

            if (keywords.length === 0) return [];

            const searchQuery = keywords.join(' ');
            const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchQuery)}&limit=12`);
            const data = await res.json();
            return data.data || [];
        } catch (err) {
            console.warn('⚠️ Could not fetch trending suggestions:', err);
            return [];
        }
    }

    /**
     * Remove duplicates and excluded songs
     */
    function deduplicateSongs(songs, excludeIds = []) {
        const seen = new Set(excludeIds);
        const result = [];

        for (const song of songs) {
            const id = song.id;
            if (!seen.has(id)) {
                seen.add(id);
                result.push(song);
            }
        }

        return result;
    }

    /* =============================================================================
       RENDER SUGGESTIONS UI
       ============================================================================= */

    /**
     * Display suggestions in a dedicated section
     */
    function renderSuggestions(suggestions, currentSongTitle) {
        const mainContent = document.querySelector('.content-container');
        if (!mainContent) return;

        // Check if suggestions section already exists
        let suggestionsSection = document.getElementById('suggestions-section');
        if (!suggestionsSection) {
            suggestionsSection = document.createElement('section');
            suggestionsSection.id = 'suggestions-section';
            suggestionsSection.className = 'suggestions-section';
            mainContent.appendChild(suggestionsSection);
        }

        if (suggestions.length === 0) {
            suggestionsSection.innerHTML = `
                <div class="suggestions-empty">
                    <i class="fa-solid fa-music"></i>
                    <p>No suggestions available</p>
                </div>
            `;
            return;
        }

        suggestionsSection.innerHTML = `
            <div class="suggestions-header">
                <div>
                    <h2 class="suggestions-title">✨ Recommended for You</h2>
                    <p class="suggestions-subtitle">Based on: <strong>"${currentSongTitle}"</strong></p>
                </div>
            </div>

            <div class="suggestions-grid">
                ${suggestions.map(song => `
                    <div class="suggestion-card" onclick="playSong(${JSON.stringify(song).replace(/"/g, '&quot;')})">
                        <div class="suggestion-image-wrapper">
                            <img src="${song.album?.cover_medium || song.album?.cover || 'img/placeholder.svg'}" 
                                 alt="${song.title}" 
                                 class="suggestion-image"
                                 loading="lazy">
                            <div class="suggestion-overlay">
                                <div class="suggestion-play-btn">
                                    <i class="fa-solid fa-play"></i>
                                </div>
                            </div>
                            <div class="suggestion-actions" onclick="event.stopPropagation()">
                                <button class="suggestion-action-btn" 
                                        onclick="addToQueueFromBtn(${JSON.stringify(song).replace(/"/g, '&quot;')})" 
                                        title="Add to Queue">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                                <button class="suggestion-action-btn" 
                                        onclick="toggleFavorite(${JSON.stringify(song).replace(/"/g, '&quot;')})" 
                                        title="Save to Favorites">
                                    <i class="fa-solid fa-heart"></i>
                                </button>
                            </div>
                        </div>
                        <div class="suggestion-info">
                            <div class="suggestion-title">${song.title}</div>
                            <div class="suggestion-artist">${song.artist?.name || 'Unknown'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        console.log(`🎨 Rendered ${suggestions.length} suggestions`);
    }

    /**
     * Clear suggestions section
     */
    function clearSuggestions() {
        const suggestionsSection = document.getElementById('suggestions-section');
        if (suggestionsSection) {
            suggestionsSection.innerHTML = '';
        }
    }

    /* =============================================================================
       INTEGRATION WITH PLAYER
       ============================================================================= */

    /**
     * Initialize auto-suggestions (call after song starts playing)
     */
    async function initializeSuggestions(song) {
        if (!song || !song.id) return;

        console.log(`🎵 Fetching suggestions for: ${song.title}`);
        const suggestions = await fetchSuggestionsForSong(song);
        renderSuggestions(suggestions, song.title);
    }

    /**
     * Hook into player to auto-update suggestions
     */
    function hookIntoPlayer() {
        // Store original playSong function
        const originalPlaySong = window.playSong;

        if (originalPlaySong) {
            window.playSong = async function(song) {
                // Call original function
                originalPlaySong.call(this, song);
                
                // Update suggestions
                setTimeout(() => initializeSuggestions(song), 500);
            };
        }

        // Also hook into playFromQueue
        const originalPlayFromQueue = window.playFromQueue;
        if (originalPlayFromQueue) {
            window.playFromQueue = function(index) {
                const queue = window.globalQueue || [];
                const song = queue[index];
                originalPlayFromQueue.call(this, index);
                
                setTimeout(() => initializeSuggestions(song), 500);
            };
        }
    }

    /**
     * Clear cache periodically
     */
    function cleanupCache() {
        const now = Date.now();
        for (const key in suggestionCache) {
            if (now - suggestionCache[key].timestamp > CACHE_DURATION) {
                delete suggestionCache[key];
            }
        }
    }

    // Clean cache every 5 minutes
    setInterval(cleanupCache, 5 * 60 * 1000);

    /* =============================================================================
       EXPORT FUNCTIONS TO GLOBAL SCOPE
       ============================================================================= */

    window.initializeSuggestions = initializeSuggestions;
    window.fetchSuggestionsForSong = fetchSuggestionsForSong;
    window.renderSuggestions = renderSuggestions;
    window.clearSuggestions = clearSuggestions;

    // Hook into player when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hookIntoPlayer);
    } else {
        hookIntoPlayer();
    }

    console.log('✅ Suggestions module loaded');

})();
