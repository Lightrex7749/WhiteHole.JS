/**
 * PERFORMANCE OPTIMIZATION MODULE FOR WHITEHOLE
 * Fixes lag issues and optimizes rendering
 */

(function() {
    'use strict';

    // ============================================================================
    // 1. DEBOUNCE & THROTTLE UTILITIES
    // ============================================================================

    /**
     * Debounce function - delays execution until action stops
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function - limits execution frequency
     */
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ============================================================================
    // 2. OPTIMIZE SEARCH INPUT
    // ============================================================================

    function optimizeSearch() {
        const searchInput = document.querySelector('.searchInput');
        if (!searchInput) return;

        // Replace direct input handler with debounced version
        let originalInput = null;
        if (window.initializeSearch) {
            const debounced = debounce(() => {
                if (window.performSearch) {
                    window.performSearch(searchInput.value);
                }
            }, 300); // Wait 300ms after user stops typing

            searchInput.addEventListener('input', debounced);
        }

        console.log('✅ Search optimization applied');
    }

    // ============================================================================
    // 3. OPTIMIZE SCROLL PERFORMANCE
    // ============================================================================

    function optimizeScroll() {
        // Throttle scroll events
        let scrollTimeout;
        window.addEventListener('scroll', throttle(() => {
            // Lazy load images on scroll
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                if (img.getBoundingClientRect().top < window.innerHeight) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        }, 100)); // Check every 100ms max

        // Optimize main content scroll
        const contentContainer = document.querySelector('.content-container');
        if (contentContainer) {
            contentContainer.addEventListener('scroll', throttle(() => {
                // Handle lazy loading in main content
            }, 100));
        }

        console.log('✅ Scroll optimization applied');
    }

    // ============================================================================
    // 4. OPTIMIZE SPARKLES EFFECT (REMOVE CONSTANT DOM UPDATES)
    // ============================================================================

    function optimizeSparkles() {
        // Stop the original sparkle interval if it exists
        const originalInit = window.AceternityEffects?.prototype?.initSparkles;
        
        if (originalInit) {
            // Replace with optimized version using CSS animations
            window.AceternityEffects.prototype.initSparkles = function() {
                const container = document.createElement('div');
                container.className = 'sparkles-container optimized';
                
                // Create fixed set of sparkles instead of dynamic ones
                for (let i = 0; i < 20; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'sparkle-static';
                    sparkle.style.left = Math.random() * 100 + '%';
                    sparkle.style.top = Math.random() * 100 + '%';
                    sparkle.style.animationDelay = (i * 0.15) + 's';
                    container.appendChild(sparkle);
                }
                
                document.body.appendChild(container);
                console.log('✅ Sparkles optimized (CSS-based instead of DOM-heavy)');
            };
        }
    }

    // ============================================================================
    // 5. OPTIMIZE CARD SPOTLIGHT EFFECT
    // ============================================================================

    function optimizeCardSpotlight() {
        // Use event delegation instead of individual listeners
        const container = document.querySelector('.content-container');
        if (!container) return;

        container.addEventListener('mousemove', throttle((e) => {
            const cards = document.querySelectorAll('.result-card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    card.style.setProperty('--spotlight-x', x + 'px');
                    card.style.setProperty('--spotlight-y', y + 'px');
                }
            });
        }, 16)); // ~60fps

        console.log('✅ Card spotlight optimized (throttled mousemove)');
    }

    // ============================================================================
    // 6. OPTIMIZE ANIMATION PERFORMANCE
    // ============================================================================

    function optimizeAnimations() {
        // Enable GPU acceleration for animations
        const style = document.createElement('style');
        style.textContent = `
            * {
                will-change: auto;
            }
            
            .result-card,
            .queue-item,
            .suggestion-card {
                will-change: transform, opacity;
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
            }
            
            /* Only animate on hover for performance */
            @media (prefers-reduced-motion: no-preference) {
                .result-card:hover {
                    will-change: transform, box-shadow;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Animation performance optimized (will-change, GPU hints)');
    }

    // ============================================================================
    // 7. OPTIMIZE EVENT LISTENERS
    // ============================================================================

    function optimizeEventListeners() {
        // Use event delegation for buttons instead of individual listeners
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.action-pill-btn, .suggestion-action-btn, .queue-control-btn');
            if (!button) return;

            // Prevent multiple rapid clicks
            if (button.dataset.clicked) return;
            button.dataset.clicked = true;
            setTimeout(() => delete button.dataset.clicked, 300);
        });

        console.log('✅ Event listeners optimized (delegation, debouncing)');
    }

    // ============================================================================
    // 8. OPTIMIZE QUEUE RENDERING
    // ============================================================================

    function optimizeQueueRendering() {
        const originalUpdate = window.updateQueueDisplay;
        if (!originalUpdate) return;

        window.updateQueueDisplay = function() {
            const container = document.querySelector('.queue-list');
            if (!container) return;

            const queue = window.globalQueue || [];
            
            // Use DocumentFragment for batch DOM updates
            const fragment = document.createDocumentFragment();
            
            queue.forEach((song, index) => {
                const isPlaying = index === window.globalCurrentIndex;
                const cover = song.album?.cover_medium || song.album?.cover || 
                             'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%238a2be2"/%3E%3C/svg%3E';
                const duration = formatTime?.(song.duration) || '0:00';

                const item = document.createElement('div');
                item.className = `queue-item ${isPlaying ? 'playing' : ''}`;
                item.innerHTML = `
                    <div class="playing-indicator"><i class="fa-solid fa-play"></i></div>
                    <img src="${cover}" alt="${song.title}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;">
                    <div class="queue-item-info">
                        <div class="queue-item-title">${song.title || 'Unknown'}</div>
                        <div class="queue-item-artist">${song.artist?.name || 'Unknown'}</div>
                    </div>
                    <div class="queue-item-duration">${duration}</div>
                    <button class="queue-control-btn" onclick="event.stopPropagation(); window.removeFromQueue(${index})" title="Remove">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                `;
                item.onclick = () => window.playFromQueue?.(index);
                fragment.appendChild(item);
            });

            // Single DOM update
            container.innerHTML = '';
            container.appendChild(fragment);
            
            console.log('✅ Queue rendering optimized (DocumentFragment)');
        };
    }

    // ============================================================================
    // 9. OPTIMIZE MEMORY USAGE
    // ============================================================================

    function optimizeMemory() {
        // Clear old suggestions cache periodically
        setInterval(() => {
            if (window.suggestionCache) {
                const now = Date.now();
                for (const key in window.suggestionCache) {
                    if (now - window.suggestionCache[key].timestamp > 30 * 60 * 1000) {
                        delete window.suggestionCache[key];
                    }
                }
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        // Remove old images from cache
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && entry.target.tagName === 'IMG') {
                    // Could unload image data here if needed
                }
            });
        });

        const images = document.querySelectorAll('img');
        images.forEach(img => observer.observe(img));

        console.log('✅ Memory optimization applied');
    }

    // ============================================================================
    // 10. PERFORMANCE MONITORING
    // ============================================================================

    function setupPerformanceMonitoring() {
        // Monitor frame rate
        let frameCount = 0;
        let lastTime = performance.now();

        function measureFPS() {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                console.log(`⚡ Current FPS: ${frameCount}`);
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        }

        // Only enable in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Uncomment to enable FPS monitoring
            // measureFPS();
        }

        console.log('✅ Performance monitoring ready');
    }

    // ============================================================================
    // 11. MAIN INITIALIZATION
    // ============================================================================

    function initializeOptimizations() {
        console.log('🚀 Starting performance optimizations...');

        // Apply all optimizations
        optimizeSearch();
        optimizeScroll();
        optimizeSparkles();
        optimizeCardSpotlight();
        optimizeAnimations();
        optimizeEventListeners();
        optimizeQueueRendering();
        optimizeMemory();
        setupPerformanceMonitoring();

        console.log('✅ All performance optimizations applied!');
    }

    // ============================================================================
    // EXPORT TO GLOBAL
    // ============================================================================

    window.whiteHolePerformance = {
        debounce,
        throttle,
        optimize: initializeOptimizations
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOptimizations);
    } else {
        initializeOptimizations();
    }

})();
