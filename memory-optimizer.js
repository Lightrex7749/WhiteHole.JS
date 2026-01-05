/* =============================================================================
   MEMORY & GARBAGE COLLECTION OPTIMIZATION
   Prevent memory leaks and keep app running smoothly
   ============================================================================= */

(function() {
    'use strict';

    console.log('🧠 Memory Optimizer Initializing...');

    // ============================================================================
    // AGGRESSIVE MEMORY MANAGEMENT
    // ============================================================================

    let memoryCheckInterval;

    function startMemoryMonitoring() {
        memoryCheckInterval = setInterval(() => {
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1048576; // MB
                const limit = performance.memory.jsHeapSizeLimit / 1048576;
                const percent = (used / limit) * 100;

                // Log if over 80MB
                if (used > 80) {
                    console.warn(`⚠️ High memory: ${used.toFixed(1)}MB / ${limit.toFixed(1)}MB (${percent.toFixed(1)}%)`);
                    triggerMemoryCleanup();
                }
            }
        }, 10000); // Check every 10 seconds
    }

    function triggerMemoryCleanup() {
        console.log('🧹 Cleaning up memory...');

        // Clear unused caches
        if (window.suggestionCache) {
            const now = Date.now();
            for (const key in window.suggestionCache) {
                if (now - window.suggestionCache[key].timestamp > 30 * 60 * 1000) {
                    delete window.suggestionCache[key];
                }
            }
        }

        // Clear old search results
        const resultsArea = document.getElementById('results-area');
        if (resultsArea) {
            const cards = resultsArea.querySelectorAll('.result-card');
            if (cards.length > 100) {
                // Keep only visible cards
                cards.forEach((card, idx) => {
                    if (idx > 100) card.remove();
                });
            }
        }

        // Trigger garbage collection if available
        if (window.gc) {
            window.gc();
            console.log('✅ Memory cleaned');
        }
    }

    // ============================================================================
    // DETACH EVENT LISTENERS ON NAVIGATION
    // ============================================================================

    function setupSmartEventCleanup() {
        let currentSection = null;
        const sectionListeners = new Map();

        window.addEventListener('section-change', (e) => {
            const newSection = e.detail?.section;

            // Clean up old section listeners
            if (currentSection && sectionListeners.has(currentSection)) {
                const listeners = sectionListeners.get(currentSection);
                listeners.forEach(({ element, event, handler }) => {
                    element.removeEventListener(event, handler);
                });
                sectionListeners.delete(currentSection);
            }

            currentSection = newSection;
        });

        window.registerSectionListener = (section, element, event, handler) => {
            if (!sectionListeners.has(section)) {
                sectionListeners.set(section, []);
            }
            sectionListeners.get(section).push({ element, event, handler });
            element.addEventListener(event, handler);
        };
    }

    // ============================================================================
    // OPTIMIZE DOM MANIPULATION
    // ============================================================================

    function setupDOMOptimizations() {
        // Use DocumentFragment for batch updates
        window.batchDOMInsert = (container, items) => {
            const fragment = document.createDocumentFragment();
            items.forEach(item => {
                const el = typeof item === 'string' 
                    ? document.createTextNode(item) 
                    : item;
                fragment.appendChild(el);
            });
            container.innerHTML = '';
            container.appendChild(fragment);
        };

        // Virtual scrolling for large lists
        window.setupVirtualScrolling = (container, itemHeight = 100) => {
            let scrollTimeout;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        entry.target.style.display = 'none';
                    } else {
                        entry.target.style.display = '';
                    }
                });
            }, { rootMargin: '100px' });

            container.querySelectorAll('.result-card, .song-row').forEach(item => {
                observer.observe(item);
            });
        };
    }

    // ============================================================================
    // DISABLE HEAVY ANIMATIONS WHEN NOT VISIBLE
    // ============================================================================

    function setupVisibilityOptimization() {
        document.addEventListener('visibilitychange', () => {
            const style = document.documentElement.style;
            
            if (document.hidden) {
                console.log('📴 App hidden - disabling animations');
                document.body.classList.add('app-hidden');
            } else {
                console.log('📱 App visible - enabling animations');
                document.body.classList.remove('app-hidden');
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            .app-hidden * {
                animation: none !important;
                transition: none !important;
            }

            .app-hidden .sparkle {
                display: none !important;
            }

            .app-hidden video,
            .app-hidden audio {
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // THROTTLE HEAVY OPERATIONS
    // ============================================================================

    function setupThrottling() {
        // Throttle scroll events
        let scrollThrottled = false;
        window.addEventListener('scroll', () => {
            if (!scrollThrottled) {
                scrollThrottled = true;
                requestAnimationFrame(() => {
                    // Perform scroll-based updates here
                    scrollThrottled = false;
                });
            }
        }, { passive: true });

        // Throttle resize events
        let resizeThrottled = false;
        window.addEventListener('resize', () => {
            if (!resizeThrottled) {
                resizeThrottled = true;
                requestAnimationFrame(() => {
                    // Perform resize-based updates here
                    resizeThrottled = false;
                });
            }
        }, { passive: true });
    }

    // ============================================================================
    // REDUCE PAINT OPERATIONS
    // ============================================================================

    function setupPaintOptimization() {
        const style = document.createElement('style');
        style.textContent = `
            /* Reduce repaints */
            .music-grid {
                will-change: contents;
            }

            .music-grid.loaded {
                will-change: auto;
            }

            /* Optimize scrolling */
            * {
                scroll-behavior: auto;
            }

            body.smooth-scroll * {
                scroll-behavior: smooth;
            }

            /* Batch CSS updates */
            .update-batch {
                contain: layout style paint;
            }

            /* Disable shadows during interactions */
            .scroll-active * {
                box-shadow: none !important;
                text-shadow: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // NETWORK OPTIMIZATION
    // ============================================================================

    function setupNetworkOptimization() {
        // Reduce API call frequency
        const apiCache = new Map();
        const cacheMaxAge = 5 * 60 * 1000; // 5 minutes

        window.cachedAPICall = async (url) => {
            const now = Date.now();
            const cached = apiCache.get(url);

            if (cached && now - cached.timestamp < cacheMaxAge) {
                console.log('📦 API cache hit:', url);
                return cached.data;
            }

            try {
                const response = await fetch(url);
                const data = await response.json();
                apiCache.set(url, { data, timestamp: now });
                return data;
            } catch (err) {
                console.error('API error:', err);
                return null;
            }
        };

        // Connection speed detection
        window.getConnectionSpeed = () => {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!connection) return 'unknown';
            return connection.effectiveType; // 4g, 3g, 2g, slow-2g
        };
    }

    // ============================================================================
    // INITIALIZE ALL OPTIMIZATIONS
    // ============================================================================

    function initialize() {
        startMemoryMonitoring();
        setupSmartEventCleanup();
        setupDOMOptimizations();
        setupVisibilityOptimization();
        setupThrottling();
        setupPaintOptimization();
        setupNetworkOptimization();

        console.log('✅ Memory & performance optimizations active');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
