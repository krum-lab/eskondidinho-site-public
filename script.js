/* ============================================
   ESKONDIDINHO EVENTOS — JavaScript
   Countdown, Scroll Animations, Mobile Menu,
   Dynamic Hero, Number Counter
   ============================================ */

// ===== NEXT EVENT (populated dynamically from events.json via data-loader) =====
// Hero/countdown/badges leem desta variável. setNextEvent() é chamada pelo
// init no index.html após loadEventsData() resolver.
let _nextEvent = null;

window.setNextEvent = function (ev) {
    _nextEvent = ev || null;
    updateHero();
    startCountdown();
};

function getNextEvent() {
    return _nextEvent;
}

// ===== DYNAMIC HERO =====
function updateHero() {
    const nextEvent = getNextEvent();
    if (!nextEvent) return;

    const heroName = document.getElementById('heroEventName');
    const heroDetails = document.getElementById('heroEventDetails');
    const heroPromo = document.getElementById('heroEventPromo');
    const heroCTA = document.getElementById('heroCTA');
    const heroBadge = document.getElementById('heroBadge');

    // Parse date for display
    const [year, month, day] = nextEvent.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    heroName.textContent = nextEvent.name;
    heroDetails.innerHTML = `🎵 ${nextEvent.bands.join(' • ')} <br>📅 ${weekdays[dateObj.getDay()]}, ${day} de ${months[month - 1]} — ${nextEvent.time.replace(':', 'h')}`;

    if (nextEvent.promo) {
        heroPromo.textContent = `🎉 ${nextEvent.promo}`;
        heroPromo.style.display = 'inline-block';
    } else {
        heroPromo.style.display = 'none';
    }

    heroCTA.href = nextEvent.link_ingresso || nextEvent.link || '#';

    // Check urgency — dynamic badge based on proximity
    const eventDate = new Date(year, month - 1, day, 22, 0, 0);
    const nowCheck = new Date();
    const timeUntil = eventDate - nowCheck;
    const daysUntil = timeUntil / (1000 * 60 * 60 * 24);

    // Check if today is the event day (same calendar date)
    const isEventDay = nowCheck.getFullYear() === year && nowCheck.getMonth() === month - 1 && nowCheck.getDate() === day;

    if (isEventDay || (daysUntil <= 0 && daysUntil > -0.5)) {
        heroBadge.innerHTML = '🔥 <span>HOJE! Garanta seu ingresso!</span>';
        heroBadge.style.background = 'rgba(255, 68, 68, 0.3)';
    } else if (daysUntil <= 7 && daysUntil > 0) {
        heroBadge.innerHTML = '🔥 <span>ESSA SEMANA!</span>';
        heroBadge.style.background = 'rgba(255, 165, 0, 0.2)';
    } else {
        heroBadge.innerHTML = '🎶 <span>Próximo Baile</span>';
        heroBadge.style.background = '';
    }
}

// ===== COUNTDOWN =====
let countdownInterval;

function startCountdown() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    const nextEvent = getNextEvent();
    if (!nextEvent) return;

    const [year, month, day] = nextEvent.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day, 22, 0, 0);

    function update() {
        const now = new Date();
        const diff = eventDate - now;

        if (diff <= 0) {
            document.getElementById('countDays').textContent = '00';
            document.getElementById('countHours').textContent = '00';
            document.getElementById('countMinutes').textContent = '00';
            document.getElementById('countSeconds').textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countDays').textContent = String(days).padStart(2, '0');
        document.getElementById('countHours').textContent = String(hours).padStart(2, '0');
        document.getElementById('countMinutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('countSeconds').textContent = String(seconds).padStart(2, '0');
    }

    update();
    countdownInterval = setInterval(update, 1000);
}

// ===== MARK PAST EVENTS =====
function markPastEvents() {
    const now = new Date();
    const cards = document.querySelectorAll('.event-card[data-date]');
    cards.forEach(card => {
        const [year, month, day] = card.dataset.date.split('-').map(Number);
        // Event ends at 04:00 next day
        const eventEnd = new Date(year, month - 1, day + 1, 4, 0, 0);
        if (now > eventEnd) {
            card.classList.add('past-event');
            const btn = card.querySelector('.event-card-btn');
            if (btn) {
                btn.textContent = 'Encerrado';
                btn.removeAttribute('href');
                btn.style.pointerEvents = 'none';
            }
        }
    });
}

// ===== NAVBAR SCROLL =====
function handleNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// ===== MOBILE MENU =====
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    menu.classList.toggle('active');
    hamburger.classList.toggle('active');

    // Close menu when clicking a link
    if (menu.classList.contains('active')) {
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                hamburger.classList.remove('active');
            }, { once: true });
        });
    }
}

// ===== SCROLL REVEAL =====
function handleScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const windowHeight = window.innerHeight;

    reveals.forEach(el => {
        const elementTop = el.getBoundingClientRect().top;
        const revealPoint = 100;

        if (elementTop < windowHeight - revealPoint) {
            el.classList.add('visible');
        }
    });
}

// ===== NUMBER COUNTER ANIMATION =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');

    counters.forEach(counter => {
        if (counter.dataset.animated) return;

        const rect = counter.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return;

        counter.dataset.animated = 'true';
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            counter.textContent = current + '+';

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    });
}

// ===== PARTICLES EFFECT =====
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random() * 0.4 + 0.1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 102, ${p.alpha})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 255, 102, ${0.05 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
            e.preventDefault();
            const navbar = document.getElementById('navbar');
            const offset = navbar.offsetHeight + 20;
            const top = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
        }
    });
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    updateHero();
    startCountdown();
    markPastEvents();
    initParticles();
    handleScrollReveal();
    animateCounters();
});

window.addEventListener('scroll', () => {
    handleNavbarScroll();
    handleScrollReveal();
    animateCounters();
});

// ===== REFERRAL SYSTEM =====
const ESK_REF = {
    STORAGE_KEY: 'esk_referral',
    VISITOR_KEY: 'esk_visitor_id',
    API_URL: '/api/referral-click',

    // Generate or retrieve unique visitor ID
    getVisitorId() {
        let id = localStorage.getItem(this.VISITOR_KEY);
        if (!id) {
            id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
            localStorage.setItem(this.VISITOR_KEY, id);
        }
        return id;
    },

    // Capture ?ref= from URL and persist it
    capture() {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && ref.trim()) {
            const refData = {
                code: ref.trim().toLowerCase(),
                captured_at: new Date().toISOString(),
                landing_url: window.location.href
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(refData));
            console.log('[Referral] Captured:', refData.code);

            // Clean URL without reload (remove ?ref= from address bar)
            const cleanUrl = window.location.pathname + window.location.hash;
            history.replaceState(null, '', cleanUrl);
        }
    },

    // Get active referral (if any)
    getActive() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) { return null; }
    },

    // Register a referral click (when user clicks "Comprar Ingresso")
    async registerClick(eventId) {
        const ref = this.getActive();
        if (!ref) return; // No referral active

        try {
            const payload = {
                referrer_code: ref.code,
                event_id: eventId,
                visitor_id: this.getVisitorId(),
                source: 'website'
            };

            // Fire and forget — don't block the purchase redirect
            fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(e => console.warn('[Referral] Track error:', e));

            console.log('[Referral] Click registered:', payload);
        } catch (e) {
            console.warn('[Referral] Error:', e);
        }
    },

    // Show referral badge on the page
    showBadge() {
        const ref = this.getActive();
        if (!ref) return;

        const badge = document.createElement('div');
        badge.className = 'referral-badge';
        badge.innerHTML = `
            <span class="referral-badge-icon">🎫</span>
            <span>Link de indicação: <strong>${ref.code}</strong></span>
        `;
        badge.style.cssText = `
            position: fixed; bottom: 16px; left: 16px; z-index: 9999;
            background: rgba(0, 240, 106, 0.15); border: 1px solid rgba(0, 240, 106, 0.3);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            border-radius: 10px; padding: 8px 14px; display: flex; align-items: center; gap: 8px;
            font-size: 0.75rem; color: #00f06a; font-family: 'Montserrat', sans-serif;
            animation: refBadgeSlideIn 0.5s ease;
        `;

        // Add animation keyframes
        if (!document.getElementById('ref-badge-style')) {
            const style = document.createElement('style');
            style.id = 'ref-badge-style';
            style.textContent = `
                @keyframes refBadgeSlideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(badge);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            badge.style.transition = 'opacity 0.3s ease';
            badge.style.opacity = '0';
            setTimeout(() => badge.remove(), 300);
        }, 5000);
    },

    // Intercept all ticket purchase links to track referrals
    interceptPurchaseLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*="pagtickets"]');
            if (!link) return;

            const ref = this.getActive();
            if (!ref) return; // No referral — let click proceed normally

            // Extract event ID from the link URL (e.g., __21859/)
            const match = link.href.match(/__(\d+)\/?$/);
            const eventId = match ? match[1] : 'unknown';

            // Register the click
            this.registerClick(eventId);
        });
    },

    // Init
    init() {
        this.capture();
        this.showBadge();
        this.interceptPurchaseLinks();
    }
};

// Initialize referral system
document.addEventListener('DOMContentLoaded', () => {
    ESK_REF.init();
});
