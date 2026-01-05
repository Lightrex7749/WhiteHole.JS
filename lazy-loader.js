/* =============================================================================
   AGGRESSIVE STARTUP OPTIMIZATION - LAZY LOADING
   Only load features when actually needed
   ============================================================================= */

(function() {
    'use strict';

    console.log('⚡ Lazy Loader Started - Minimal Initial Load');

    // Track loaded modules
    const loadedModules = new Set();

    // Module definitions (lazy loaded)
    const modules = {
        'mood-features': {
            file: 'mood-features.js',
            trigger: '[data-mood]', // Load when mood buttons visible
            priority: 'medium'
        },
        'search-filters': {
            file: 'search-filters.js',
            trigger: '.searchInput', // Load when search input focused
            priority: 'high'
        },
        'spotify-features': {
            file: 'spotify-features.js',
            trigger: '[data-section]', // Load when navigating
            priority: 'low'
        },
        'suggestions': {
            file: 'suggestions.js',
            trigger: '#search-suggestions', // Load when search starts
            priority: 'medium'
        }
    };

    /**
     * Lazy load a module only when needed
     */
    function lazyLoadModule(moduleName) {
        if (loadedModules.has(moduleName)) return;

        const module = modules[moduleName];
        if (!module) return;

        console.log(`📦 Loading module: ${moduleName}`);

        const script = document.createElement('script');
        script.src = module.file;
        script.async = true;
        script.onload = () => {
            loadedModules.add(moduleName);
            console.log(`✅ Loaded: ${moduleName}`);
        };
        script.onerror = () => {
            console.warn(`⚠️ Failed to load: ${moduleName}`);
        };
        document.body.appendChild(script);
    }

    /**
     * Debounced intersection observer for lazy loading
     */
    function setupLazyLoadObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Check which module to load
                    if (entry.target.closest('[data-mood]')) {
                        lazyLoadModule('mood-features');
                    }
                    if (entry.target.classList.contains('searchInput')) {
                        lazyLoadModule('search-filters');
                    }
                    if (entry.target.closest('[data-section]')) {
                        lazyLoadModule('spotify-features');
                    }
                }
            });
        }, { threshold: 0.1 });

        // Observe potential trigger elements
        document.querySelectorAll('[data-mood], .searchInput, [data-section]').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Disable heavy animations during page load
     */
    function minimizeStartupAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            /* Disable animations on startup */
            .startup-mode * {
                animation: none !important;
                transition: none !important;
            }

            /* Remove expensive transforms */
            .startup-mode {
                --transition-base: 0ms;
                --transition-slow: 0ms;
                --transition-fast: 0ms;
            }

            /* Disable shadows on load */
            .startup-mode * {
                box-shadow: none !important;
                filter: none !important;
            }

            /* Remove after 2 seconds */
            body.startup-complete * {
                animation: inherit;
                transition: inherit;
            }
        `;
        document.head.appendChild(style);

        // Add startup class
        document.documentElement.classList.add('startup-mode');

        // Remove after 2 seconds
        setTimeout(() => {
            document.documentElement.classList.remove('startup-mode');
            document.documentElement.classList.add('startup-complete');
            console.log('✨ Startup optimizations complete');
        }, 2000);
    }

    /**
     * Preload only critical scripts
     */
    function preloadCritical() {
        const critical = [
            'local-storage.js',
            'queue-management.js',
            'core-player.js',
            'search-api.js'
        ];

        critical.forEach(file => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = file;
            document.head.appendChild(link);
        });
    }

    /**
     * Defer non-critical scripts
     */
    function setupDeferredScripts() {
        const nonCritical = [
            'advanced-features.js',
            'ui-effects.js',
            'ui-navigation.js'
        ];

        nonCritical.forEach(file => {
            const script = document.createElement('script');
            script.src = file;
            script.defer = true;
            document.body.appendChild(script);
        });
    }

    /**
     * Request animation frame optimization
     */
    function optimizeRAF() {
        // Batch animation frame updates
        let scheduledUpdates = new Map();

        window.scheduleRAFUpdate = function(key, callback) {
            scheduledUpdates.set(key, callback);

            if (scheduledUpdates.size === 1) {
                requestAnimationFrame(() => {
                    scheduledUpdates.forEach(cb => cb());
                    scheduledUpdates.clear();
                });
            }
        };
    }

    /**
     * Minimize network requests
     */
    function optimizeNetworkRequests() {
        // Cache API responses aggressively
        const cache = new Map();

        window.cachedFetch = async function(url, options = {}) {
            const cacheKey = url;

            if (cache.has(cacheKey)) {
                console.log('📦 Cache hit:', url);
                return cache.get(cacheKey);
            }

            const response = await fetch(url, options);
            const data = await response.json();

            // Cache for 30 minutes
            cache.set(cacheKey, data);
            setTimeout(() => cache.delete(cacheKey), 30 * 60 * 1000);

            return data;
        };
    }

    /**
     * Reduce DOM queries with delegation
     */
    function optimizeDOMAccess() {
        // Cache common selectors
        window.cachedQuery = (selector) => {
            if (!window._queryCache) window._queryCache = {};
            if (!window._queryCache[selector]) {
                window._queryCache[selector] = document.querySelector(selector);
            }
            return window._queryCache[selector];
        };

        // Use event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-item');
            if (btn) {
                const section = btn.dataset.section;
                // Load relevant modules based on section
                if (section === 'liked-songs' || section === 'recently-played') {
                    lazyLoadModule('spotify-features');
                }
                if (section === 'search') {
                    lazyLoadModule('search-filters');
                }
            }
        }, { passive: true });
    }

    /**
     * Image optimization
     */
    function optimizeImages() {
        // Replace all images with lower quality initially
        const style = document.createElement('style');
        style.textContent = `
            img {
                content-visibility: auto;
                will-change: auto;
            }

            /* Use CSS to control loading */
            img[data-src] {
                background: var(--bg-highlight);
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);

        // Lazy load images with IntersectionObserver
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '50px' });

        // Will be called after DOM is ready
        setTimeout(() => {
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }, 1000);
    }

    /**
     * Minimize CSS calculations
     */
    function optimizeCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Use CSS containment */
            .sidebar, .main-content, .right-sidebar {
                contain: layout style paint;
            }

            /* Reduce repaints */
            button {
                will-change: auto;
            }

            button:hover {
                will-change: transform;
            }

            button:not(:hover) {
                will-change: auto;
            }

            /* Disable expensive filters during startup */
            .startup-mode .card-image-container {
                filter: none !important;
            }

            /* Optimize grid rendering */
            .music-grid {
                contain: layout;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Main initialization
     */
    function initialize() {
        console.time('Initialization');

        minimizeStartupAnimations();
        preloadCritical();
        setupDeferredScripts();
        optimizeRAF();
        optimizeNetworkRequests();
        optimizeDOMAccess();
        optimizeImages();
        optimizeCSS();

        // Setup lazy loading after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupLazyLoadObserver);
        } else {
            setupLazyLoadObserver();
        }

        console.timeEnd('Initialization');
        console.log('🚀 Lazy loading system ready!');
    }

    // Start immediately
    initialize();

    // Expose utilities
    window.lazyLoadModule = lazyLoadModule;
})();

console.log('✨ Startup Optimizer Ready - App will load features on demand');
