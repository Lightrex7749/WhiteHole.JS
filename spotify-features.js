/* =============================================================================
   WHITEHOLE SPOTIFY-LIKE FEATURES
   Complete feature parity with Spotify desktop app
   ============================================================================= */

(function() {
    'use strict';

    const DEEZER_API = 'https://deezerdevs-deezer.p.rapidapi.com';
    const API_HEADERS = {
        'X-RapidAPI-Key': 'bef7c89b22msh39c1b4ec2d71c5bp152d1ajsn87d10434f100',
        'X-RapidAPI-Host': 'deezerdevs-deezer.p.rapidapi.com'
    };

    // ============================================================================
    // DISCOVER & BROWSE (TRENDING, NEW RELEASES, CHARTS)
    // ============================================================================

    async function loadDiscoverContent() {
        try {
            const [trending, newReleases, charts] = await Promise.all([
                fetchTrendingMusic(),
                fetchNewReleases(),
                fetchTopCharts()
            ]);

            renderDiscoverPage(trending, newReleases, charts);
        } catch (err) {
            console.error('Error loading discover:', err);
        }
    }

    async function fetchTrendingMusic() {
        const response = await fetch(
            `${DEEZER_API}/search?q=trending&limit=50`,
            { headers: API_HEADERS }
        );
        const json = await response.json();
        return json.data || [];
    }

    async function fetchNewReleases() {
        const response = await fetch(
            `${DEEZER_API}/search?q=new releases&limit=50`,
            { headers: API_HEADERS }
        );
        const json = await response.json();
        return json.data || [];
    }

    async function fetchTopCharts() {
        const response = await fetch(
            `${DEEZER_API}/search?q=top hits&limit=50`,
            { headers: API_HEADERS }
        );
        const json = await response.json();
        return json.data || [];
    }

    function renderDiscoverPage(trending, newReleases, charts) {
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;

        resultsArea.innerHTML = `
            <div class="discover-page">
                <h2 class="discover-title">🎵 Good ${getTimeGreeting()}</h2>
                
                <div class="discover-section">
                    <h3 class="section-title">
                        <i class="fa-solid fa-fire"></i> Trending Now
                    </h3>
                    <div class="music-grid">
                        ${trending.slice(0, 6).map(t => createMiniCard(t)).join('')}
                    </div>
                </div>

                <div class="discover-section">
                    <h3 class="section-title">
                        <i class="fa-solid fa-sparkles"></i> New Releases
                    </h3>
                    <div class="music-grid">
                        ${newReleases.slice(0, 6).map(t => createMiniCard(t)).join('')}
                    </div>
                </div>

                <div class="discover-section">
                    <h3 class="section-title">
                        <i class="fa-solid fa-crown"></i> Top Charts
                    </h3>
                    <div class="music-grid">
                        ${charts.slice(0, 6).map(t => createMiniCard(t)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
    }

    function createMiniCard(track) {
        return `
            <div class="result-card" onclick="playSong(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                <div class="card-image-container">
                    <img src="${track.album?.cover_medium || track.picture_medium}" 
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

    // ============================================================================
    // PLAYBACK CONTROLS (SHUFFLE, REPEAT)
    // ============================================================================

    let shuffleMode = false;
    let repeatMode = 0; // 0 = off, 1 = all, 2 = one

    function setupPlaybackControls() {
        const player = document.querySelector('.player-controls');
        if (!player) return;

        // Add shuffle button
        const shuffleBtn = document.createElement('button');
        shuffleBtn.className = 'control-btn shuffle-btn';
        shuffleBtn.title = 'Shuffle';
        shuffleBtn.innerHTML = '<i class="fa-solid fa-shuffle"></i>';
        shuffleBtn.addEventListener('click', toggleShuffle);

        // Add repeat button
        const repeatBtn = document.createElement('button');
        repeatBtn.className = 'control-btn repeat-btn';
        repeatBtn.title = 'Repeat';
        repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
        repeatBtn.addEventListener('click', toggleRepeat);

        // Insert after play controls
        const playBtn = player.querySelector('.play-btn');
        if (playBtn) {
            playBtn.parentElement.appendChild(shuffleBtn);
            playBtn.parentElement.appendChild(repeatBtn);
        }
    }

    function toggleShuffle() {
        shuffleMode = !shuffleMode;
        const btn = document.querySelector('.shuffle-btn');
        if (btn) btn.classList.toggle('active', shuffleMode);
    }

    function toggleRepeat() {
        repeatMode = (repeatMode + 1) % 3;
        const btn = document.querySelector('.repeat-btn');
        if (btn) {
            btn.classList.remove('repeat-1', 'repeat-all');
            if (repeatMode === 1) btn.classList.add('repeat-all');
            if (repeatMode === 2) btn.classList.add('repeat-1');
        }
    }

    // ============================================================================
    // RECENTLY PLAYED TRACKING
    // ============================================================================

    function trackRecentlyPlayed(song) {
        let history = JSON.parse(localStorage.getItem('whitehole_recently_played') || '[]');
        
        // Remove if already exists
        history = history.filter(s => s.id !== song.id);
        
        // Add to front
        history.unshift({
            id: song.id,
            title: song.title,
            artist: song.artist.name,
            image: song.album.cover_small,
            timestamp: Date.now()
        });

        // Keep only last 50
        history = history.slice(0, 50);
        localStorage.setItem('whitehole_recently_played', JSON.stringify(history));
    }

    function loadRecentlyPlayed() {
        const history = JSON.parse(localStorage.getItem('whitehole_recently_played') || '[]');
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea || history.length === 0) return;

        resultsArea.innerHTML = `
            <div class="library-section">
                <h2 class="section-title">Recently Played</h2>
                <div class="recently-played-list">
                    ${history.map((song, idx) => `
                        <div class="recent-item" onclick="searchAndPlay('${song.title}', '${song.artist}')">
                            <div class="recent-rank">${idx + 1}</div>
                            <img src="${song.image}" alt="${song.title}" class="recent-image">
                            <div class="recent-info">
                                <div class="recent-title">${escapeHtml(song.title)}</div>
                                <div class="recent-artist">${escapeHtml(song.artist)}</div>
                            </div>
                            <div class="recent-time">
                                ${formatTime(Date.now() - song.timestamp)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return days + 'd ago';
        if (hours > 0) return hours + 'h ago';
        if (minutes > 0) return minutes + 'm ago';
        return 'just now';
    }

    // ============================================================================
    // SLEEP TIMER
    // ============================================================================

    let sleepTimerTimeout = null;

    function setupSleepTimer() {
        const durations = [15, 30, 60, 90, 120]; // minutes
        
        window.setSleepTimer = function(minutes) {
            if (sleepTimerTimeout) clearTimeout(sleepTimerTimeout);
            
            sleepTimerTimeout = setTimeout(() => {
                const player = document.querySelector('.player-controls');
                if (player) {
                    const playBtn = player.querySelector('.play-btn');
                    if (playBtn) playBtn.click();
                }
                showNotification(`Sleep timer finished. Music paused.`, 'info');
            }, minutes * 60 * 1000);

            showNotification(`Sleep timer set for ${minutes} minutes`, 'success');
        };
    }

    // ============================================================================
    // LIKED SONGS MANAGEMENT
    // ============================================================================

    function getLikedSongs() {
        return JSON.parse(localStorage.getItem('whitehole_liked_songs') || '[]');
    }

    function toggleLike(song) {
        let liked = getLikedSongs();
        const index = liked.findIndex(s => s.id === song.id);

        if (index > -1) {
            liked.splice(index, 1);
            showNotification('Removed from Liked Songs', 'info');
        } else {
            liked.push({
                id: song.id,
                title: song.title,
                artist: song.artist.name,
                image: song.album?.cover_small || song.picture_small,
                addedAt: new Date().toISOString()
            });
            showNotification('Added to Liked Songs', 'success');
        }

        localStorage.setItem('whitehole_liked_songs', JSON.stringify(liked));
    }

    function loadLikedSongs() {
        const liked = getLikedSongs();
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;

        if (liked.length === 0) {
            resultsArea.innerHTML = '<div class="no-results">No liked songs yet. Like songs to see them here!</div>';
            return;
        }

        resultsArea.innerHTML = `
            <div class="library-section">
                <div class="library-header">
                    <div class="library-cover">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div>
                        <p>PLAYLIST</p>
                        <h1>Liked Songs</h1>
                        <p>${liked.length} songs</p>
                    </div>
                </div>
                <div class="songs-list">
                    ${liked.map((song, idx) => `
                        <div class="song-row">
                            <div class="song-number">${idx + 1}</div>
                            <img src="${song.image}" alt="${song.title}" class="song-image">
                            <div class="song-info">
                                <div class="song-title">${escapeHtml(song.title)}</div>
                                <div class="song-artist">${escapeHtml(song.artist)}</div>
                            </div>
                            <div class="song-actions">
                                <button class="action-btn" onclick="toggleLike({id: '${song.id}', title: '${song.title}', artist: {name: '${song.artist}'}, album: {cover_small: '${song.image}'}})">
                                    <i class="fa-solid fa-heart"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ============================================================================
    // SHARE FUNCTIONALITY
    // ============================================================================

    window.shareSong = function(song) {
        const text = `🎵 Listening to "${song.title}" by ${song.artist.name} on WhiteHole Music Player`;
        
        if (navigator.share) {
            navigator.share({
                title: 'WhiteHole Music',
                text: text,
                url: window.location.href
            }).catch(err => console.log('Share cancelled'));
        } else {
            // Fallback: copy to clipboard
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('Copied to clipboard!', 'success');
        }
    };

    // ============================================================================
    // GENRES & CATEGORIES
    // ============================================================================

    const genres = [
        { name: 'Pop', icon: 'star' },
        { name: 'Hip-Hop', icon: 'microphone' },
        { name: 'Rock', icon: 'guitar' },
        { name: 'Electronic', icon: 'sliders' },
        { name: 'Classical', icon: 'music' },
        { name: 'Jazz', icon: 'saxophone' },
        { name: 'R&B', icon: 'compact-disc' },
        { name: 'Country', icon: 'horse' },
        { name: 'Latin', icon: 'earth-americas' },
        { name: 'K-Pop', icon: 'microphone' }
    ];

    window.loadGenres = async function() {
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;

        resultsArea.innerHTML = `
            <div class="genres-container">
                <h2 class="section-title">Browse All</h2>
                <div class="genres-grid">
                    ${genres.map(genre => `
                        <div class="genre-card" onclick="searchGenre('${genre.name}')">
                            <div class="genre-icon">
                                <i class="fa-solid fa-${genre.icon}"></i>
                            </div>
                            <h3>${genre.name}</h3>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    window.searchGenre = async function(genre) {
        const results = await fetch(
            `${DEEZER_API}/search?q=${encodeURIComponent(genre)}&limit=50`,
            { headers: API_HEADERS }
        ).then(r => r.json()).then(d => d.data || []);

        const resultsArea = document.getElementById('results-area');
        if (resultsArea) {
            resultsArea.innerHTML = `
                <h2 class="section-title">${genre}</h2>
                <div class="music-grid">
                    ${results.map(t => createMiniCard(t)).join('')}
                </div>
            `;
        }
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(msg, type = 'info') {
        const el = document.querySelector('.notification-msg');
        if (!el) return;
        el.textContent = msg;
        el.className = `notification-msg notification-${type}`;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 3000);
    }

    window.searchAndPlay = async function(title, artist) {
        const results = await fetch(
            `${DEEZER_API}/search?q=${encodeURIComponent(title + ' ' + artist)}&limit=1`,
            { headers: API_HEADERS }
        ).then(r => r.json()).then(d => d.data || []);

        if (results.length > 0 && window.playSong) {
            window.playSong(results[0]);
        }
    };

    // ============================================================================
    // INITIALIZE ALL SPOTIFY FEATURES
    // ============================================================================

    function initialize() {
        setupPlaybackControls();
        setupSleepTimer();

        // Expose functions globally
        window.loadDiscoverContent = loadDiscoverContent;
        window.loadRecentlyPlayed = loadRecentlyPlayed;
        window.loadLikedSongs = loadLikedSongs;
        window.trackRecentlyPlayed = trackRecentlyPlayed;
        window.toggleLike = toggleLike;

        console.log('✅ Spotify-like features initialized!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
