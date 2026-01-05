/**
 * WHITEHOLE - THEME SWITCHER (Dark/Light Mode)
 */

const ThemeSwitcher = (() => {
    const THEME_KEY = 'whitehole-theme';
    const LIGHT_THEME = 'light';
    const DARK_THEME = 'dark';
    
    // Light theme colors
    const lightColors = {
        'bg-primary': '#ffffff',
        'bg-secondary': '#f5f5f5',
        'bg-elevated': '#ffffff',
        'bg-base': '#fafafa',
        'bg-highlight': '#f0f0f0',
        'bg-press': '#e8e8e8',
        'text-primary': '#000000',
        'text-secondary': '#666666',
        'text-subdued': '#999999',
        'text-bright': '#111111',
        'border-subtle': 'rgba(0, 0, 0, 0.05)',
        'border-base': 'rgba(0, 0, 0, 0.1)',
    };
    
    // Dark theme colors (default)
    const darkColors = {
        'bg-primary': '#000000',
        'bg-secondary': '#121212',
        'bg-elevated': '#181818',
        'bg-base': '#0a0a0a',
        'bg-highlight': '#1a1a1a',
        'bg-press': '#282828',
        'text-primary': '#ffffff',
        'text-secondary': '#b3b3b3',
        'text-subdued': '#6a6a6a',
        'text-bright': '#f6f6f6',
        'border-subtle': 'rgba(255, 255, 255, 0.05)',
        'border-base': 'rgba(255, 255, 255, 0.1)',
    };
    
    const init = () => {
        const savedTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
        setTheme(savedTheme);
        addThemeToggleButton();
    };
    
    const setTheme = (theme) => {
        const colors = theme === LIGHT_THEME ? lightColors : darkColors;
        const root = document.documentElement;
        
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        
        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === LIGHT_THEME ? '#ffffff' : '#000000');
        }
    };
    
    const toggle = () => {
        const currentTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        setTheme(newTheme);
        updateToggleButton(newTheme);
    };
    
    const addThemeToggleButton = () => {
        setTimeout(() => {
            const userProfile = document.querySelector('.user-profile');
            if (!userProfile) return;
            
            const themeBtn = document.createElement('button');
            themeBtn.className = 'theme-toggle-btn action-btn';
            themeBtn.id = 'theme-toggle';
            themeBtn.title = 'Toggle Dark/Light Mode';
            
            const currentTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
            themeBtn.innerHTML = currentTheme === DARK_THEME 
                ? '<i class="fa-solid fa-sun"></i>' 
                : '<i class="fa-solid fa-moon"></i>';
            
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle();
            });
            
            userProfile.parentElement.insertBefore(themeBtn, userProfile);
        }, 100);
    };
    
    const updateToggleButton = (theme) => {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        
        btn.innerHTML = theme === DARK_THEME 
            ? '<i class="fa-solid fa-sun"></i>' 
            : '<i class="fa-solid fa-moon"></i>';
    };
    
    return { init, toggle, setTheme };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeSwitcher.init();
});

// Expose to window
window.ThemeSwitcher = ThemeSwitcher;
