/**
 * WHITEHOLE - ROBUST SEARCH ENGINE
 */

const DEEZER_API = 'https://deezerdevs-deezer.p.rapidapi.com';
const API_HEADERS = {
    'X-RapidAPI-Key': 'bef7c89b22msh39c1b4ec2d71c5bp152d1ajsn87d10434f100',
    'X-RapidAPI-Host': 'deezerdevs-deezer.p.rapidapi.com'
};

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initializeSearch() {
    const input = document.querySelector('.searchInput');
    const dropdown = document.getElementById('search-suggestions');

    if (!input || !dropdown) return;

    // Always hide dropdown by default
    dropdown.style.display = 'none !important';

    input.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (!query) {
            dropdown.style.display = 'none';
            return;
        }

        // Track search in language preferences
        if (window.languagePrefs) {
            window.languagePrefs.addToSearchHistory(query);
        }

        const data = await fetchFromDeezer(`/search?q=${encodeURIComponent(query)}&limit=25`);
        if (data && data.length > 0) {
            renderSearchResults(data);
        }
    }, 400));

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar') && !e.target.closest('.command-box')) dropdown.style.display = 'none';
    });
}

async function fetchFromDeezer(endpoint) {
    try {
        const res = await fetch(`${DEEZER_API}${endpoint}`, { headers: API_HEADERS });
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.error('Deezer API error:', err);
        return [];
    }
}

function showMiniSuggestions(songs) {
    const dropdown = document.getElementById('search-suggestions');
    // Keep dropdown hidden by default
    dropdown.style.display = 'none';
}

/**
 * Render Search Results with Advanced Actions
 */
function renderSearchResults(songs) {
    const area = document.getElementById('results-area');
    if (!area) return;

    area.className = 'cards-grid';
    area.innerHTML = songs.map(s => `
        <div class="result-card">
            <div class="card-image-container" onclick="playSong(${JSON.stringify(s).replace(/"/g, '&quot;')})">
                <img src="${s.album.cover_medium}" class="card-image" loading="lazy">
                <div class="play-overlay">
                    <div class="play-btn-circle"><i class="fa-solid fa-play"></i></div>
                </div>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button class="action-pill-btn" onclick="addToQueueFromBtn(${JSON.stringify(s).replace(/"/g, '&quot;')})" title="Add to Queue">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <button class="action-pill-btn" onclick="toggleFavorite(${JSON.stringify(s).replace(/"/g, '&quot;')})" title="Add to Liked">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
            <h4 class="playing-title">${escapeHtml(s.title)}</h4>
            <p class="playing-artist">${escapeHtml(s.artist.name)}</p>
        </div>
    `).join('');
}

/**
 * Entry Suggestions - Now language-aware
 */
async function loadEntrySuggestions() {
    // Language-aware default queries
    const queries = {
        en: ['trending 2025', 'top hits', 'new releases', 'chill vibes', 'party songs'],
        es: ['tendencias 2025', 'éxitos populares', 'lanzamientos nuevos', 'vibes relajantes'],
        fr: ['tendances 2025', 'grands succès', 'nouvelles sorties', 'ambiance chille'],
        de: ['trends 2025', 'top hits', 'neue veröffentlichungen', 'entspannungsvibes'],
        it: ['tendenze 2025', 'grandi successi', 'nuove uscite', 'vibes rilassanti'],
        pt: ['tendências 2025', 'maiores sucessos', 'novos lançamentos', 'vibes relaxantes']
    };
    
    const lang = window.languagePrefs?.currentLanguage || 'en';
    const langQueries = queries[lang] || queries.en;
    const query = langQueries[Math.floor(Math.random() * langQueries.length)];
    const data = await fetchFromDeezer(`/search?q=${encodeURIComponent(query)}&limit=25`);
    renderSearchResults(data);
}

// Add these to window
window.addToQueueFromBtn = (s) => {
    if (typeof addToGlobalQueue === 'function') {
        addToGlobalQueue(s);
        showNotification("Added to Queue", "success");
    }
};

window.loadEntrySuggestions = loadEntrySuggestions;

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.fetchFromDeezer = fetchFromDeezer;
window.renderSearchResults = renderSearchResults;