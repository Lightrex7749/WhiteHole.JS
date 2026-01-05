/* =============================================================================
   WHITEHOLE MUSIC PLAYER - QUEUE MANAGEMENT (CONFLICT-FREE VERSION)
   ============================================================================= */

// Immediate check to prevent duplicate loading
if (window.queueManagementLoaded) {
    console.log('⚠️ Queue management already loaded, skipping...');
} else {
    window.queueManagementLoaded = true;

    // Initialize global queue variables ONLY if they don't exist
    (function() {
        'use strict';
        
        // Safe initialization
        if (typeof window.globalQueue === 'undefined') {
            window.globalQueue = [];
        }
        if (typeof window.globalCurrentIndex === 'undefined') {
            window.globalCurrentIndex = 0;
        }
        if (typeof window.globalOriginalQueue === 'undefined') {
            window.globalOriginalQueue = [];
        }

        console.log('🎵 Queue variables initialized safely');

        /* =============================================================================
           NOTIFICATION SYSTEM
           ============================================================================= */

        function safeNotification(message, type = 'info') {
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
            
            // Try multiple notification methods
            if (typeof window.showNotification === 'function') {
                window.showNotification(message, type);
                return;
            }
            
            // Console fallback
            console.log(`${icons[type]} ${message}`);
            
            // Visual notification fallback
            const notificationDiv = document.querySelector('.notification-msg');
            if (notificationDiv) {
                notificationDiv.textContent = message;
                notificationDiv.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 9999;
                    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
                    color: white; padding: 12px 20px; border-radius: 8px;
                    opacity: 1; transition: opacity 0.3s ease; display: block;
                `;
                
                setTimeout(() => {
                    notificationDiv.style.opacity = '0';
                    setTimeout(() => notificationDiv.style.display = 'none', 300);
                }, 3000);
            }
        }

        /* =============================================================================
           QUEUE FUNCTIONS
           ============================================================================= */

        function addToQueue(song) {
            if (!song?.title) {
                console.error('❌ Invalid song for queue');
                return;
            }

            const queue = window.globalQueue;
            
            // Check for duplicates
            const exists = queue.some(item => 
                item.id === song.id || 
                (item.title === song.title && item.artist?.name === song.artist?.name)
            );

            if (exists) {
                safeNotification(`"${song.title}" is already in queue`, 'warning');
                return;
            }

            // Add song
            queue.push(song);
            
            // Update UI and save
            updateQueueDisplay();
            updateQueueCount();
            saveToStorage();
            
            safeNotification(`Added "${song.title}" to queue`, 'success');
            console.log(`✅ Added: ${song.title} (Queue: ${queue.length})`);
        }

        function removeFromQueue(index) {
            const queue = window.globalQueue;
            
            if (index < 0 || index >= queue.length) {
                console.error('❌ Invalid queue index:', index);
                return;
            }

            const song = queue[index];
            queue.splice(index, 1);
            
            // Adjust current index
            if (window.globalCurrentIndex > index) {
                window.globalCurrentIndex--;
            } else if (window.globalCurrentIndex === index && window.globalCurrentIndex >= queue.length) {
                window.globalCurrentIndex = Math.max(0, queue.length - 1);
            }
            
            // Update UI and save
            updateQueueDisplay();
            updateQueueCount();
            saveToStorage();
            
            safeNotification(`Removed "${song.title}"`, 'info');
            console.log(`✅ Removed: ${song.title}`);
        }

        function clearQueue() {
            const count = window.globalQueue.length;
            
            window.globalQueue.length = 0; // Clear array
            window.globalCurrentIndex = 0;
            
            updateQueueDisplay();
            updateQueueCount();
            saveToStorage();
            
            safeNotification(`Cleared ${count} songs`, 'success');
            console.log(`✅ Queue cleared (${count} songs)`);
        }

        function playFromQueue(index) {
            const queue = window.globalQueue;
            
            if (index < 0 || index >= queue.length) {
                console.error('❌ Invalid index:', index);
                return;
            }

            // Update current index
            window.globalCurrentIndex = index;
            
            const song = queue[index];
            
            // Try to play the song
            if (typeof window.playSong === 'function') {
                window.playSong(song);
            } else if (typeof playSong === 'function') {
                playSong(song);
            } else {
                console.error('❌ playSong function not found');
                safeNotification('Cannot play song - player not ready', 'error');
                return;
            }
            
            updateQueueDisplay();
            console.log(`✅ Playing: ${song.title} (${index + 1}/${queue.length})`);
        }

        function updateQueueDisplay() {
            const container = document.querySelector('.queue-list');
            if (!container) return;

            const queue = window.globalQueue;
            const currentIndex = window.globalCurrentIndex;

            if (queue.length === 0) {
                container.innerHTML = `
                    <div class="empty-queue">
                        <i class="fa-solid fa-list-music" style="font-size: 2rem; color: #666; margin-bottom: 1rem;"></i>
                        <p>No songs in queue</p>
                        <p style="font-size: 0.875rem; color: #999;">Add songs to see them here</p>
                    </div>
                `;
                return;
            }

            const queueHTML = queue.map((song, index) => {
                const isPlaying = index === currentIndex;
                const cover = song.album?.cover_medium || song.album?.cover || 
                             'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%238a2be2"/%3E%3C/svg%3E';
                const duration = formatTime(song.duration);
                
                return `
                    <div class="queue-item ${isPlaying ? 'playing' : ''}" onclick="window.playFromQueue(${index})">
                        <div class="playing-indicator">
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <img src="${cover}" alt="${song.title}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;">
                        <div class="queue-item-info">
                            <div class="queue-item-title">${song.title || 'Unknown'}</div>
                            <div class="queue-item-artist">${song.artist?.name || 'Unknown'}</div>
                        </div>
                        <div class="queue-item-duration">${duration}</div>
                        <button class="queue-control-btn" onclick="event.stopPropagation(); window.removeFromQueue(${index})" title="Remove">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `;
            }).join('');

            container.innerHTML = queueHTML;
            console.log(`✅ Queue display updated (${queue.length} songs)`);
        }

        function updateQueueCount() {
            const btn = document.querySelector('#queue-btn');
            if (!btn) return;

            const queue = window.globalQueue;
            let badge = btn.querySelector('.queue-badge');
            
            if (queue.length > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'queue-badge';
                    badge.style.cssText = `
                        position: absolute; top: -5px; right: -5px;
                        background: #8a2be2; color: white; border-radius: 50%;
                        width: 18px; height: 18px; font-size: 10px;
                        display: flex; align-items: center; justify-content: center;
                        font-weight: bold;
                    `;
                    btn.style.position = 'relative';
                    btn.appendChild(badge);
                }
                badge.textContent = queue.length;
            } else if (badge) {
                badge.remove();
            }
        }

        function formatTime(seconds) {
            if (!seconds || isNaN(seconds)) return '3:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        function saveToStorage() {
            if (typeof window.musicStorage?.saveQueue === 'function') {
                window.musicStorage.saveQueue(window.globalQueue);
            }
        }

        function saveCurrentQueue() {
            saveToStorage();
            safeNotification('Queue saved!', 'success');
        }

        function loadQueueFromStorage() {
            if (typeof window.musicStorage?.loadData === 'function') {
                const saved = window.musicStorage.loadData('queue');
                if (saved?.length > 0) {
                    window.globalQueue.length = 0; // Clear first
                    window.globalQueue.push(...saved); // Add saved items
                    updateQueueDisplay();
                    updateQueueCount();
                    console.log(`✅ Loaded ${saved.length} songs from storage`);
                    return true;
                }
            }
            return false;
        }

        /* =============================================================================
           INITIALIZATION
           ============================================================================= */

        function initQueueControls() {
            // Clear button
            const clearBtn = document.querySelector('.clear-queue');
            if (clearBtn && !clearBtn.hasAttribute('data-queue-initialized')) {
                clearBtn.onclick = clearQueue;
                clearBtn.setAttribute('data-queue-initialized', 'true');
                console.log('✅ Clear button ready');
            }
            
            // Save button
            const saveBtn = document.querySelector('.save-queue');
            if (saveBtn && !saveBtn.hasAttribute('data-queue-initialized')) {
                saveBtn.onclick = saveCurrentQueue;
                saveBtn.setAttribute('data-queue-initialized', 'true');
                console.log('✅ Save button ready');
            }
        }

        function initializeQueueSystem() {
            console.log('🎵 Initializing queue system...');
            
            // Load saved queue
            loadQueueFromStorage();
            
            // Initialize controls with delay
            setTimeout(initQueueControls, 500);
            
            console.log('✅ Queue system ready');
        }

        /* =============================================================================
           GLOBAL EXPORTS
           ============================================================================= */

        // Export all functions globally with safe assignment
        window.addToQueue = addToQueue;
        window.removeFromQueue = removeFromQueue;
        window.clearQueue = clearQueue;
        window.playFromQueue = playFromQueue;
        window.updateQueueDisplay = updateQueueDisplay;
        window.updateQueueCount = updateQueueCount;
        window.saveCurrentQueue = saveCurrentQueue;
        window.loadQueueFromStorage = loadQueueFromStorage;
        window.initializeQueueSystem = initializeQueueSystem;
        window.formatTime = window.formatTime || formatTime;

        // Also create aliases for backward compatibility
        Object.defineProperty(window, 'queue', {
            get: () => window.globalQueue,
            set: (value) => { window.globalQueue = value; }
        });

        Object.defineProperty(window, 'currentQueueIndex', {
            get: () => window.globalCurrentIndex,
            set: (value) => { window.globalCurrentIndex = value; }
        });

        /* =============================================================================
           AUTO-INITIALIZATION
           ============================================================================= */

        // Initialize when ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initializeQueueSystem, 1000);
            });
        } else {
            setTimeout(initializeQueueSystem, 1000);
        }

        console.log('🎵 Queue Management loaded successfully!');

    })(); // End of IIFE

    // Fix the missing updateQueueHighlight function
    if (typeof window.updateQueueHighlight === 'undefined') {
        window.updateQueueHighlight = function(currentSong) {
            if (!currentSong) return;
            
            const queue = window.globalQueue || window.queue || [];
            
            // Find current song in queue
            const foundIndex = queue.findIndex(song => {
                return (song.id && currentSong.id && song.id === currentSong.id) ||
                       (song.title === currentSong.title && song.artist?.name === currentSong.artist?.name);
            });
            
            if (foundIndex !== -1) {
                // Update current index
                if (typeof window.globalCurrentIndex !== 'undefined') {
                    window.globalCurrentIndex = foundIndex;
                }
                if (typeof window.currentQueueIndex !== 'undefined') {
                    window.currentQueueIndex = foundIndex;
                }
                
                // Update display
                if (typeof window.updateQueueDisplay === 'function') {
                    window.updateQueueDisplay();
                }
                console.log(`✅ Queue highlight updated for: ${currentSong.title}`);
            }
        };
        
        console.log('✅ updateQueueHighlight function created');
    }
}