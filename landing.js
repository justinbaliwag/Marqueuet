/* Marqueuet landing: sticky header, scroll reveals (IntersectionObserver), typewriter */
(() => {
    'use strict';
    const landing = document.getElementById('heroLanding');
    if (!landing) return;
    window.__pvReady = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canAnimate = !reduced && 'IntersectionObserver' in window;
    const $ = sel => landing.querySelector(sel);

    /* App shell is not reachable by keyboard / AT while the landing covers it */
    const shell = document.getElementById('appShell');
    if (shell && !landing.classList.contains('is-hidden')) shell.inert = true;

/* ---------- Header: frosted glass & show top CTA only when no main CTA is visible ---------- */
    const header = document.getElementById('pvHeader');
    const heroSection = document.getElementById('pvTop');
    const finalSection = landing.querySelector('.pv-final');

    const onScroll = () => {
        const scrollY = landing.scrollTop;
        const viewH = landing.clientHeight;
        header.classList.toggle('is-scrolled', scrollY > 8);

        // Past the top hero CTA
        const pastHero = scrollY > (heroSection ? heroSection.offsetHeight * 0.65 : 500);

        // Check if the bottom "Run your first prompt" section is now in view
        const finalTop = finalSection ? finalSection.getBoundingClientRect().top : Infinity;
        const nearFinal = finalTop < viewH * 0.72;

        // Only show the sticky top-right button while browsing the middle sections
        header.classList.toggle('past-hero', pastHero && !nearFinal);
    };

    landing.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    /* ---------- Smooth-scroll links (brand -> top, cue -> overview) ---------- */
    landing.querySelectorAll('[data-scroll-to]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            const behavior = reduced ? 'auto' : 'smooth';
            const target = el.dataset.scrollTo;
            if (target === 'top') landing.scrollTo({ top: 0, behavior });
            else {
                const t = landing.querySelector(target);
                if (t) t.scrollIntoView({ behavior, block: 'start' });
            }
        });
    });

    /* ---------- Open a matchup straight in the app ---------- */
    window.openMatchup = (q, mode, ev) => {
        if (window.enterWorkspace) window.enterWorkspace(null, ev);
        if (window.executeComparison) window.executeComparison(q, mode);
    };

    /* ---------- Typewriter for the sample prompt ---------- */
    const typed = $('[data-pv-typed]');
    const fullText = typed ? typed.textContent.trim() : '';
    if (typed && canAnimate) typed.textContent = '';

    const startTyping = () => {
        if (!typed || !canAnimate) return;
        let i = 0;
        typed.classList.add('is-typing');
        setTimeout(function tick() {
            typed.textContent = fullText.slice(0, ++i);
            if (i < fullText.length) setTimeout(tick, 55);
            else setTimeout(() => typed.classList.remove('is-typing'), 900);
        }, 500);
    };

    /* ---------- Scroll reveals: once, staggered per batch, then unobserve ---------- */
    const items = landing.querySelectorAll('[data-reveal]');
    if (!canAnimate) {
        items.forEach(el => el.classList.add('is-in'));
    } else {
        const STAGGER = 120;
        const io = new IntersectionObserver(entries => {
            let n = 0;
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (n) {
                    el.style.transitionDelay = `${n * STAGGER}ms`;
                    const clear = ev => {
                        if (ev.target === el && ev.propertyName === 'transform') {
                            el.style.transitionDelay = '';
                            el.removeEventListener('transitionend', clear);
                        }
                    };
                    el.addEventListener('transitionend', clear);
                }
                n++;
                el.classList.add('is-in');
                io.unobserve(el);
                if (el.hasAttribute('data-pv-prompt') || el.querySelector('[data-pv-prompt]')) startTyping();
            });
        }, { root: landing, rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
        items.forEach(el => io.observe(el));
    }
})();