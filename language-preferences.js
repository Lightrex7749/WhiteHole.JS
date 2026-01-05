/**
 * WHITEHOLE - LANGUAGE & PREFERENCE SYSTEM
 * Personalizes search, suggestions, and mood options based on user's preferred language
 */

const LANGUAGE_CONFIG = {
    en: {
        name: 'English',
        flag: '🇬🇧',
        keywords: {
            chill: ['chill', 'relaxing', 'ambient', 'lo-fi', 'soft'],
            energetic: ['energetic', 'uptempo', 'dance', 'edm', 'party'],
            focus: ['focus', 'study', 'concentration', 'instrumental', 'minimal'],
            gaming: ['gaming', 'epic', 'action', 'dubstep', 'synthwave'],
            workout: ['workout', 'gym', 'fitness', 'hip-hop', 'trap'],
            romantic: ['romantic', 'love', 'slow', 'ballad', 'soul']
        }
    },
    es: {
        name: 'Español',
        flag: '🇪🇸',
        keywords: {
            chill: ['relajante', 'tranquilo', 'suave', 'ambient', 'lofi'],
            energetic: ['energético', 'animado', 'baile', 'fiesta', 'ritmo'],
            focus: ['concentración', 'estudio', 'instrumental', 'minimal', 'paz'],
            gaming: ['gaming', 'épico', 'acción', 'intenso', 'adrenalina'],
            workout: ['entrenamiento', 'gym', 'fitness', 'rap', 'música fuerte'],
            romantic: ['romántico', 'amor', 'lento', 'balada', 'soul']
        }
    },
    fr: {
        name: 'Français',
        flag: '🇫🇷',
        keywords: {
            chill: ['relaxant', 'tranquille', 'doux', 'ambient', 'lofi'],
            energetic: ['énergique', 'animé', 'danse', 'fête', 'dynamique'],
            focus: ['concentration', 'étude', 'instrumental', 'minimal', 'calme'],
            gaming: ['gaming', 'épique', 'action', 'intense', 'électronique'],
            workout: ['entraînement', 'gym', 'fitness', 'rap', 'puissant'],
            romantic: ['romantique', 'amour', 'lent', 'ballade', 'soul']
        }
    },
    de: {
        name: 'Deutsch',
        flag: '🇩🇪',
        keywords: {
            chill: ['entspannend', 'ruhig', 'sanft', 'ambient', 'lofi'],
            energetic: ['energisch', 'lebhaft', 'tanz', 'party', 'dynamisch'],
            focus: ['konzentration', 'studium', 'instrumental', 'minimal', 'ruhe'],
            gaming: ['gaming', 'episch', 'action', 'intensiv', 'elektronisch'],
            workout: ['training', 'fitness', 'gym', 'rap', 'kraftvoll'],
            romantic: ['romantisch', 'liebe', 'langsam', 'ballade', 'soul']
        }
    },
    it: {
        name: 'Italiano',
        flag: '🇮🇹',
        keywords: {
            chill: ['rilassante', 'tranquillo', 'dolce', 'ambient', 'lofi'],
            energetic: ['energico', 'animato', 'danza', 'festa', 'dinamico'],
            focus: ['concentrazione', 'studio', 'strumentale', 'minimal', 'calma'],
            gaming: ['gaming', 'epico', 'azione', 'intenso', 'elettronico'],
            workout: ['allenamento', 'fitness', 'gym', 'rap', 'potente'],
            romantic: ['romantico', 'amore', 'lento', 'ballata', 'soul']
        }
    },
    pt: {
        name: 'Português',
        flag: '🇧🇷',
        keywords: {
            chill: ['relaxante', 'tranquilo', 'suave', 'ambient', 'lofi'],
            energetic: ['energético', 'animado', 'dança', 'festa', 'dinâmico'],
            focus: ['concentração', 'estudo', 'instrumental', 'minimal', 'calma'],
            gaming: ['gaming', 'épico', 'ação', 'intenso', 'eletrônico'],
            workout: ['treino', 'fitness', 'academia', 'rap', 'poderoso'],
            romantic: ['romântico', 'amor', 'lento', 'balada', 'soul']
        }
    }
};

class LanguagePreferences {
    constructor() {
        this.currentLanguage = this.loadLanguage();
        this.preferences = this.loadPreferences();
    }

    /**
     * Load language from localStorage or return default
     */
    loadLanguage() {
        const saved = localStorage.getItem('whitehole_language');
        return saved || 'en';
    }

    /**
     * Load user preferences
     */
    loadPreferences() {
        const saved = localStorage.getItem('whitehole_preferences');
        return saved ? JSON.parse(saved) : {
            language: 'en',
            likedGenres: [],
            searchHistory: [],
            moodPreferences: {}
        };
    }

    /**
     * Save language preference
     */
    setLanguage(lang) {
        if (LANGUAGE_CONFIG[lang]) {
            this.currentLanguage = lang;
            this.preferences.language = lang;
            localStorage.setItem('whitehole_language', lang);
            localStorage.setItem('whitehole_preferences', JSON.stringify(this.preferences));
            this.dispatchEvent('languageChanged', { language: lang });
            return true;
        }
        return false;
    }

    /**
     * Get language config
     */
    getConfig() {
        return LANGUAGE_CONFIG[this.currentLanguage] || LANGUAGE_CONFIG.en;
    }

    /**
     * Get mood keywords for current language
     */
    getMoodKeywords(mood) {
        const config = this.getConfig();
        return config.keywords[mood] || [];
    }

    /**
     * Enhance search query with language keywords
     */
    enhanceSearchQuery(mood) {
        const keywords = this.getMoodKeywords(mood);
        return keywords.length > 0 ? keywords[0] : mood;
    }

    /**
     * Save search to history
     */
    addToSearchHistory(query) {
        if (!this.preferences.searchHistory.includes(query)) {
            this.preferences.searchHistory.unshift(query);
            this.preferences.searchHistory = this.preferences.searchHistory.slice(0, 20);
            localStorage.setItem('whitehole_preferences', JSON.stringify(this.preferences));
        }
    }

    /**
     * Add liked genre
     */
    addLikedGenre(genre) {
        if (!this.preferences.likedGenres.includes(genre)) {
            this.preferences.likedGenres.push(genre);
            localStorage.setItem('whitehole_preferences', JSON.stringify(this.preferences));
        }
    }

    /**
     * Get personalized mood suggestions based on language
     */
    getPersonalizedMoodSuggestions() {
        const config = this.getConfig();
        return Object.keys(config.keywords).map(mood => ({
            mood,
            keywords: config.keywords[mood]
        }));
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }
}

// Initialize global language preferences
window.languagePrefs = new LanguagePreferences();

/**
 * Show language selection modal on first load
 */
function showLanguageSelector() {
    const hasSelectedLanguage = localStorage.getItem('whitehole_language');
    
    if (hasSelectedLanguage) return;

    const modalHTML = `
        <div id="language-modal" class="language-modal-overlay">
            <div class="language-modal">
                <div class="language-modal-header">
                    <h2>Welcome to WhiteHole</h2>
                    <p>Select your preferred language for personalized music recommendations</p>
                </div>
                
                <div class="language-grid">
                    ${Object.entries(LANGUAGE_CONFIG).map(([code, config]) => `
                        <button class="language-option" onclick="window.languagePrefs.setLanguage('${code}'); closeLanguageModal();">
                            <span class="language-flag">${config.flag}</span>
                            <span class="language-name">${config.name}</span>
                        </button>
                    `).join('')}
                </div>
                
                <p class="language-info">You can change this anytime in settings</p>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add styles if not already added
    if (!document.getElementById('language-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'language-modal-styles';
        styles.textContent = `
            .language-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
            }

            .language-modal {
                background: var(--bg-secondary, #1a1a1a);
                border-radius: 16px;
                padding: 48px 40px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                border: 1px solid rgba(139, 92, 246, 0.2);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            }

            .language-modal-header h2 {
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 12px;
                color: var(--text-primary, #fff);
            }

            .language-modal-header p {
                font-size: 14px;
                color: var(--text-secondary, #b3b3b3);
                margin: 0 0 32px;
            }

            .language-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 24px;
            }

            .language-option {
                padding: 24px 16px;
                background: var(--bg-highlight, #282828);
                border: 2px solid transparent;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }

            .language-option:hover {
                background: var(--bg-press, #3a3a3a);
                border-color: var(--accent-primary, #1db954);
                transform: scale(1.05);
            }

            .language-flag {
                font-size: 32px;
            }

            .language-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary, #fff);
            }

            .language-info {
                font-size: 12px;
                color: var(--text-subdued, #999);
                margin: 0;
            }

            @media (max-width: 600px) {
                .language-modal {
                    padding: 32px 24px;
                }

                .language-modal-header h2 {
                    font-size: 24px;
                }

                .language-grid {
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }

                .language-option {
                    padding: 16px 8px;
                }

                .language-flag {
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

/**
 * Close language modal
 */
function closeLanguageModal() {
    const modal = document.getElementById('language-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Initialize language preferences on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(showLanguageSelector, 500);
});

console.log('✅ Language Preferences System loaded');
