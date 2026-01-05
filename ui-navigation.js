/**
 * WHITEHOLE - NAVIGATION & CONTENT MANAGER
 */

document.addEventListener('DOMContentLoaded', () => {
    // Nav Click Handling (support both .nav-link and .nav-item)
    document.querySelectorAll('.nav-link, .nav-item').forEach(link => {
        link.addEventListener('click', () => {
            const section = link.dataset.section;
            if (section) {
                handleSectionChange(section);
            }
        });
    });

    // Tab Handling (support both .tab-btn and .tab-trigger)
    document.querySelectorAll('.tab-btn, .tab-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            document.querySelectorAll('.tab-btn, .tab-trigger').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.panel, .pane').forEach(v => v.classList.remove('active'));
            const panel = document.getElementById(`${target}-panel`);
            if (panel) panel.classList.add('active');
        });
    });
});

async function handleSectionChange(section) {
    console.log(`📂 Switching to: ${section}`);
    
    // UI Sync (support both .nav-link and .nav-item)
    document.querySelectorAll('.nav-link, .nav-item').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    const area = document.getElementById('results-area');
    area.innerHTML = '<div class="loader-mini"></div>';

    try {
        let songs = [];
        switch(section) {
            case 'trending':
                songs = await fetchFromDeezer('/chart/0/tracks?limit=30');
                break;
            case 'artists':
                songs = await fetchFromDeezer('/search?q=top artists&limit=30');
                break;
            case 'albums':
                songs = await fetchFromDeezer('/search?q=top albums 2025&limit=30');
                break;
            case 'liked-songs':
                songs = window.favorites || [];
                break;
            case 'recently-played':
                songs = musicStorage.loadRecentlyPlayed() || [];
                break;
            default:
                songs = await fetchFromDeezer('/chart/0/tracks');
        }
        
        renderSearchResults(songs);
    } catch (e) {
        console.error('Navigation error:', e);
    }
}

window.handleSectionChange = handleSectionChange;
