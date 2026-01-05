/* =============================================================================
   WHITEHOLE SEARCH FILTERS - SPOTIFY-LIKE SEARCH
   Filters search results by type: Songs, Albums, Artists, Playlists
   ============================================================================= */

(function() {
    'use strict';

    let currentQuery = '';
    let currentFilter = 'all';
    let allSearchResults = {
        tracks: [],
        albums: [],
        artists: [],
        playlists: []
    };

    const DEEZER_API = 'https://deezerdevs-deezer.p.rapidapi.com';
    const API_HEADERS = {
        'X-RapidAPI-Key': 'bef7c89b22msh39c1b4ec2d71c5bp152d1ajsn87d10434f100',
        'X-RapidAPI-Host': 'deezerdevs-deezer.p.rapidapi.com'
    };

    /**
     * Initialize filter buttons
     */
    function initializeFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
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
        currentFilter = filter;

        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('filter-active');
        });
        btn.classList.add('filter-active');

        // Render filtered results
        renderFilteredResults(filter);
    }

    /**
     * Perform comprehensive search across all types
     */
    async function performComprehensiveSearch(query) {
        currentQuery = query;
        const filters = document.getElementById('search-filters');
        
        if (!query) {
            filters.style.display = 'none';
            return;
        }

        try {
            // Fetch different types simultaneously
            const [tracks, albums, artists, playlists] = await Promise.all([
                searchByType(query, 'track'),
                searchByType(query, 'album'),
                searchByType(query, 'artist'),
                searchByType(query, 'playlist')
            ]);

            allSearchResults = {
                tracks: tracks || [],
                albums: albums || [],
                artists: artists || [],
                playlists: playlists || []
            };

            // Show filters if any results
            const hasResults = tracks.length > 0 || albums.length > 0 || artists.length > 0;
            filters.style.display = hasResults ? 'flex' : 'none';

            // Reset filter to 'all' and render
            currentFilter = 'all';
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('filter-active');
            });
            document.querySelector('[data-filter="all"]').classList.add('filter-active');

            renderFilteredResults('all');
        } catch (err) {
            console.error('Search error:', err);
        }
    }

    /**
     * Search by specific type using Deezer API
     */
    async function searchByType(query, type) {
        try {
            const response = await fetch(
                `${DEEZER_API}/search/${type}?q=${encodeURIComponent(query)}&limit=30`,
                { headers: API_HEADERS }
            );
            const json = await response.json();
            return json.data || [];
        } catch (err) {
            console.error(`Error searching ${type}:`, err);
            return [];
        }
    }

    /**
     * Render results based on current filter
     */
    function renderFilteredResults(filter) {
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;

        let html = '';

        switch(filter) {
            case 'track':
                html = renderTracks(allSearchResults.tracks);
                break;
            case 'album':
                html = renderAlbums(allSearchResults.albums);
                break;
            case 'artist':
                html = renderArtists(allSearchResults.artists);
                break;
            case 'playlist':
                html = renderPlaylists(allSearchResults.playlists);
                break;
            case 'all':
            default:
                html = renderAll();
                break;
        }

        resultsArea.innerHTML = html;
    }

    /**
     * Render all results mixed
     */
    function renderAll() {
        let html = '';

        // Tracks section
        if (allSearchResults.tracks.length > 0) {
            html += `
                <div class="search-section">
                    <h3 class="search-section-title">
                        <i class="fa-solid fa-song"></i> Songs
                    </h3>
                    <div class="music-grid">
                        ${allSearchResults.tracks.slice(0, 6).map(t => renderTrackCard(t)).join('')}
                    </div>
                </div>
            `;
        }

        // Albums section
        if (allSearchResults.albums.length > 0) {
            html += `
                <div class="search-section">
                    <h3 class="search-section-title">
                        <i class="fa-solid fa-compact-disc"></i> Albums
                    </h3>
                    <div class="music-grid">
                        ${allSearchResults.albums.slice(0, 6).map(a => renderAlbumCard(a)).join('')}
                    </div>
                </div>
            `;
        }

        // Artists section
        if (allSearchResults.artists.length > 0) {
            html += `
                <div class="search-section">
                    <h3 class="search-section-title">
                        <i class="fa-solid fa-user-music"></i> Artists
                    </h3>
                    <div class="music-grid">
                        ${allSearchResults.artists.slice(0, 6).map(ar => renderArtistCard(ar)).join('')}
                    </div>
                </div>
            `;
        }

        return html || '<div class="no-results">No results found</div>';
    }

    /**
     * Render track cards
     */
    function renderTracks(tracks) {
        if (tracks.length === 0) return '<div class="no-results">No songs found</div>';

        return `
            <div class="music-grid">
                ${tracks.map(t => renderTrackCard(t)).join('')}
            </div>
        `;
    }

    /**
     * Render single track card
     */
    function renderTrackCard(track) {
        return `
            <div class="result-card" onclick="playSong(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                <div class="card-image-container">
                    <img src="${track.album?.cover_medium || track.picture_medium || 'img/whitehole.png'}" 
                         class="card-image" loading="lazy" alt="${track.title}">
                    <div class="play-overlay">
                        <div class="play-btn-circle"><i class="fa-solid fa-play"></i></div>
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="action-pill-btn" onclick="addToQueueFromBtn(${JSON.stringify(track).replace(/"/g, '&quot;')})" 
                                title="Add to Queue">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button class="action-pill-btn" onclick="toggleFavorite(${JSON.stringify(track).replace(/"/g, '&quot;')})" 
                                title="Save">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                </div>
                <h4 class="playing-title">${escapeHtml(track.title)}</h4>
                <p class="playing-artist">${escapeHtml(track.artist?.name || 'Unknown')}</p>
            </div>
        `;
    }

    /**
     * Render album cards
     */
    function renderAlbums(albums) {
        if (albums.length === 0) return '<div class="no-results">No albums found</div>';

        return `
            <div class="music-grid">
                ${albums.map(a => renderAlbumCard(a)).join('')}
            </div>
        `;
    }

    /**
     * Render single album card
     */
    function renderAlbumCard(album) {
        return `
            <div class="result-card album-card" title="Click to view album">
                <div class="card-image-container">
                    <img src="${album.cover_medium}" class="card-image" loading="lazy" alt="${album.title}">
                    <div class="play-overlay">
                        <div class="play-btn-circle"><i class="fa-solid fa-compact-disc"></i></div>
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="action-pill-btn" title="View Album">
                            <i class="fa-solid fa-arrow-up-right"></i>
                        </button>
                    </div>
                </div>
                <h4 class="playing-title">${escapeHtml(album.title)}</h4>
                <p class="playing-artist">${escapeHtml(album.artist?.name || 'Various Artists')}</p>
                <p class="album-year">${album.release_date?.split('-')[0] || 'N/A'}</p>
            </div>
        `;
    }

    /**
     * Render artist cards
     */
    function renderArtists(artists) {
        if (artists.length === 0) return '<div class="no-results">No artists found</div>';

        return `
            <div class="music-grid">
                ${artists.map(ar => renderArtistCard(ar)).join('')}
            </div>
        `;
    }

    /**
     * Render single artist card
     */
    function renderArtistCard(artist) {
        return `
            <div class="result-card artist-card" title="Click to view artist">
                <div class="card-image-container artist-container">
                    <img src="${artist.picture_medium || 'img/whitehole.png'}" 
                         class="card-image artist-image" loading="lazy" alt="${artist.name}">
                    <div class="play-overlay">
                        <div class="play-btn-circle"><i class="fa-solid fa-user-music"></i></div>
                    </div>
                </div>
                <h4 class="playing-title">${escapeHtml(artist.name)}</h4>
                <p class="artist-fans">
                    <i class="fa-solid fa-heart"></i> 
                    ${(artist.nb_fan || 0).toLocaleString()} fans
                </p>
            </div>
        `;
    }

    /**
     * Render playlist cards
     */
    function renderPlaylists(playlists) {
        if (playlists.length === 0) return '<div class="no-results">No playlists found</div>';

        return `
            <div class="music-grid">
                ${playlists.map(p => renderPlaylistCard(p)).join('')}
            </div>
        `;
    }

    /**
     * Render single playlist card
     */
    function renderPlaylistCard(playlist) {
        return `
            <div class="result-card playlist-card" title="Click to view playlist">
                <div class="card-image-container">
                    <img src="${playlist.picture_medium || 'img/whitehole.png'}" 
                         class="card-image" loading="lazy" alt="${playlist.title}">
                    <div class="play-overlay">
                        <div class="play-btn-circle"><i class="fa-solid fa-play"></i></div>
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="action-pill-btn" title="View Playlist">
                            <i class="fa-solid fa-arrow-up-right"></i>
                        </button>
                    </div>
                </div>
                <h4 class="playing-title">${escapeHtml(playlist.title)}</h4>
                <p class="playing-artist">
                    <i class="fa-solid fa-list"></i> 
                    ${playlist.nb_tracks || 0} songs
                </p>
            </div>
        `;
    }

    /**
     * Escape HTML for safety
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Hook into search input
     */
    function setupSearchHook() {
        const searchInput = document.querySelector('.searchInput');
        if (!searchInput) return;

        // Override the original search with our comprehensive search
        const originalHandler = searchInput.oninput;
        
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                performComprehensiveSearch(query);
            } else {
                document.getElementById('search-filters').style.display = 'none';
            }
        }, 500));
    }

    /**
     * Debounce utility
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Initialize on load
     */
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initializeFilters();
                setupSearchHook();
            });
        } else {
            initializeFilters();
            setupSearchHook();
        }
    }

    // Expose to global
    window.performComprehensiveSearch = performComprehensiveSearch;

    initialize();
})();

console.log('✨ Search Filters initialized - Spotify-like search ready!');
