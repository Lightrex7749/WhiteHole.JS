/**
 * WHITEHOLE - MASTER AUDIO ENGINE & INTEGRATIONS
 */

const player = {
    audio: new Audio(),
    ctx: null,
    analyser: null,
    canvas: null,
    canvasCtx: null,
    queue: [],
    currentIndex: -1
};

/**
 * Initialize Audio & Visualizer
 */
function initAudio() {
    if (player.ctx) return;
    try {
        player.ctx = new (window.AudioContext || window.webkitAudioContext)();
        player.analyser = player.ctx.createAnalyser();
        const source = player.ctx.createMediaElementSource(player.audio);
        source.connect(player.analyser);
        player.analyser.connect(player.ctx.destination);
        player.analyser.fftSize = 128;
        
        player.canvas = document.getElementById('visualizer');
        player.canvasCtx = player.canvas.getContext('2d');
        window.addEventListener('resize', () => {
            player.canvas.width = window.innerWidth;
            player.canvas.height = window.innerHeight;
        });
        player.canvas.width = window.innerWidth;
        player.canvas.height = window.innerHeight;
        drawVisualizer();
    } catch (e) { console.warn('Audio Visualizer failed'); }
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    const data = new Uint8Array(player.analyser.frequencyBinCount);
    player.analyser.getByteFrequencyData(data);
    player.canvasCtx.clearRect(0, 0, player.canvas.width, player.canvas.height);
    
    const barWidth = (player.canvas.width / data.length) * 2.5;
    let x = 0;
    for (let i = 0; i < data.length; i++) {
        const h = (data[i] / 255) * player.canvas.height * 0.3;
        player.canvasCtx.fillStyle = `rgba(139, 92, 246, ${data[i]/255 * 0.3})`;
        player.canvasCtx.fillRect(x, player.canvas.height - h, barWidth, h);
        x += barWidth + 1;
    }
}

/**
 * Core Playback Function
 */
async function playSong(track) {
    if (!track || !track.preview) {
        showNotification("No preview available", "error");
        return;
    }

    initAudio();
    if (player.ctx.state === 'suspended') await player.ctx.resume();

    player.audio.pause();
    player.audio.crossOrigin = "anonymous";
    player.audio.src = track.preview;
    
    try {
        await player.audio.play();
        updatePlayerUI(track);
        addToGlobalQueue(track);
        loadLyrics(track);
    } catch (err) {
        console.error('Play failed:', err);
        showNotification("Playback failed. Try again.", "error");
    }
}

function togglePlayPause() {
    if (!player.audio.src) return;
    const btn = document.getElementById('play-btn');
    if (player.audio.paused) {
        player.audio.play();
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        player.audio.pause();
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

function updatePlayerUI(track) {
    document.querySelector('.playing-title').textContent = track.title;
    document.querySelector('.playing-artist').textContent = track.artist.name;
    document.querySelector('.playing-logo').src = track.album.cover_medium;
    document.getElementById('play-btn').innerHTML = '<i class="fa-solid fa-pause"></i>';
    
    // External Links (YouTube / Spotify)
    const ytLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist.name + ' ' + track.title)}`;
    const spLink = `https://open.spotify.com/search/${encodeURIComponent(track.artist.name + ' ' + track.title)}`;
    
    // Clear and re-add links
    let actions = document.querySelector('.extra-actions');
    if (!actions) {
        actions = document.createElement('div');
        actions.className = 'extra-actions';
        document.querySelector('.track-info').appendChild(actions);
    }
    actions.innerHTML = `
        <a href="${ytLink}" target="_blank" class="action-icon" title="Search on YouTube"><i class="fa-brands fa-youtube"></i></a>
        <a href="${spLink}" target="_blank" class="action-icon" title="Open on Spotify"><i class="fa-brands fa-spotify"></i></a>
    `;
}

/**
 * Queue & Lyrics
 */
function addToGlobalQueue(track) {
    if (!player.queue.some(t => t.id === track.id)) {
        player.queue.push(track);
        updateQueueUI();
    }
}

function updateQueueUI() {
    const container = document.querySelector('.queue-list');
    const currentId = player.currentTrack ? player.currentTrack.id : null;
    
    container.innerHTML = player.queue.map((t, index) => {
        const isPlaying = t.id === currentId;
        return `
            <div class="queue-item ${isPlaying ? 'playing' : ''}" onclick="playSong(${JSON.stringify(t).replace(/"/g, '&quot;')})">
                <img src="${t.album.cover_small}">
                <div style="flex: 1">
                    <div style="font-size: 13px; font-weight: 600;">${t.title}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">${t.artist.name}</div>
                </div>
                ${isPlaying ? `
                    <div class="playing-bars">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                ` : `
                    <button class="remove-q" onclick="event.stopPropagation(); removeFromQueue(${index})">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                `}
            </div>
        `;
    }).join('');
}

function removeFromQueue(index) {
    player.queue.splice(index, 1);
    updateQueueUI();
}

function saveQueue() {
    if (window.musicStorage) {
        musicStorage.saveQueue(player.queue);
        showNotification("Queue saved to storage", "success");
    }
}

window.removeFromQueue = removeFromQueue;
window.saveQueue = saveQueue;
window.addToGlobalQueue = addToGlobalQueue;

function loadLyrics(track) {
    const body = document.querySelector('.lyrics-body') || document.querySelector('.lyrics-placeholder');
    body.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-microphone" style="font-size: 30px; margin-bottom: 20px;"></i>
        <p>Lyrics feature coming soon for ${track.title}</p>
    </div>`;
}

/**
 * Event Listeners
 */
player.audio.addEventListener('timeupdate', () => {
    const p = (player.audio.currentTime / player.audio.duration) * 100;
    const progressFilled = document.querySelector('.progress-filled');
    const progressSlider = document.querySelector('.progress-slider');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    
    if (progressFilled) progressFilled.style.width = p + '%';
    if (progressSlider) progressSlider.value = p;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(player.audio.currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(player.audio.duration || 0);
});

const progressSliderEl = document.querySelector('.progress-slider');
if (progressSliderEl) {
    progressSliderEl.addEventListener('input', (e) => {
        player.audio.currentTime = (e.target.value / 100) * player.audio.duration;
    });
}

const volumeSliderEl = document.querySelector('.volume-slider');
if (volumeSliderEl) {
    volumeSliderEl.addEventListener('input', (e) => {
        player.audio.volume = e.target.value / 100;
        const volumeFilled = document.querySelector('.volume-filled');
        if (volumeFilled) volumeFilled.style.width = e.target.value + '%';
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowRight':
            playNext();
            break;
        case 'ArrowLeft':
            playPrevious();
            break;
        case 'KeyM':
            if (e.ctrlKey) window.toggleMute?.();
            break;
    }
});

window.toggleMute = () => {
    const vol = document.querySelector('.volume-slider');
    if (vol.value > 0) {
        vol.dataset.lastVolume = vol.value;
        vol.value = 0;
    } else {
        vol.value = vol.dataset.lastVolume || 50;
    }
    player.audio.volume = vol.value / 100;
    const volumeFilled = document.querySelector('.volume-filled');
    if (volumeFilled) volumeFilled.style.width = vol.value + '%';
};

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' + sec : sec}`;
}

window.playSong = playSong;
window.togglePlayPause = togglePlayPause;