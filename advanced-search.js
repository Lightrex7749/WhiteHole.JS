/**
 * WHITEHOLE - ADVANCED SEARCH ENGINE
 * Spotify-like search with proper filtering: Songs, Albums, Artists, Playlists
 */

const ADVANCED_SEARCH = {
    DEEZER_API: 'https://deezerdevs-deezer.p.rapidapi.com',
    API_HEADERS: {
        'X-RapidAPI-Key': 'bef7c89b22msh39c1b4ec2d71c5bp152d1ajsn87d10434f100',
        'X-RapidAPI-Host': 'deezerdevs-deezer.p.rapidapi.com'
    },
    currentResults: {
        tracks: [],
        albums: [],
        artists: [],
        playlists: []
    },
    currentFilter: 'all',
    currentQuery: ''
};

/**
 * Initialize advanced search system
 */
function initAdvancedSearch() {
    const searchInput = document.querySelector('.searchInput');
    if (!searchInput) return;

    // Remove old listener if exists
    searchInput.removeEventListener('input', handleSearchInput);
    
    // Add new optimized listener
    searchInput.addEventListener('input', debounce(handleSearchInput, 300));

    // Initialize filter buttons
    initFilterButtons();

    console.log('✅ Advanced Search System initialized');
}

/**
 * Handle search input with comprehensive results
 */
async function handleSearchInput(e) {
    const query = e.target.value.trim();
    const resultsArea = document.getElementById('results-area');
    const filterTabs = document.getElementById('search-filters');

    if (!query) {
        filterTabs.style.display = 'none';
        resultsArea.innerHTML = '';
        return;
    }

    ADVANCED_SEARCH.currentQuery = query;
    ADVANCED_SEARCH.currentFilter = 'all';

    // Show loading state
    resultsArea.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 32px; margin-bottom: 16px;"></i>
            <p>Searching across songs, albums, artists & playlists...</p>
        </div>
    `;

    try {
        // Fetch all types in parallel
        const [tracks, albums, artists, playlists] = await Promise.all([
            fetchSearchResults(query, 'track', 30),
            fetchSearchResults(query, 'album', 20),
            fetchSearchResults(query, 'artist', 20),
            fetchSearchResults(query, 'playlist', 20)
        ]);

        ADVANCED_SEARCH.currentResults = {
            tracks: tracks || [],
            albums: albums || [],
            artists: artists || [],
            playlists: playlists || []
        };

        // Show filters if we have results
        const hasResults = tracks.length > 0 || albums.length > 0 || artists.length > 0 || playlists.length > 0;
        filterTabs.style.display = hasResults ? 'flex' : 'none';

        // Render all results by default
        renderSearchResults('all');
        
        // Track search in language preferences
        if (window.languagePrefs) {
            window.languagePrefs.addToSearchHistory(query);
        }
    } catch (err) {
        console.error('Search error:', err);
        resultsArea.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <i class="fa-solid fa-exclamation-circle" style="font-size: 32px; margin-bottom: 16px;"></i>
                <p>Search failed. Please try again.</p>
            </div>
        `;
    }
}

/**
 * Fetch search results for specific type
 */
async function fetchSearchResults(query, type, limit = 20) {
    try {
        const response = await fetch(
            `${ADVANCED_SEARCH.DEEZER_API}/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}&index=0`,
            { headers: ADVANCED_SEARCH.API_HEADERS }
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        return data.data || [];
    } catch (err) {
        console.error(`Error fetching ${type}:`, err);
        return [];
    }
}

/**
 * Initialize filter buttons
 */
function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.removeEventListener('click', handleFilterClick);
        btn.addEventListener('click', handleFilterClick);
    });
}

/**
 * Handle filter button click
 */
function handleFilterClick(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const filter = btn.dataset.filter;
    ADVANCED_SEARCH.currentFilter = filter;

    // Update active state
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('filter-active');
    });
    btn.classList.add('filter-active');

    // Render filtered results
    renderSearchResults(filter);
}

/**
 * Render search results based on filter
 */
function renderSearchResults(filter) {
    const resultsArea = document.getElementById('results-area');
    if (!resultsArea) return;

    let html = '';

    switch(filter) {
        case 'track':
            html = renderSection('🎵 Songs', renderTrackCards(ADVANCED_SEARCH.currentResults.tracks), 'track');
            break;
        case 'album':
            html = renderSection('💿 Albums', renderAlbumCards(ADVANCED_SEARCH.currentResults.albums), 'album');
            break;
        case 'artist':
            html = renderSection('👤 Artists', renderArtistCards(ADVANCED_SEARCH.currentResults.artists), 'artist');
            break;
        case 'playlist':
            html = renderSection('📋 Playlists', renderPlaylistCards(ADVANCED_SEARCH.currentResults.playlists), 'playlist');
            break;
        case 'all':
        default:
            html = renderAllResults();
            break;
    }

    resultsArea.className = 'cards-grid';
    resultsArea.innerHTML = html || `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 32px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>No results found for "${escapeHtml(ADVANCED_SEARCH.currentQuery)}"</p>
        </div>
    `;
}

/**
 * Render all results mixed by type
 */
function renderAllResults() {
    let html = '';

    if (ADVANCED_SEARCH.currentResults.tracks.length > 0) {
        html += renderSection('🎵 Songs', renderTrackCards(ADVANCED_SEARCH.currentResults.tracks.slice(0, 8)), 'track');
    }

    if (ADVANCED_SEARCH.currentResults.albums.length > 0) {
        html += renderSection('💿 Albums', renderAlbumCards(ADVANCED_SEARCH.currentResults.albums.slice(0, 8)), 'album');
    }

    if (ADVANCED_SEARCH.currentResults.artists.length > 0) {
        html += renderSection('👤 Artists', renderArtistCards(ADVANCED_SEARCH.currentResults.artists.slice(0, 8)), 'artist');
    }

    if (ADVANCED_SEARCH.currentResults.playlists.length > 0) {
        html += renderSection('📋 Playlists', renderPlaylistCards(ADVANCED_SEARCH.currentResults.playlists.slice(0, 8)), 'playlist');
    }

    return html;
}

/**
 * Render section with title
 */
function renderSection(title, cards, type) {
    return `
        <div class="search-section-header" style="grid-column: 1 / -1; margin-bottom: 16px; margin-top: 32px; padding-top: 32px; border-top: 1px solid var(--border-subtle);">
            <h3 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-primary);">${title}</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0; margin: 0;">Found ${ADVANCED_SEARCH.currentResults[type === 'track' ? 'tracks' : type === 'album' ? 'albums' : type === 'artist' ? 'artists' : 'playlists'].length} results</p>
        </div>
        ${cards}
    `;
}

/**
 * Render track cards
 */
function renderTrackCards(tracks) {
    if (!tracks || tracks.length === 0) return '';
    return tracks.map(track => `
        <div class="result-card">
            <div class="card-image-container" onclick="playSong(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                <img src="${track.album?.cover_medium || track.picture_medium || 'img/whitehole.png'}" 
                     class="card-image" loading="lazy" alt="${track.title}">
                <div class="play-overlay">
                    <div class="play-btn-circle"><i class="fa-solid fa-play"></i></div>
                </div>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button class="action-pill-btn" onclick="addToQueueFromBtn(${JSON.stringify(track).replace(/"/g, '&quot;')})" title="Add to Queue">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <button class="action-pill-btn" onclick="toggleFavorite(${JSON.stringify(track).replace(/"/g, '&quot;')})" title="Add to Liked">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
            <h4 class="playing-title">${escapeHtml(track.title)}</h4>
            <p class="playing-artist">${escapeHtml(track.artist?.name || 'Unknown')}</p>
        </div>
    `).join('');
}

/**
 * Render album cards
 */
function renderAlbumCards(albums) {
    if (!albums || albums.length === 0) return '';
    return albums.map(album => `
        <div class="result-card">
            <div class="card-image-container" onclick="alert('Album: ${escapeHtml(album.title)}\\nArtist: ${escapeHtml(album.artist?.name || 'Various')}')">
                <img src="${album.cover_medium || 'img/whitehole.png'}" 
                     class="card-image" loading="lazy" alt="${album.title}">
                <div class="play-overlay">
                    <div class="play-btn-circle"><i class="fa-solid fa-compact-disc"></i></div>
                </div>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button class="action-pill-btn" title="View Album Info">
                    <i class="fa-solid fa-info"></i>
                </button>
            </div>
            <h4 class="playing-title">${escapeHtml(album.title)}</h4>
            <p class="playing-artist">${escapeHtml(album.artist?.name || 'Various Artists')}</p>
            <p style="font-size: 11px; color: var(--text-subdued); padding: 0 var(--spacing-sm); margin: 4px 0 0;">
                ${album.release_date?.split('-')[0] || 'N/A'} • ${album.nb_tracks || 0} tracks
            </p>
        </div>
    `).join('');
}

/**
 * Render artist cards
 */
function renderArtistCards(artists) {
    if (!artists || artists.length === 0) return '';
    return artists.map(artist => `
        <div class="result-card">
            <div class="card-image-container" onclick="alert('Artist: ${escapeHtml(artist.name)}\\nFans: ${(artist.nb_fan || 0).toLocaleString()}')">
                <img src="${artist.picture_medium || artist.picture_big || 'img/whitehole.png'}" 
                     class="card-image" loading="lazy" alt="${artist.name}" 
                     style="object-fit: cover; border-radius: 50%;">
                <div class="play-overlay">
                    <div class="play-btn-circle"><i class="fa-solid fa-user-music"></i></div>
                </div>
            </div>
            <h4 class="playing-title">${escapeHtml(artist.name)}</h4>
            <p class="playing-artist">
                <i class="fa-solid fa-heart" style="color: var(--accent-primary);"></i> 
                <span style="font-size: 12px;">${(artist.nb_fan || 0).toLocaleString()}</span>
            </p>
        </div>
    `).join('');
}

/**
 * Render playlist cards
 */
function renderPlaylistCards(playlists) {
    if (!playlists || playlists.length === 0) return '';
    return playlists.map(playlist => `
        <div class="result-card">
            <div class="card-image-container" onclick="alert('Playlist: ${escapeHtml(playlist.title)}\\nSongs: ${playlist.nb_tracks || 0}')">
                <img src="${playlist.picture_medium || playlist.picture_big || 'img/whitehole.png'}" 
                     class="card-image" loading="lazy" alt="${playlist.title}">
                <div class="play-overlay">
                    <div class="play-btn-circle"><i class="fa-solid fa-play"></i></div>
                </div>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button class="action-pill-btn" title="View Playlist">
                    <i class="fa-solid fa-arrow-up-right"></i>
                </button>
            </div>
            <h4 class="playing-title">${escapeHtml(playlist.title)}</h4>
            <p class="playing-artist">
                <i class="fa-solid fa-list-check"></i> 
                <span style="font-size: 12px;">${playlist.nb_tracks || 0} songs</span>
            </p>
        </div>
    `).join('');
}

/**
 * Escape HTML for safety
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

/**
 * Debounce helper
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedSearch);
} else {
    initAdvancedSearch();
}

// Global exports
window.initAdvancedSearch = initAdvancedSearch;
window.handleSearchInput = handleSearchInput;

console.log('✨ Advanced Search System loaded - Full filtering support!');
