/**
 * WHITEHOLE - ACETERNITY UI EFFECTS (ENHANCED)
 * Multiple stunning effects inspired by Aceternity UI
 */

class AceternityEffects {
    constructor() {
        this.initDottedGlow();
        this.initSparkles();
        this.initAuroraBackground();
        this.initGlowingStars();
        this.initBeams();
        this.initBackgroundRipple();
        this.initVanishInput();
        this.initCardSpotlight();
    }

    /**
     * 1. Dotted Glow Background Effect
     */
    initDottedGlow() {
        const dotContainer = document.createElement('div');
        dotContainer.className = 'dotted-glow-bg';
        dotContainer.innerHTML = `
            <div class="dot-pattern"></div>
            <div class="glow-overlay"></div>
        `;
        document.body.prepend(dotContainer);
    }

    /**
     * 2. Sparkles Effect
     */
    initSparkles() {
        const createSparkle = () => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.animationDelay = Math.random() * 3 + 's';
            sparkle.style.animationDuration = (Math.random() * 2 + 2) + 's';
            document.body.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 5000);
        };

        setInterval(createSparkle, 300);
    }

    /**
     * 3. Aurora Background
     */
    initAuroraBackground() {
        const aurora = document.createElement('div');
        aurora.className = 'aurora-bg';
        aurora.innerHTML = `
            <div class="aurora-gradient aurora-1"></div>
            <div class="aurora-gradient aurora-2"></div>
            <div class="aurora-gradient aurora-3"></div>
        `;
        document.body.prepend(aurora);
    }

    /**
     * 4. Glowing Stars
     */
    initGlowingStars() {
        const starContainer = document.createElement('div');
        starContainer.className = 'star-field';
        
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.animationDuration = (Math.random() * 2 + 2) + 's';
            const size = Math.random() * 3 + 1;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            starContainer.appendChild(star);
        }
        
        document.body.prepend(starContainer);
    }

    /**
     * 5. Background Beams With Enhanced Logic
     */
    initBeams() {
        const canvas = document.createElement('canvas');
        canvas.id = 'beams-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.15';
        document.body.prepend(canvas);
        const ctx = canvas.getContext('2d');
        
        let width, height;
        const beams = [];

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        class Beam {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * width;
                this.y = height + 100;
                this.speed = Math.random() * 2 + 1;
                this.length = Math.random() * 200 + 100;
                this.opacity = Math.random() * 0.5;
            }
            draw() {
                this.y -= this.speed;
                if (this.y < -this.length) this.reset();
                
                const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.length);
                grad.addColorStop(0, `rgba(138, 43, 226, ${this.opacity})`);
                grad.addColorStop(1, 'rgba(138, 43, 226, 0)');
                
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.y + this.length);
                ctx.stroke();
            }
        }

        for (let i = 0; i < 30; i++) beams.push(new Beam());

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            beams.forEach(b => b.draw());
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();
    }

    /**
     * 6. Background Ripple Effect
     */
    initBackgroundRipple() {
        document.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'bg-ripple';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';
            document.body.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 1000);
        });
    }

    /**
     * 7. Vanish Input with Placeholder Animation
     */
    initVanishInput() {
        const input = document.querySelector('.searchInput');
        if (!input) return;

        const placeholders = [
            "Search for 'Blinding Lights'...",
            "Try 'Lofi Hip Hop'...",
            "Discover new Artists...",
            "Search your mood...",
            "Find trending hits..."
        ];

        let current = 0;
        setInterval(() => {
            input.placeholder = "";
            let text = placeholders[current];
            let i = 0;
            const type = () => {
                if (i < text.length) {
                    input.placeholder += text.charAt(i);
                    i++;
                    setTimeout(type, 50);
                }
            };
            type();
            current = (current + 1) % placeholders.length;
        }, 4000);
    }

    /**
     * 8. Card Spotlight Effect
     */
    initCardSpotlight() {
        const applySpotlight = () => {
            document.querySelectorAll('.result-card').forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 15;
                    const rotateY = (centerX - x) / 15;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
                    
                    const spotlight = card.querySelector('.card-spotlight');
                    if (!spotlight) {
                        const spot = document.createElement('div');
                        spot.className = 'card-spotlight';
                        card.appendChild(spot);
                    }
                    
                    const spot = card.querySelector('.card-spotlight');
                    spot.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(139, 92, 246, 0.2), transparent 50%)`;
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
                    const spotlight = card.querySelector('.card-spotlight');
                    if (spotlight) spotlight.remove();
                });
            });
        };
        
        // Apply to existing cards and watch for new ones
        applySpotlight();
        const observer = new MutationObserver(applySpotlight);
        const grid = document.querySelector('#results-area');
        if (grid) observer.observe(grid, { childList: true, subtree: true });
    }
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Initializing Aceternity Effects...');
    window.aceternity = new AceternityEffects();
});
