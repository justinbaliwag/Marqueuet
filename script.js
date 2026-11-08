(() => {
    'use strict';

    /* ==================== 1. APPLE FLUID INTERFACE PHYSICS ENGINE (SPRING + RUBBERBAND + PROJECTION) ==================== */
    const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Analytic Damped Harmonic Oscillator (Apple CASpringAnimation / SwiftUI .spring(response:dampingFraction:))
     */
    class SpringSolver {
        constructor(damping = 1.0, response = 0.34) {
            const m = 1;
            const k = Math.pow((2 * Math.PI) / Math.max(0.05, response), 2) * m;
            const c = (4 * Math.PI * Math.max(0.05, damping) * m) / Math.max(0.05, response);
            this.zeta = c / (2 * Math.sqrt(k * m));
            this.w0 = Math.sqrt(k / m);
            this.wd = this.zeta < 1 ? this.w0 * Math.sqrt(1 - this.zeta * this.zeta) : 0;
        }

        solve(t, x0 = 1, v0 = 0) {
            const z = this.zeta, w0 = this.w0;
            if (z < 1) {
                const wd = this.wd;
                const env = Math.exp(-z * w0 * t);
                const A = x0;
                const B = (z * w0 * x0 + v0) / wd;
                const pos = env * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
                const vel = -z * w0 * pos + env * (-A * wd * Math.sin(wd * t) + B * wd * Math.cos(wd * t));
                return { pos, vel };
            } else {
                const env = Math.exp(-w0 * t);
                const A = x0;
                const B = v0 + w0 * x0;
                const pos = env * (A + B * t);
                const vel = env * (B - w0 * (A + B * t));
                return { pos, vel };
            }
        }
    }

    /**
     * Interruptible Spring Value Controller — preserves live velocity when retargeted mid-flight
     */
    class SpringValue {
        constructor(initialValue = 0) {
            this.value = initialValue;
            this.target = initialValue;
            this.velocity = 0;
            this.rafId = null;
        }

        animateTo(newTarget, { damping = 1.0, response = 0.34, initialVelocity = null, onUpdate, onComplete } = {}) {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            if (REDUCED_MOTION) {
                this.value = newTarget;
                this.target = newTarget;
                this.velocity = 0;
                if (onUpdate) onUpdate(this.value);
                if (onComplete) onComplete(this.value);
                return;
            }
            const x0 = this.value - newTarget;
            const v0 = initialVelocity !== null ? initialVelocity : this.velocity;
            if (Math.abs(x0) < 0.001 && Math.abs(v0) < 0.01) {
                this.value = newTarget;
                this.target = newTarget;
                this.velocity = 0;
                if (onUpdate) onUpdate(this.value);
                if (onComplete) onComplete(this.value);
                return;
            }

            this.target = newTarget;
            const solver = new SpringSolver(damping, response);
            const t0 = performance.now();

            const step = (now) => {
                const elapsed = Math.min((now - t0) / 1000, 2.0);
                const state = solver.solve(elapsed, x0, v0);
                this.value = newTarget + state.pos;
                this.velocity = state.vel;

                if (onUpdate) onUpdate(this.value);

                if (Math.abs(state.pos) < 0.0015 && Math.abs(state.vel) < 0.015) {
                    this.value = newTarget;
                    this.velocity = 0;
                    this.rafId = null;
                    if (onUpdate) onUpdate(this.value);
                    if (onComplete) onComplete(this.value);
                } else {
                    this.rafId = requestAnimationFrame(step);
                }
            };
            this.rafId = requestAnimationFrame(step);
        }

        setImmediate(val) {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.value = val;
            this.target = val;
            this.velocity = 0;
        }
    }

    /**
     * Apple UIScrollView Rubber-Band Formula (c = 0.55)
     */
    function rubberband(offset, dimension, constant = 0.55) {
        if (dimension <= 0 || offset === 0) return 0;
        const sign = offset < 0 ? -1 : 1;
        const abs = Math.abs(offset);
        return sign * ((1 - (1 / ((abs * constant / dimension) + 1))) * dimension);
    }

    /**
     * AppleWWDC18 Momentum Projection Formula: (v / 1000) * d / (1 - d)
     */
    function project(initialVelocity, decelerationRate = 0.998) {
        return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
    }

    /* ==================== 2. DETERMINISTIC HASH & OSINT ENTITY DATABASE ==================== */
    function hashSeed(str) {
        let h = 1779033703 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return h >>> 0;
    }

    function seededRng(seed) {
        let a = seed >>> 0;
        return () => {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    const PALETTE = [
        { hex: 'var(--c0)', soft: 'var(--c0-soft)', text: 'var(--c0-text)' },
        { hex: 'var(--c1)', soft: 'var(--c1-soft)', text: 'var(--c1-text)' },
        { hex: 'var(--c2)', soft: 'var(--c2-soft)', text: 'var(--c2-text)' }
    ];

    const ENTITIES = {
        'jollibee': {
            name: 'Jollibee', type: 'brand', peer: 'McDo', skuSample: 'Chickenjoy',
            mentions: 12420, avgLikes: 940, commentRatio: 86, shareAmp: 90, velocity: 89, sentiment: 68, ugc: 93, reach: 95,
            drivers: { speed: 74, aesthetic: 75, value: 87, quality: 93, service: 86 },
            platforms: { tiktok: 48, instagram: 24, facebook: 28 }
        },
        'mcdo': {
            name: 'McDo', type: 'brand', peer: 'Jollibee', skuSample: 'Chicken McDo',
            mentions: 9340, avgLikes: 780, commentRatio: 73, shareAmp: 77, velocity: 83, sentiment: 55, ugc: 82, reach: 90,
            drivers: { speed: 90, aesthetic: 79, value: 85, quality: 80, service: 81 },
            platforms: { tiktok: 41, instagram: 31, facebook: 28 }
        },
        'kkopi': {
            name: 'KKOPI', type: 'brand', peer: 'BigBrew', skuSample: 'Iced Spanish Latte',
            mentions: 6840, avgLikes: 620, commentRatio: 89, shareAmp: 83, velocity: 80, sentiment: 74, ugc: 87, reach: 75,
            drivers: { speed: 63, aesthetic: 94, value: 79, quality: 89, service: 91 },
            platforms: { tiktok: 46, instagram: 41, facebook: 13 }
        },
        'bigbrew': {
            name: 'BigBrew', type: 'brand', peer: 'KKOPI', skuSample: 'Kape Brusko',
            mentions: 8150, avgLikes: 480, commentRatio: 65, shareAmp: 71, velocity: 87, sentiment: 47, ugc: 80, reach: 88,
            drivers: { speed: 91, aesthetic: 59, value: 96, quality: 72, service: 69 },
            platforms: { tiktok: 53, instagram: 17, facebook: 30 }
        },
        'justcoffee': {
            name: 'JustCoffee', type: 'brand', peer: 'BigBrew', skuSample: 'Sea Salt Latte',
            mentions: 4920, avgLikes: 530, commentRatio: 80, shareAmp: 69, velocity: 68, sentiment: 69, ugc: 74, reach: 64,
            drivers: { speed: 76, aesthetic: 87, value: 82, quality: 85, service: 83 },
            platforms: { tiktok: 41, instagram: 39, facebook: 20 }
        },
        'rhode': {
            name: 'Rhode', type: 'brand', peer: 'Rare Beauty', skuSample: 'Peptide Lip Tint',
            mentions: 19400, avgLikes: 1620, commentRatio: 88, shareAmp: 92, velocity: 94, sentiment: 76, ugc: 95, reach: 91,
            drivers: { speed: 78, aesthetic: 97, value: 71, quality: 90, service: 82 },
            platforms: { tiktok: 54, instagram: 38, facebook: 8 }
        },
        'rare beauty': {
            name: 'Rare Beauty', type: 'brand', peer: 'Rhode', skuSample: 'Soft Pinch Blush',
            mentions: 22100, avgLikes: 1580, commentRatio: 91, shareAmp: 87, velocity: 89, sentiment: 82, ugc: 94, reach: 94,
            drivers: { speed: 83, aesthetic: 92, value: 84, quality: 94, service: 91 },
            platforms: { tiktok: 49, instagram: 42, facebook: 9 }
        },
        'apple': {
            name: 'Apple', type: 'brand', peer: 'Samsung', skuSample: 'iPhone 16 Pro',
            mentions: 42800, avgLikes: 2450, commentRatio: 82, shareAmp: 88, velocity: 94, sentiment: 60, ugc: 95, reach: 98,
            drivers: { speed: 85, aesthetic: 96, value: 56, quality: 94, service: 86 },
            platforms: { tiktok: 44, instagram: 39, facebook: 17 }
        },
        'samsung': {
            name: 'Samsung', type: 'brand', peer: 'Apple', skuSample: 'Galaxy S24 Ultra',
            mentions: 36400, avgLikes: 1980, commentRatio: 77, shareAmp: 82, velocity: 87, sentiment: 64, ugc: 89, reach: 93,
            drivers: { speed: 88, aesthetic: 88, value: 76, quality: 91, service: 80 },
            platforms: { tiktok: 45, instagram: 35, facebook: 20 }
        },
        'iphone 16 pro': {
            name: 'iPhone 16 Pro', type: 'product', parentBrand: 'Apple', peer: 'Galaxy S24 Ultra',
            mentions: 28900, avgLikes: 1840, commentRatio: 87, shareAmp: 91, velocity: 93, sentiment: 58, ugc: 94, reach: 95,
            drivers: { speed: 92, aesthetic: 95, value: 54, quality: 93, service: 85 },
            platforms: { tiktok: 48, instagram: 38, facebook: 14 }
        },
        'galaxy s24 ultra': {
            name: 'Galaxy S24 Ultra', type: 'product', parentBrand: 'Samsung', peer: 'iPhone 16 Pro',
            mentions: 24100, avgLikes: 1620, commentRatio: 84, shareAmp: 85, velocity: 86, sentiment: 69, ugc: 88, reach: 90,
            drivers: { speed: 94, aesthetic: 89, value: 75, quality: 92, service: 81 },
            platforms: { tiktok: 46, instagram: 36, facebook: 18 }
        },
        'galaxy s24': {
            name: 'Galaxy S24', type: 'product', parentBrand: 'Samsung', peer: 'iPhone 16 Pro',
            mentions: 21400, avgLikes: 1490, commentRatio: 81, shareAmp: 82, velocity: 84, sentiment: 67, ugc: 86, reach: 88,
            drivers: { speed: 91, aesthetic: 87, value: 77, quality: 90, service: 80 },
            platforms: { tiktok: 45, instagram: 36, facebook: 19 }
        },
        'nike air max dn': {
            name: 'Nike Air Max Dn', type: 'product', parentBrand: 'Nike', peer: 'Adidas Ultraboost 5',
            mentions: 11400, avgLikes: 920, commentRatio: 81, shareAmp: 84, velocity: 85, sentiment: 66, ugc: 87, reach: 84,
            drivers: { speed: 79, aesthetic: 94, value: 65, quality: 88, service: 80 },
            platforms: { tiktok: 51, instagram: 39, facebook: 10 }
        },
        'adidas ultraboost 5': {
            name: 'Adidas Ultraboost 5', type: 'product', parentBrand: 'Adidas', peer: 'Nike Air Max Dn',
            mentions: 9800, avgLikes: 860, commentRatio: 86, shareAmp: 79, velocity: 80, sentiment: 75, ugc: 83, reach: 80,
            drivers: { speed: 85, aesthetic: 86, value: 73, quality: 94, service: 84 },
            platforms: { tiktok: 46, instagram: 43, facebook: 11 }
        },
        'sony wh-1000xm5': {
            name: 'Sony WH-1000XM5', type: 'product', parentBrand: 'Sony', peer: 'Bose QC Ultra',
            mentions: 8900, avgLikes: 740, commentRatio: 88, shareAmp: 82, velocity: 81, sentiment: 73, ugc: 86, reach: 85,
            drivers: { speed: 84, aesthetic: 91, value: 74, quality: 93, service: 80 },
            platforms: { tiktok: 47, instagram: 38, facebook: 15 }
        },
        'bose qc ultra': {
            name: 'Bose QC Ultra', type: 'product', parentBrand: 'Bose', peer: 'Sony WH-1000XM5',
            mentions: 7200, avgLikes: 690, commentRatio: 84, shareAmp: 76, velocity: 77, sentiment: 78, ugc: 80, reach: 79,
            drivers: { speed: 82, aesthetic: 85, value: 69, quality: 95, service: 86 },
            platforms: { tiktok: 42, instagram: 40, facebook: 18 }
        }
    };

    /* ==================== 3. STATE & MATCHUP DATA ==================== */
    const state = {
        category: 'brand', // 'brand' | 'product'
        sovMode: 'mentions',
        pulseCat: 'all',
        pulsePlat: 'all',
        activeQuery: 'Jollibee vs McDo',
        activeProfiles: [],
        recentHistory: [
            { query: 'Jollibee vs McDo', cat: 'brand', pinned: true },
            { query: 'KKOPI vs BigBrew', cat: 'brand', pinned: true },
            { query: 'iPhone 16 Pro vs Galaxy S24 Ultra', cat: 'product', pinned: false },
            { query: 'Nike Air Max Dn vs Adidas Ultraboost 5', cat: 'product', pinned: false },
            { query: 'Rhode vs Rare Beauty', cat: 'brand', pinned: false }
        ]
    };

    const MATCHUP_SUGGESTIONS = {
        brand: [
            { q: 'Jollibee vs McDo', tag: 'Fast Food Share of Voice & Sentiment', icon: 'chart' },
            { q: 'KKOPI vs BigBrew', tag: 'Alangilan Student Coffee Pulse', icon: 'coffee' },
            { q: 'KKOPI vs BigBrew vs JustCoffee', tag: '3-Brand Local Cafe Benchmark', icon: 'layers' },
            { q: 'Rhode vs Rare Beauty', tag: 'Creator Beauty Advocacy & Velocity', icon: 'spark' },
            { q: 'Apple vs Galaxy S24', tag: 'Test Mismatched Guardrail (Brand vs SKU)', icon: 'shield' }
        ],
        product: [
            { q: 'iPhone 16 Pro vs Galaxy S24 Ultra', tag: 'Flagship Camera & Battery OSINT', icon: 'phone' },
            { q: 'Nike Air Max Dn vs Adidas Ultraboost 5', tag: 'Running Shoe Comfort & Durability', icon: 'zap' },
            { q: 'Sony WH-1000XM5 vs Bose QC Ultra', tag: 'ANC Headphone Community Depth', icon: 'music' }
        ]
    };

    const PULSE_POSTS = [
        {
            id: 'p1', cat: 'food', plat: 'tiktok', handle: '@batstate.kape', time: '18m ago',
            sentiment: 'Positive', sentClass: 'sent-pos',
            caption: 'KKOPI pastel study corner in Alangilan is packed right now—oat spanish latte still undefeated vs BigBrew pila across the street #kkopi #alangilancoffee',
            views: '42.8K', likes: '4.9K', ratio: '11.4% C/L', velocity: '+184% vel',
            matchup: 'KKOPI vs BigBrew', mode: 'brand'
        },
        {
            id: 'p2', cat: 'food', plat: 'facebook', handle: 'South Luzon Foodies', time: '41m ago',
            sentiment: 'Positive', sentClass: 'sent-pos',
            caption: 'Chickenjoy spicy bucket size comparison vs McDo new crispy chicken cut—comments are 4,200+ debating which gravy & rice combo is more sulit.',
            views: '118K', likes: '9.4K', ratio: '14.2% C/L', velocity: '+210% vel',
            matchup: 'Jollibee vs McDo', mode: 'brand'
        },
        {
            id: 'p3', cat: 'tech', plat: 'instagram', handle: '@techbench.ph', time: '1h ago',
            sentiment: 'Mixed', sentClass: 'sent-mix',
            caption: 'Concert zoom test at Philippine Arena: Galaxy S24 Ultra 5x optical vs iPhone 16 Pro low-light video stabilization. Full raw clips in reel.',
            views: '295K', likes: '24.1K', ratio: '9.8% C/L', velocity: '+165% vel',
            matchup: 'iPhone 16 Pro vs Galaxy S24 Ultra', mode: 'product'
        },
        {
            id: 'p4', cat: 'beauty', plat: 'tiktok', handle: '@glowcheck.mnl', time: '2h ago',
            sentiment: 'Positive', sentClass: 'sent-pos',
            caption: 'Humidity wear test in Manila traffic: Rare Beauty Soft Pinch vs Rhode Pocket Blush. Look at the pigment hold after 6 hours!',
            views: '164K', likes: '19.2K', ratio: '12.6% C/L', velocity: '+148% vel',
            matchup: 'Rhode vs Rare Beauty', mode: 'brand'
        },
        {
            id: 'p5', cat: 'tech', plat: 'tiktok', handle: '@runclub.bgc', time: '3h ago',
            sentiment: 'Positive', sentClass: 'sent-pos',
            caption: '10km tempo run review: Adidas Ultraboost 5 Lightboost foam energy return vs Nike Air Max Dn dynamic air pods.',
            views: '88.4K', likes: '7.1K', ratio: '10.9% C/L', velocity: '+122% vel',
            matchup: 'Nike Air Max Dn vs Adidas Ultraboost 5', mode: 'product'
        }
    ];

    /* ==================== 4. ENTITY RESOLUTION & GUARDRAIL LOGIC ==================== */
    function getProfile(rawName) {
        const clean = rawName.trim();
        const key = clean.toLowerCase();
        if (ENTITIES[key]) return { ...ENTITIES[key] };

        const isSkuPattern = /\b(pro|max|ultra|plus|dn|xm\d|\d+)\b/i.test(clean);
        const r = seededRng(hashSeed(key));
        const t = 35 + Math.floor(r() * 25);
        const ig = 25 + Math.floor(r() * 20);
        const fb = Math.max(10, 100 - t - ig);

        return {
            name: clean,
            type: isSkuPattern ? 'product' : state.category,
            mentions: 4200 + Math.floor(r() * 9000),
            avgLikes: 410 + Math.floor(r() * 750),
            commentRatio: 58 + Math.floor(r() * 35),
            shareAmp: 55 + Math.floor(r() * 36),
            velocity: 56 + Math.floor(r() * 38),
            sentiment: 38 + Math.floor(r() * 52),
            ugc: 60 + Math.floor(r() * 34),
            reach: 62 + Math.floor(r() * 32),
            drivers: {
                speed: 55 + Math.floor(r() * 38),
                aesthetic: 55 + Math.floor(r() * 38),
                value: 55 + Math.floor(r() * 38),
                quality: 60 + Math.floor(r() * 35),
                service: 55 + Math.floor(r() * 38)
            },
            platforms: { tiktok: t, instagram: ig, facebook: fb }
        };
    }

    function parsePromptEntities(q) {
        return q
            .replace(/^(compare|benchmark|analyze)\s+/i, '')
            .split(/\s+(?:vs\.?|versus|and)\s+|\s*,\s*|\s*&\s*/i)
            .map(x => x.trim())
            .filter(Boolean)
            .slice(0, 3);
    }

    /* ==================== 5. RENDER COMPARE PAGE & SIDEBAR ==================== */
    function renderCompareSuggestions() {
        const list = MATCHUP_SUGGESTIONS[state.category];
        const icons = {
            chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
            coffee: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>`,
            layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
            spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
            shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
            phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
            zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
            music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`
        };

        document.getElementById('exploreMatchupsList').innerHTML = list.map(item => `
            <button type="button" class="g-suggest-row" onclick="executeComparison('${item.q}')">
                ${icons[item.icon] || icons.chart}
                <span class="g-suggest-title">${item.q}</span>
                <span class="g-suggest-sub">${item.tag}</span>
            </button>
        `).join('');
    }

    function renderSidebarRecents() {
        document.getElementById('recentCountLabel').textContent = state.recentHistory.length;
        document.getElementById('sidebarRecentList').innerHTML = state.recentHistory.map(item => `
            <button type="button" class="recent-chat-row" onclick="executeComparison('${item.query}', '${item.cat}')">
                <span class="r-label">${item.query}</span>
                <svg class="pin-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
            </button>
        `).join('');
    }

    /* ==================== 6. RENDER UNPROMPTED "TRENDING NOW" SOCIAL FEED ==================== */
    function renderHomePulse() {
        const filtered = PULSE_POSTS.filter(p =>
            (state.pulseCat === 'all' || p.cat === state.pulseCat) &&
            (state.pulsePlat === 'all' || p.plat === state.pulsePlat)
        );

        const platLabel = { tiktok: 'TT', instagram: 'IG', facebook: 'FB' };

        document.getElementById('pulseFeedStream').innerHTML = filtered.map(post => `
            <article class="feed-card">
                <div class="fc-top">
                    <div class="fc-author">
                        <div class="plat-icon plat-${post.plat}">${platLabel[post.plat]}</div>
                        <div class="fc-handle">
                            <strong>${post.handle}</strong>
                            <span>${post.plat.toUpperCase()} • ${post.time}</span>
                        </div>
                    </div>
                    <span class="sent-badge ${post.sentClass}">${post.sentiment}</span>
                </div>
                <p class="fc-caption">${post.caption}</p>
                <div class="fc-metrics-bar">
                    <div class="fc-stats">
                        <span>Views: <b>${post.views}</b></span>
                        <span>Likes: <b>${post.likes}</b></span>
                        <span>Depth: <b>${post.ratio}</b></span>
                        <span style="color:var(--ok); font-weight:700;">${post.velocity}</span>
                    </div>
                    <button type="button" class="fc-compare-btn" onclick="executeComparison('${post.matchup}', '${post.mode}')">
                        Compare ${post.matchup} &rarr;
                    </button>
                </div>
            </article>
        `).join('');

        const leaders = [
            { rank: 1, tag: '#Jollibee', vol: '12.4k mentions', spike: '+34%', match: 'Jollibee vs McDo', mode: 'brand' },
            { rank: 2, tag: '#iPhone16Pro', vol: '28.9k mentions', spike: '+29%', match: 'iPhone 16 Pro vs Galaxy S24 Ultra', mode: 'product' },
            { rank: 3, tag: '#KKOPI', vol: '6.8k mentions', spike: '+24%', match: 'KKOPI vs BigBrew', mode: 'brand' },
            { rank: 4, tag: '#RareBeauty', vol: '22.1k mentions', spike: '+19%', match: 'Rhode vs Rare Beauty', mode: 'brand' },
            { rank: 5, tag: '#Ultraboost5', vol: '9.8k mentions', spike: '+16%', match: 'Nike Air Max Dn vs Adidas Ultraboost 5', mode: 'product' }
        ];

        document.getElementById('pulseLeaderboard').innerHTML = leaders.map(l => `
            <div class="trend-row" onclick="executeComparison('${l.match}', '${l.mode}')">
                <div class="t-rank">${l.rank}</div>
                <div class="t-info">
                    <strong>${l.tag}</strong>
                    <span>${l.vol}</span>
                </div>
                <span class="t-spike">${l.spike}</span>
            </div>
        `).join('');

        document.getElementById('pulseRecentGrid').innerHTML = [
            {
                title: 'Jollibee vs McDo', sub: '57% vs 43% SOV', mode: 'brand',
                svg: `<svg viewBox="0 0 120 44" width="100%" height="100%"><circle cx="38" cy="22" r="14" fill="var(--c0)"/><circle cx="82" cy="24" r="11" fill="var(--c1)"/></svg>`
            },
            {
                title: 'KKOPI vs BigBrew', sub: 'Depth +24 pts', mode: 'brand',
                svg: `<svg viewBox="0 0 120 44" width="100%" height="100%"><polygon points="60,4 85,18 78,40 42,40 35,18" fill="var(--c0-soft)" stroke="var(--c0)" stroke-width="2"/></svg>`
            },
            {
                title: 'iPhone 16 Pro vs S24 Ultra', sub: 'SKU Benchmark', mode: 'product',
                svg: `<svg viewBox="0 0 120 44" width="100%" height="100%"><rect x="12" y="12" width="58" height="8" rx="4" fill="var(--c0)"/><rect x="12" y="25" width="46" height="8" rx="4" fill="var(--c1)"/></svg>`
            },
            {
                title: 'Rhode vs Rare Beauty', sub: 'Beauty Pulse', mode: 'brand',
                svg: `<svg viewBox="0 0 120 44" width="100%" height="100%"><circle cx="60" cy="22" r="15" fill="none" stroke="var(--c0)" stroke-width="6" stroke-dasharray="52 100"/><circle cx="60" cy="22" r="15" fill="none" stroke="var(--c1)" stroke-width="6" stroke-dasharray="48 100" stroke-dashoffset="-52"/></svg>`
            }
        ].map(c => `
            <div class="mini-card" onclick="executeComparison('${c.title}', '${c.mode}')">
                <div class="mini-svg-wrap">${c.svg}</div>
                <h4>${c.title}</h4>
                <span>${c.sub}</span>
            </div>
        `).join('');
    }

    /* ==================== 7. INTERRUPTIBLE SPRING CHART CONTROLLERS (DONUT, SCATTER, RADAR, DRIVERS) ==================== */
    const chartSprings = {
        sovShares: [new SpringValue(50), new SpringValue(50), new SpringValue(0)],
        platShares: {
            tiktok: [new SpringValue(50), new SpringValue(50), new SpringValue(0)],
            instagram: [new SpringValue(50), new SpringValue(50), new SpringValue(0)],
            facebook: [new SpringValue(50), new SpringValue(50), new SpringValue(0)]
        },
        radarValues: [
            [new SpringValue(70), new SpringValue(70), new SpringValue(70), new SpringValue(70), new SpringValue(70), new SpringValue(70)],
            [new SpringValue(60), new SpringValue(60), new SpringValue(60), new SpringValue(60), new SpringValue(60), new SpringValue(60)],
            [new SpringValue(50), new SpringValue(50), new SpringValue(50), new SpringValue(50), new SpringValue(50), new SpringValue(50)]
        ],
        driverValues: {},
        scatterNodes: [
            { cx: new SpringValue(240), cy: new SpringValue(100), r: new SpringValue(20), pullX: new SpringValue(0), pullY: new SpringValue(0) },
            { cx: new SpringValue(240), cy: new SpringValue(100), r: new SpringValue(20), pullX: new SpringValue(0), pullY: new SpringValue(0) },
            { cx: new SpringValue(240), cy: new SpringValue(100), r: new SpringValue(20), pullX: new SpringValue(0), pullY: new SpringValue(0) }
        ]
    };

    function renderVisualResults() {
        const list = state.activeProfiles;
        if (!list || list.length < 2) return;

        list.forEach((e, i) => {
            e.color = PALETTE[i];
            e.weightedEngage = Math.round(e.mentions * e.avgLikes * (0.09 + (e.commentRatio / 100) * 0.11));
        });

        const totMentions = list.reduce((s, e) => s + e.mentions, 0);
        document.getElementById('resMatchupTitle').textContent = list.map(e => e.name).join(' vs ');
        document.getElementById('resEntityBadge').textContent = `${list[0].type === 'product' ? 'Products (SKU vs SKU)' : 'Brands (Brand vs Brand)'} • 30d OSINT`;
        document.getElementById('resFilterSummary').textContent = `${totMentions.toLocaleString()} verified public posts analyzed`;

        document.getElementById('resLegendItems').innerHTML = list.map(e => `
            <div class="l-chip">
                <span class="l-dot" style="background:${e.color.hex}"></span>
                <span>${e.name}</span>
                <small>${e.mentions.toLocaleString()} posts (${Math.round(e.mentions / totMentions * 100)}% SOV)</small>
            </div>
        `).join('');

        drawSovVisual();
        drawSentimentScatter();
        drawRadarAndDrivers();
    }

    function drawSovVisual() {
        const list = state.activeProfiles;
        const isEng = state.sovMode === 'engagement';
        const val = e => isEng ? e.weightedEngage : e.mentions;
        const tot = list.reduce((s, e) => s + val(e), 0) || 1;

        const r = 44, c = 2 * Math.PI * r;
        const donutBox = document.getElementById('sovDonutBox');

        // Ensure SVG structure exists once for interruptible morphing
        if (!donutBox.querySelector('svg')) {
            donutBox.innerHTML = `
                <svg viewBox="0 0 120 120" width="128" height="128">
                    <g transform="rotate(-90 60 60)" id="sovRingsGroup">
                        <circle id="sovRing0" cx="60" cy="60" r="${r}" fill="none" stroke="var(--c0)" stroke-width="16"/>
                        <circle id="sovRing1" cx="60" cy="60" r="${r}" fill="none" stroke="var(--c1)" stroke-width="16"/>
                        <circle id="sovRing2" cx="60" cy="60" r="${r}" fill="none" stroke="var(--c2)" stroke-width="16"/>
                    </g>
                    <text id="sovCenterPct" x="60" y="57" text-anchor="middle" font-size="16" font-weight="800" fill="var(--ink)">50%</text>
                    <text id="sovCenterName" x="60" y="73" text-anchor="middle" font-size="12" font-weight="700" fill="var(--muted)">Brand</text>
                </svg>
            `;
        }

        const win = [...list].sort((a, b) => val(b) - val(a))[0];
        const winIdx = list.indexOf(win);
        const winPctTarget = Math.round(val(win) / tot * 100);
        document.getElementById('sovCenterName').textContent = win.name;

        const updateDonutDOM = () => {
            let off = 0;
            for (let i = 0; i < 3; i++) {
                const ring = document.getElementById('sovRing' + i);
                const e = list[i];
                const sharePct = Math.max(0, chartSprings.sovShares[i].value);
                const len = (sharePct / 100) * c;
                if (!e || sharePct <= 0.1) {
                    ring.setAttribute('stroke-dasharray', `0 ${c}`);
                } else {
                    ring.setAttribute('stroke', e.color.hex);
                    ring.setAttribute('stroke-dasharray', `${len} ${c}`);
                    ring.setAttribute('stroke-dashoffset', String(-off));
                    ring.onmousemove = ev => showTip(ev, `${e.name}: ${Math.round(sharePct)}% Share`);
                    ring.onmouseleave = hideTip;
                    off += len;
                }
            }
            const leadVal = Math.round(chartSprings.sovShares[winIdx] ? chartSprings.sovShares[winIdx].value : winPctTarget);
            document.getElementById('sovCenterPct').textContent = `${leadVal}%`;
        };

        for (let i = 0; i < 3; i++) {
            const targetPct = list[i] ? (val(list[i]) / tot) * 100 : 0;
            chartSprings.sovShares[i].animateTo(targetPct, {
                damping: 0.92,
                response: 0.36,
                onUpdate: updateDonutDOM
            });
        }

        // Platform Split Bars with Spring Width Interpolation
        const plats = [['tiktok', 'TikTok'], ['instagram', 'Instagram'], ['facebook', 'Facebook']];
        const platBox = document.getElementById('sovPlatBarsBox');
        if (!platBox.querySelector('.p-track')) {
            platBox.innerHTML = plats.map(([pk, pl]) => `
                <div>
                    <div class="p-row-lbl"><span>${pl}</span></div>
                    <div class="p-track" id="platTrack_${pk}">
                        <div class="p-seg" id="platSeg_${pk}_0" style="background:var(--c0)"></div>
                        <div class="p-seg" id="platSeg_${pk}_1" style="background:var(--c1)"></div>
                        <div class="p-seg" id="platSeg_${pk}_2" style="background:var(--c2)"></div>
                    </div>
                </div>
            `).join('');
        }

        plats.forEach(([pk]) => {
            const ptot = list.reduce((s, e) => s + val(e) * (e.platforms[pk] / 100), 0) || 1;
            for (let i = 0; i < 3; i++) {
                const targetSh = list[i] ? ((val(list[i]) * (list[i].platforms[pk] / 100)) / ptot) * 100 : 0;
                const segEl = document.getElementById(`platSeg_${pk}_${i}`);
                chartSprings.platShares[pk][i].animateTo(targetSh, {
                    damping: 0.94,
                    response: 0.36,
                    onUpdate: v => {
                        const clamped = Math.max(0, v);
                        segEl.style.width = `${clamped}%`;
                        segEl.textContent = clamped >= 18 ? `${Math.round(clamped)}%` : '';
                    }
                });
            }
        });

        document.getElementById('sovTakeawayLine').innerHTML = `
            <b class="k-tag">SOV Lead</b>
            <span><strong>${win.name}</strong> captures <strong>${winPctTarget}%</strong> of total 30-day ${isEng ? 'weighted engagement' : 'mention volume'}.</span>
        `;
    }

    function drawSentimentScatter() {
        const list = state.activeProfiles;
        const W = 480, H = 210, L = 40, R = 20, T = 20, B = 30;
        const pw = W - L - R, ph = H - T - B;
        const x = s => L + (Math.max(10, Math.min(98, s)) / 100) * pw;
        const y = v => T + (1 - (Math.max(40, Math.min(98, v)) - 40) / 60) * ph;
        const maxM = Math.max(...list.map(e => e.mentions), 1);

        const mapBox = document.getElementById('sentimentMapBox');
        if (!mapBox.querySelector('svg')) {
            mapBox.innerHTML = `
                <svg id="scatterSvg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">
                    <rect x="${L}" y="${T}" width="${pw}" height="${ph}" rx="8" fill="var(--surface)"/>
                    <line x1="${L + pw / 2}" y1="${T}" x2="${L + pw / 2}" y2="${T + ph}" stroke="var(--line)" stroke-dasharray="4 4"/>
                    <line x1="${L}" y1="${T + ph / 2}" x2="${L + pw}" y2="${T + ph / 2}" stroke="var(--line)" stroke-dasharray="4 4"/>
                    <text x="${L + 10}" y="${T + 16}" font-size="12" font-weight="700" fill="var(--muted)">HIGH VELOCITY / POLARIZING</text>
                    <text x="${L + pw - 10}" y="${T + 16}" text-anchor="end" font-size="12" font-weight="700" fill="var(--ok)">LEADER (VELOCITY + LOVE)</text>
                    <text x="${L + pw / 2}" y="${H - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--muted)">Net Positive Sentiment &rarr;</text>
                    <g id="scatterNodesLayer">
                        ${[0, 1, 2].map(i => `
                            <g class="scatter-node-group" id="scatterNode_${i}" data-idx="${i}">
                                <line id="scatterTether_${i}" x1="0" y1="0" x2="0" y2="0" stroke="var(--line-bright)" stroke-width="1.5" stroke-dasharray="3 3" opacity="0"/>
                                <circle id="scatterCircle_${i}" cx="240" cy="100" r="0" fill="var(--c${i})" fill-opacity="0.90" stroke="var(--surface)" stroke-width="2.2"/>
                                <text id="scatterLabel_${i}" x="240" y="104" text-anchor="middle" fill="#05130E" font-size="12" font-weight="800"></text>
                            </g>
                        `).join('')}
                    </g>
                </svg>
            `;
            initScatterRubberBandDrag();
        }

        const renderNodeIndex = (i) => {
            const e = state.activeProfiles[i];
            const g = document.getElementById(`scatterNode_${i}`);
            const cEl = document.getElementById(`scatterCircle_${i}`);
            const tEl = document.getElementById(`scatterLabel_${i}`);
            const tether = document.getElementById(`scatterTether_${i}`);
            const ns = chartSprings.scatterNodes[i];

            if (!e) {
                g.style.display = 'none';
                return;
            }
            g.style.display = 'block';
            const anchorX = ns.cx.value;
            const anchorY = ns.cy.value;
            const px = anchorX + ns.pullX.value;
            const py = anchorY + ns.pullY.value;

            cEl.setAttribute('cx', px.toFixed(2));
            cEl.setAttribute('cy', py.toFixed(2));
            cEl.setAttribute('r', Math.max(0, ns.r.value).toFixed(2));
            cEl.setAttribute('fill', e.color.hex);

            tEl.setAttribute('x', px.toFixed(2));
            tEl.setAttribute('y', (py + 4).toFixed(2));
            tEl.textContent = e.name;

            const dist = Math.hypot(ns.pullX.value, ns.pullY.value);
            if (dist > 1.5) {
                tether.setAttribute('x1', anchorX.toFixed(2));
                tether.setAttribute('y1', anchorY.toFixed(2));
                tether.setAttribute('x2', px.toFixed(2));
                tether.setAttribute('y2', py.toFixed(2));
                tether.setAttribute('opacity', '0.85');
            } else {
                tether.setAttribute('opacity', '0');
            }

            g.onmousemove = ev => showTip(ev, `${e.name} • Sentiment: +${e.sentiment}% • Velocity: ${e.velocity}/100 (Drag bubble)`);
            g.onmouseleave = hideTip;
        };

        for (let i = 0; i < 3; i++) {
            const e = list[i];
            const ns = chartSprings.scatterNodes[i];
            if (!e) {
                ns.r.animateTo(0, { damping: 0.9, response: 0.3, onUpdate: () => renderNodeIndex(i) });
                continue;
            }
            const targetX = x(e.sentiment);
            const targetY = y(e.velocity);
            const targetR = 16 + 12 * Math.sqrt(e.mentions / maxM);

            ns.cx.animateTo(targetX, { damping: 0.86, response: 0.38, onUpdate: () => renderNodeIndex(i) });
            ns.cy.animateTo(targetY, { damping: 0.86, response: 0.38, onUpdate: () => renderNodeIndex(i) });
            ns.r.animateTo(targetR, { damping: 0.82, response: 0.36, onUpdate: () => renderNodeIndex(i) });
        }

        const bestS = [...list].sort((a, b) => b.sentiment - a.sentiment)[0];
        document.getElementById('mapTakeawayLine').innerHTML = `
            <b class="k-tag">Sentiment</b>
            <span><strong>${bestS.name}</strong> leads audience goodwill with <strong>+${bestS.sentiment}%</strong> net positive phrasing.</span>
        `;
    }

    /**
     * Direct Manipulation & Rubber-Banding on Sentiment Scatter Bubbles
     */
    function initScatterRubberBandDrag() {
        const svg = document.getElementById('scatterSvg');
        [0, 1, 2].forEach(i => {
            const group = document.getElementById(`scatterNode_${i}`);
            let dragging = false;
            let startClientX = 0, startClientY = 0;
            let lastDx = 0, lastDy = 0, lastT = 0;
            let vx = 0, vy = 0;

            group.addEventListener('pointerdown', e => {
                if (!state.activeProfiles[i]) return;
                dragging = true;
                group.setPointerCapture(e.pointerId);
                startClientX = e.clientX;
                startClientY = e.clientY;
                lastDx = 0;
                lastDy = 0;
                lastT = performance.now();
                vx = 0;
                vy = 0;
                e.stopPropagation();
            });

            group.addEventListener('pointermove', e => {
                if (!dragging) return;
                const rect = svg.getBoundingClientRect();
                const scaleX = 480 / Math.max(1, rect.width);
                const scaleY = 210 / Math.max(1, rect.height);
                const rawDx = (e.clientX - startClientX) * scaleX;
                const rawDy = (e.clientY - startClientY) * scaleY;

                // Apply Apple Rubber-Band Resistance (constant = 0.55, dimension = 65 SVG units)
                const rbX = rubberband(rawDx, 65, 0.55);
                const rbY = rubberband(rawDy, 65, 0.55);

                const now = performance.now();
                const dt = Math.max(1, now - lastT) / 1000;
                vx = (rbX - lastDx) / dt;
                vy = (rbY - lastDy) / dt;
                lastDx = rbX;
                lastDy = rbY;
                lastT = now;

                const ns = chartSprings.scatterNodes[i];
                ns.pullX.setImmediate(rbX);
                ns.pullY.setImmediate(rbY);

                // Re-render position immediately (1:1 tracking with rubber-band curve)
                const cEl = document.getElementById(`scatterCircle_${i}`);
                const tEl = document.getElementById(`scatterLabel_${i}`);
                const tether = document.getElementById(`scatterTether_${i}`);
                const px = ns.cx.value + rbX;
                const py = ns.cy.value + rbY;
                cEl.setAttribute('cx', px.toFixed(2));
                cEl.setAttribute('cy', py.toFixed(2));
                tEl.setAttribute('x', px.toFixed(2));
                tEl.setAttribute('y', (py + 4).toFixed(2));
                tether.setAttribute('x1', ns.cx.value.toFixed(2));
                tether.setAttribute('y1', ns.cy.value.toFixed(2));
                tether.setAttribute('x2', px.toFixed(2));
                tether.setAttribute('y2', py.toFixed(2));
                tether.setAttribute('opacity', '0.85');
            });

            const endDrag = e => {
                if (!dragging) return;
                dragging = false;
                try { group.releasePointerCapture(e.pointerId); } catch (_) {}

                const ns = chartSprings.scatterNodes[i];
                const updateDOM = () => {
                    const cEl = document.getElementById(`scatterCircle_${i}`);
                    const tEl = document.getElementById(`scatterLabel_${i}`);
                    const tether = document.getElementById(`scatterTether_${i}`);
                    const px = ns.cx.value + ns.pullX.value;
                    const py = ns.cy.value + ns.pullY.value;
                    cEl.setAttribute('cx', px.toFixed(2));
                    cEl.setAttribute('cy', py.toFixed(2));
                    tEl.setAttribute('x', px.toFixed(2));
                    tEl.setAttribute('y', (py + 4).toFixed(2));
                    const dist = Math.hypot(ns.pullX.value, ns.pullY.value);
                    tether.setAttribute('x2', px.toFixed(2));
                    tether.setAttribute('y2', py.toFixed(2));
                    tether.setAttribute('opacity', dist > 1.2 ? '0.85' : '0');
                };

                // Spring back to true OSINT coordinate with velocity handoff (damping: 0.72, response: 0.38)
                ns.pullX.animateTo(0, { damping: 0.72, response: 0.38, initialVelocity: vx, onUpdate: updateDOM });
                ns.pullY.animateTo(0, { damping: 0.72, response: 0.38, initialVelocity: vy, onUpdate: updateDOM });
            };

            group.addEventListener('pointerup', endDrag);
            group.addEventListener('pointercancel', endDrag);
        });
    }

    function drawRadarAndDrivers() {
        const list = state.activeProfiles;
        const axes = [
            ['commentRatio', 'Comment Ratio'],
            ['shareAmp', 'Share Virality'],
            ['velocity', '24h Velocity'],
            ['sentiment', 'Brand Love'],
            ['ugc', 'Creator UGC'],
            ['reach', 'Platform Reach']
        ];

        const W = 360, H = 222, cx = W / 2, cy = H / 2 + 2, R = 74;
        const ang = i => -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
        const pt = (i, v) => [cx + R * (v / 100) * Math.cos(ang(i)), cy + R * (v / 100) * Math.sin(ang(i))];

        const radarBox = document.getElementById('radarSvgBox');
        if (!radarBox.querySelector('svg')) {
            const grids = [35, 70, 100].map(lv => `<polygon points="${axes.map((_, i) => pt(i, lv).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`).join('');
            const spokes = axes.map((a, i) => {
                const [ex, ey] = pt(i, 100), [lx, ly] = pt(i, 122);
                const anc = Math.cos(ang(i)) > 0.25 ? 'start' : Math.cos(ang(i)) < -0.25 ? 'end' : 'middle';
                return `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="var(--line)"/><text x="${lx}" y="${ly + 4}" text-anchor="${anc}" font-size="12" font-weight="700" fill="var(--ink)">${a[1]}</text>`;
            }).join('');
            const polys = [0, 1, 2].map(bIdx => `<polygon id="radarPoly_${bIdx}" points="" fill="var(--c${bIdx}-soft)" stroke="var(--c${bIdx})" stroke-width="2.2"/>`).join('');
            radarBox.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="215">${grids}${spokes}${polys}</svg>`;
        }

        const updateRadarPoly = (bIdx) => {
            const polyEl = document.getElementById(`radarPoly_${bIdx}`);
            const e = state.activeProfiles[bIdx];
            if (!e) {
                polyEl.setAttribute('points', '');
                return;
            }
            const pts = axes.map((_, axisIdx) => pt(axisIdx, chartSprings.radarValues[bIdx][axisIdx].value));
            polyEl.setAttribute('points', pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '));
        };

        for (let bIdx = 0; bIdx < 3; bIdx++) {
            const e = list[bIdx];
            const polyEl = document.getElementById(`radarPoly_${bIdx}`);
            if (!e) {
                polyEl.style.display = 'none';
                continue;
            }
            polyEl.style.display = 'block';
            axes.forEach((a, axisIdx) => {
                chartSprings.radarValues[bIdx][axisIdx].animateTo(e[a[0]], {
                    damping: 0.88,
                    response: 0.36,
                    onUpdate: () => updateRadarPoly(bIdx)
                });
            });
        }

        // 5-Driver Bars with Interruptible Spring Widths
        const drivers = [
            ['speed', 'Speed & Convenience'],
            ['aesthetic', 'Aesthetic & Packaging'],
            ['value', 'Price-to-Value (Sulit)'],
            ['quality', 'Product / Taste Quality'],
            ['service', 'Community Experience']
        ];

        document.getElementById('driverBarsBox').innerHTML = drivers.map(([dk, dl]) => {
            const top = [...list].sort((a, b) => b.drivers[dk] - a.drivers[dk])[0];
            const rows = list.map((e, i) => `
                <div class="drv-line">
                    <span class="drv-name" style="color:${e.color.text}">${e.name}</span>
                    <div class="drv-track"><div class="drv-fill" id="drvFill_${dk}_${i}" style="width:0%; background:${e.color.hex}"></div></div>
                    <span class="drv-val" id="drvVal_${dk}_${i}">${e.drivers[dk]}</span>
                </div>
            `).join('');
            return `<div class="drv-item"><div class="drv-head"><span>${dl}</span><span style="color:var(--muted); font-size:12px;">Lead: ${top.name}</span></div>${rows}</div>`;
        }).join('');

        drivers.forEach(([dk]) => {
            list.forEach((e, i) => {
                const key = `${dk}_${i}`;
                if (!chartSprings.driverValues[key]) {
                    chartSprings.driverValues[key] = new SpringValue(e.drivers[dk]);
                }
                const fillEl = document.getElementById(`drvFill_${dk}_${i}`);
                const valEl = document.getElementById(`drvVal_${dk}_${i}`);
                chartSprings.driverValues[key].animateTo(e.drivers[dk], {
                    damping: 0.92,
                    response: 0.35,
                    onUpdate: v => {
                        if (fillEl) fillEl.style.width = `${Math.max(0, Math.min(100, v)).toFixed(1)}%`;
                        if (valEl) valEl.textContent = String(Math.round(v));
                    }
                });
            });
        });

        const depthWin = [...list].sort((a, b) => b.commentRatio - a.commentRatio)[0];
        document.getElementById('radarTakeawayLine').innerHTML = `
            <b class="k-tag">Depth Winner</b>
            <span><strong>${depthWin.name}</strong> commands the strongest active community advocacy (${depthWin.commentRatio}/100 Comment-to-Like depth).</span>
        `;
    }

    /* ==================== 8. DRAGGABLE & FLICKABLE SIDEBAR WITH RUBBER-BANDING + MOMENTUM ==================== */
    const sidebarEl = document.getElementById('sidebar');
    const sidebarHandle = document.getElementById('sidebarGrabHandle');
    const sidebarSpring = new SpringValue(268);
    let isSidebarCollapsed = false;

    function applySidebarWidth(w) {
        const clamped = Math.max(52, Math.min(330, w));
        sidebarEl.style.width = `${clamped.toFixed(1)}px`;
        const shouldCollapse = clamped < 136;
        if (shouldCollapse !== isSidebarCollapsed) {
            isSidebarCollapsed = shouldCollapse;
            sidebarEl.classList.toggle('collapsed', isSidebarCollapsed);
        }
    }

    function snapSidebarTo(open, initialVelocity = 0) {
        const target = open ? 268 : 64;
        sidebarSpring.animateTo(target, {
            damping: 0.82,
            response: 0.32,
            initialVelocity,
            onUpdate: applySidebarWidth,
            onComplete: () => {
                sidebarEl.style.width = `${target}px`;
                isSidebarCollapsed = !open;
                sidebarEl.classList.toggle('collapsed', !open);
            }
        });
    }

    (() => {
        let dragging = false;
        let startX = 0;
        let startWidth = 268;
        let lastX = 0;
        let lastTime = 0;
        let velocityX = 0;

        sidebarHandle.addEventListener('pointerdown', e => {
            dragging = true;
            sidebarEl.classList.add('is-dragging');
            sidebarHandle.setPointerCapture(e.pointerId);
            startX = e.clientX;
            startWidth = sidebarSpring.value;
            lastX = e.clientX;
            lastTime = performance.now();
            velocityX = 0;
            e.preventDefault();
        });

        sidebarHandle.addEventListener('pointermove', e => {
            if (!dragging) return;
            const now = performance.now();
            const dt = Math.max(1, now - lastTime);
            velocityX = ((e.clientX - lastX) / dt) * 1000; // px/s
            lastX = e.clientX;
            lastTime = now;

            const rawW = startWidth + (e.clientX - startX);
            let effectiveW = rawW;
            // Rubber-band resistance past open (268px) or collapsed (64px) limits
            if (rawW > 268) {
                effectiveW = 268 + rubberband(rawW - 268, 80, 0.55);
            } else if (rawW < 64) {
                effectiveW = 64 - rubberband(64 - rawW, 40, 0.55);
            }
            sidebarSpring.setImmediate(effectiveW);
            applySidebarWidth(effectiveW);
        });

        const finishSidebarDrag = e => {
            if (!dragging) return;
            dragging = false;
            sidebarEl.classList.remove('is-dragging');
            try { sidebarHandle.releasePointerCapture(e.pointerId); } catch (_) {}

            // Apple Momentum Projection: project where the sidebar would land at rest
            const projectedEnd = sidebarSpring.value + project(velocityX, 0.996);
            const open = projectedEnd > 166;
            snapSidebarTo(open, velocityX);
        };

        sidebarHandle.addEventListener('pointerup', finishSidebarDrag);
        sidebarHandle.addEventListener('pointercancel', finishSidebarDrag);
    })();

    /* ==================== 9. SPRING SEGMENTED CONTROLS & SCROLL-EDGE TOPBAR ==================== */
    const modeThumbSpring = new SpringValue(0);
    const sovThumbSpring = new SpringValue(0);

    // Dynamic Scroll-Edge Topbar Blur Listener
    const mainViewport = document.getElementById('mainViewport');
    const mainTopbar = document.getElementById('mainTopbar');
    mainViewport.addEventListener('scroll', () => {
        mainTopbar.classList.toggle('is-scrolled', mainViewport.scrollTop > 10);
    }, { passive: true });

    /* ==================== 10. INTERACTIVE CONTROLLERS ==================== */
    function updateHeroTransformOrigin(ev) {
        if (ev && typeof ev.clientX === 'number') {
            const ox = Math.round((ev.clientX / window.innerWidth) * 100);
            const oy = Math.round((ev.clientY / window.innerHeight) * 100);
            document.documentElement.style.setProperty('--hero-origin-x', `${ox}%`);
            document.documentElement.style.setProperty('--hero-origin-y', `${oy}%`);
        } else {
            document.documentElement.style.setProperty('--hero-origin-x', '50%');
            document.documentElement.style.setProperty('--hero-origin-y', '58%');
        }
    }

    window.enterWorkspace = function(targetView, ev) {
        updateHeroTransformOrigin(ev);
        const hero = document.getElementById('heroLanding');
        if (hero) hero.classList.add('is-hidden');
        if (targetView) switchView(targetView);
        if (targetView === 'compare') {
            setTimeout(() => {
                const inp = document.getElementById('compareInput');
                if (inp) inp.focus();
            }, 220);
        }
    };

    window.showHeroLanding = function(ev) {
        updateHeroTransformOrigin(ev);
        const hero = document.getElementById('heroLanding');
        if (hero) hero.classList.remove('is-hidden');
    };

    window.switchView = function(view) {
        document.querySelectorAll('.view-page').forEach(p => p.classList.remove('active'));
        const el = document.getElementById('view-' + view);
        if (el) el.classList.add('active');

        document.querySelectorAll('.nav-item').forEach(b => {
            b.classList.toggle('active', b.dataset.nav === view);
        });

        const newChatBtn = document.getElementById('btnNewChat');
        if (newChatBtn) {
            newChatBtn.classList.toggle('active', view === 'compare');
        }
        mainViewport.scrollTop = 0;
    };

    window.toggleSidebar = function() {
        snapSidebarTo(isSidebarCollapsed, 0);
    };

    window.startNewComparison = function() {
        document.getElementById('guardrailCard').classList.remove('visible');
        switchView('compare');
        const inp = document.getElementById('compareInput');
        inp.value = '';
        inp.focus();
    };

    window.setCompareCategory = function(cat) {
        state.category = cat;
        document.getElementById('pillModeBrand').classList.toggle('active', cat === 'brand');
        document.getElementById('pillModeProduct').classList.toggle('active', cat === 'product');
        document.getElementById('scopeIndicatorChip').innerHTML = `${cat === 'brand' ? 'Brands' : 'Products'} 30d &#9662;`;

        const thumb = document.getElementById('modeSegmentedThumb');
        modeThumbSpring.animateTo(cat === 'brand' ? 0 : 100, {
            damping: 1.0,
            response: 0.30,
            onUpdate: v => {
                if (thumb) thumb.style.transform = `translateX(${v}%)`;
            }
        });

        const inp = document.getElementById('compareInput');
        inp.placeholder = cat === 'brand'
            ? 'Compare two brands, e.g. Jollibee vs McDo or KKOPI vs BigBrew...'
            : 'Compare two products, e.g. iPhone 16 Pro vs Galaxy S24 Ultra...';

        document.getElementById('guardrailCard').classList.remove('visible');
        renderCompareSuggestions();
    };

    window.executeComparison = function(queryStr, forcedMode) {
        if (forcedMode) setCompareCategory(forcedMode);
        document.getElementById('compareInput').value = queryStr;

        const names = parsePromptEntities(queryStr);
        const card = document.getElementById('guardrailCard');

        if (names.length < 2) {
            const first = names[0] || 'Jollibee';
            const prof = getProfile(first);
            const rival = prof.peer || 'McDo';
            document.getElementById('guardrailHeading').textContent = 'Two Equal Entities Required';
            document.getElementById('guardrailText').textContent = `Enter at least two competing ${state.category}s separated by "vs".`;
            document.getElementById('guardrailButtons').innerHTML = `
                <button type="button" class="fix-chip" onclick="executeComparison('${first} vs ${rival}')">Compare ${first} vs ${rival}</button>
            `;
            card.classList.add('visible');
            switchView('compare');
            return;
        }

        const profiles = names.map(getProfile);
        const types = new Set(profiles.map(p => p.type));

        if (types.size > 1) {
            const brandItem = profiles.find(p => p.type === 'brand');
            const prodItem = profiles.find(p => p.type === 'product');
            const brandPeer = prodItem.parentBrand || brandItem.peer || 'Samsung';
            const skuPeer = brandItem.skuSample || 'iPhone 16 Pro';

            document.getElementById('guardrailHeading').textContent = `Mismatched Entities: "${brandItem.name}" (Brand) vs "${prodItem.name}" (Product SKU)`;
            document.getElementById('guardrailText').textContent = `Comparing a corporate parent brand against a single SKU skews 30-day Share of Voice. Pick an equal comparison:`;
            document.getElementById('guardrailButtons').innerHTML = `
                <button type="button" class="fix-chip" onclick="executeComparison('${brandItem.name} vs ${brandPeer}', 'brand')">Brands: ${brandItem.name} vs ${brandPeer}</button>
                <button type="button" class="fix-chip" onclick="executeComparison('${skuPeer} vs ${prodItem.name}', 'product')">Products: ${skuPeer} vs ${prodItem.name}</button>
            `;
            card.classList.add('visible');
            switchView('compare');
            return;
        }

        card.classList.remove('visible');
        state.activeQuery = profiles.map(p => p.name).join(' vs ');
        state.activeProfiles = profiles;

        if (!state.recentHistory.some(r => r.query.toLowerCase() === state.activeQuery.toLowerCase())) {
            state.recentHistory.unshift({ query: state.activeQuery, cat: profiles[0].type, pinned: false });
            renderSidebarRecents();
        }

        switchView('results');
        renderVisualResults();
    };

    document.getElementById('compareForm').addEventListener('submit', e => {
        e.preventDefault();
        executeComparison(document.getElementById('compareInput').value);
    });

    let sampleIdx = 0;
    window.cycleSamplePrompt = function() {
        const list = MATCHUP_SUGGESTIONS[state.category];
        const pick = list[sampleIdx % list.length];
        sampleIdx++;
        document.getElementById('compareInput').value = pick.q;
        document.getElementById('compareInput').focus();
    };

    window.filterPulseCat = function(cat, btn) {
        state.pulseCat = cat;
        document.querySelectorAll('#pulseCatGroup .f-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderHomePulse();
    };

    window.filterPulsePlat = function(plat, btn) {
        state.pulsePlat = plat;
        document.querySelectorAll('#pulsePlatGroup .f-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderHomePulse();
    };

    window.switchSovMode = function(mode) {
        state.sovMode = mode;
        document.getElementById('btnSovMentions').classList.toggle('active', mode === 'mentions');
        document.getElementById('btnSovEngage').classList.toggle('active', mode === 'engagement');

        const sovThumb = document.getElementById('sovSegmentedThumb');
        sovThumbSpring.animateTo(mode === 'mentions' ? 0 : 100, {
            damping: 1.0,
            response: 0.30,
            onUpdate: v => {
                if (sovThumb) sovThumb.style.transform = `translateX(${v}%)`;
            }
        });

        drawSovVisual();
    };

    window.toggleTheme = function() {
        const root = document.documentElement;
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        toast(`Switched to ${next === 'dark' ? 'Botanical Dark' : 'Botanical Light'} theme`);
    };

    window.bookmarkCurrentComparison = function() {
        toast(`Bookmarked "${state.activeQuery}" to recent comparisons`);
    };

    window.downloadNormalizedCSV = function() {
        const rows = [['Entity', 'Category', 'Mentions_30d', 'Weighted_Engagement', 'Net_Sentiment', 'Comment_Ratio', 'Velocity_24h']];
        state.activeProfiles.forEach(e => rows.push([e.name, e.type, e.mentions, e.weightedEngage, e.sentiment, e.commentRatio, e.velocity]));
        const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Marqueuet_${state.activeQuery.replace(/\s+/g, '_')}.csv`;
        a.click();
        toast('Exported normalized 30d OSINT CSV');
    };

    const tip = document.getElementById('chartTooltip');
    window.showTip = function(e, txt) {
        tip.textContent = txt;
        tip.style.opacity = '1';
        tip.style.left = (e.clientX + 12) + 'px';
        tip.style.top = (e.clientY - 28) + 'px';
    };
    window.hideTip = function() { tip.style.opacity = '0'; };

    let toastTimer = null;
    function toast(msg) {
        const el = document.getElementById('toastBanner');
        document.getElementById('toastMsg').textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
    }

    // Initialize All Views
    renderCompareSuggestions();
    renderSidebarRecents();
    renderHomePulse();
    state.activeProfiles = ['Jollibee', 'McDo'].map(getProfile);
    renderVisualResults();
})();
