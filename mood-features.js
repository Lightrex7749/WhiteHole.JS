/* =============================================================================
   WHITEHOLE MUSIC PLAYER - MOOD FEATURES & MOOD-BASED SEARCH
   Handles mood button functionality and mood-based music recommendations
   ============================================================================= */

(function() {
    'use strict';

    // Mood configurations with search keywords and playlists
    const MOOD_CONFIG = {
        chill: {
            icon: 'cloud',
            color: '#3b82f6',
            keywords: ['chill', 'relaxing', 'ambient', 'lo-fi', 'sleep'],
            genres: ['ambient', 'indie', 'lo-fi hip hop'],
            description: 'Relaxing, mellow vibes'
        },
        energetic: {
            icon: 'fire',
            color: '#ef4444',
            keywords: ['energetic', 'uptempo', 'dance', 'edm', 'house'],
            genres: ['dance', 'electronic', 'house', 'edm'],
            description: 'High-energy, uplifting tracks'
        },
        focus: {
            icon: 'brain',
            color: '#10b981',
            keywords: ['focus', 'study', 'concentration', 'minimal', 'instrumental'],
            genres: ['electronic', 'ambient', 'instrumental', 'classical'],
            description: 'Deep focus & concentration'
        },
        gaming: {
            icon: 'gamepad',
            color: '#8b5cf6',
            keywords: ['gaming', 'epic', 'action', 'synthwave', 'dubstep'],
            genres: ['electronic', 'dubstep', 'synthwave', 'trap'],
            description: 'Gaming & action vibes'
        },
        workout: {
            icon: 'heart-pulse',
            color: '#ec4899',
            keywords: ['workout', 'gym', 'fitness', 'hip hop', 'trap'],
            genres: ['hip hop', 'trap', 'pop', 'funk'],
            description: 'Pump-up, motivating beats'
        },
        romantic: {
            icon: 'heart',
            color: '#f43f5e',
            keywords: ['romantic', 'love', 'slow', 'ballad', 'soul'],
            genres: ['soul', 'r&b', 'pop ballads', 'reggae'],
            description: 'Love songs & romance'
        }
    };

    // Initialize mood buttons
    function initializeMoodButtons() {
        const moodButtons = document.querySelectorAll('.mood-tag');
        moodButtons.forEach(btn => {
            btn.addEventListener('click', handleMoodClick);
            // Visual feedback
            btn.addEventListener('mouseenter', (e) => {
                const mood = e.target.closest('.mood-tag').dataset.mood;
                showMoodTooltip(e.target.closest('.mood-tag'), mood);
            });
        });
    }

    /**
     * Handle mood button click
     */
    async function handleMoodClick(e) {
        const btn = e.target.closest('.mood-tag');
        const mood = btn.dataset.mood;
        const config = MOOD_CONFIG[mood];

        if (!config) return;

        // Visual feedback - highlight selected mood
        document.querySelectorAll('.mood-tag').forEach(b => b.classList.remove('mood-active'));
        btn.classList.add('mood-active');

        // Fetch and display mood-based songs
        await loadMoodPlaylist(mood, config);
    }

    /**
     * Load playlist based on mood
     */
    async function loadMoodPlaylist(mood, config) {
        try {
            // Use the first keyword for search
            const query = config.keywords[0];
            const results = await searchByMood(query, mood);
            
            if (results && results.length > 0) {
                displayMoodResults(results, mood, config);
                // Switch to search view
                switchSection('search');
            }
        } catch (err) {
            console.error('Error loading mood playlist:', err);
            showNotification('Failed to load ' + mood + ' playlist', 'error');
        }
    }

    /**
     * Search songs by mood using Deezer API
     */
    async function searchByMood(query, mood) {
        const DEEZER_API = 'https://deezerdevs-deezer.p.rapidapi.com';
        const API_HEADERS = {
            'X-RapidAPI-Key': 'bef7c89b22msh39c1b4ec2d71c5bp152d1ajsn87d10434f100',
            'X-RapidAPI-Host': 'deezerdevs-deezer.p.rapidapi.com'
        };

        try {
            const response = await fetch(
                `${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=50`,
                { headers: API_HEADERS }
            );
            const json = await response.json();
            return json.data || [];
        } catch (err) {
            console.error('Deezer API error:', err);
            return [];
        }
    }

    /**
     * Display mood-based results
     */
    function displayMoodResults(songs, mood, config) {
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;

        const moodHeader = `
            <div class="mood-header" style="border-left: 4px solid ${config.color}">
                <div class="mood-icon" style="background-color: ${config.color}20">
                    <i class="fa-solid fa-${config.icon}"></i>
                </div>
                <div>
                    <h2>${mood.charAt(0).toUpperCase() + mood.slice(1)} Mix</h2>
                    <p>${config.description}</p>
                </div>
            </div>
        `;

        const cardsHTML = songs.map(s => `
            <div class="result-card" onclick="playSong(${JSON.stringify(s).replace(/"/g, '&quot;')})">
                <div class="card-image-container">
                    <img src="${s.album.cover_medium}" class="card-image" loading="lazy" alt="${s.title}">
                    <div class="play-overlay">
                        <div class="play-btn-circle"><i class="fa-solid fa-play"></i></div>
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="action-pill-btn" onclick="addToQueueFromBtn(${JSON.stringify(s).replace(/"/g, '&quot;')})" title="Add to Queue">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button class="action-pill-btn" onclick="toggleFavorite(${JSON.stringify(s).replace(/"/g, '&quot;')})" title="Save to Playlist">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                </div>
                <h4 class="playing-title">${escapeHtml(s.title)}</h4>
                <p class="playing-artist">${escapeHtml(s.artist.name)}</p>
            </div>
        `).join('');

        resultsArea.innerHTML = moodHeader + `<div class="cards-grid">${cardsHTML}</div>`;

        // Scroll to results
        setTimeout(() => {
            resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }

    /**
     * Show mood tooltip/description
     */
    function showMoodTooltip(element, mood) {
        const config = MOOD_CONFIG[mood];
        const existingTooltip = document.querySelector('.mood-tooltip');
        if (existingTooltip) existingTooltip.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'mood-tooltip';
        tooltip.textContent = config.description;
        tooltip.style.backgroundColor = config.color;
        element.appendChild(tooltip);

        setTimeout(() => tooltip.remove(), 3000);
    }

    /**
     * Switch section in navigation
     */
    function switchSection(section) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        const searchBtn = document.querySelector(`[data-section="${section}"]`);
        if (searchBtn) searchBtn.classList.add('active');
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        const notifEl = document.querySelector('.notification-msg');
        if (!notifEl) return;
        notifEl.textContent = message;
        notifEl.className = `notification-msg notification-${type}`;
        notifEl.style.display = 'block';
        setTimeout(() => {
            notifEl.style.display = 'none';
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMoodButtons);
    } else {
        initializeMoodButtons();
    }

    // Expose to global scope for event handlers
    window.loadMoodPlaylist = loadMoodPlaylist;
    window.switchSection = switchSection;
})();
