/* =============================================================
 * Metagri AI Intern LP — Tracking & Interaction
 * v2.0  2026-05-10
 *  - GA4 強化: user_properties / engagement_time / section_view /
 *              outbound_click / form_focus / click dedupe
 *  - Motion : kinetic hero / pointer-tracking card glow /
 *              flow connector animation / stagger reveal
 * ============================================================= */
(function () {
    'use strict';

    /* ---------- Config ---------- */
    const VARIANTS = {}; // 無償コミュニティ版では A/B 見出し切替を使わない

    const SCROLL_BUCKETS = [25, 50, 75, 90];
    const ENGAGEMENT_BUCKETS = [15, 30, 60, 120, 300]; // seconds
    const CLICK_DEDUPE_MS = 600;
    const PRIMARY_HOST = location.hostname;

    /* ---------- Global state ---------- */
    let currentVariant = 'default';
    let utmParams = {};
    const lastClickAt = new Map();
    let scrollTicking = false;
    let activeMs = 0;
    let activeTimerId = null;
    const sentEngagement = new Set();
    const sentScroll = new Set();
    const sentSection = new Set();

    /* ---------- Boot ---------- */
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const params = new URLSearchParams(location.search);
        const src = params.get('src') || params.get('utm_content');
        currentVariant = src && VARIANTS[src] ? src : 'default';
        utmParams = {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            utm_content: params.get('utm_content') || '',
            utm_term: params.get('utm_term') || ''
        };

        applyVariant();
        configureGtag();

        sendEvent('lp_view', currentVariant, utmParams);

        bindClickTracking();
        bindOutboundTracking();
        bindReveal();
        bindSectionImpressions();
        bindCounters();
        bindScrollDepth();
        bindEngagementTimer();
        bindFormTracking();
        bindHeroKinetics();
        bindPointerGlow();
        bindFlowConnector();
        bindDynamicScroll();
    }

    /* ---------- A/B/C variant ---------- */
    function applyVariant() {
        if (currentVariant === 'default') return;
        const data = VARIANTS[currentVariant];
        const heroTitle = document.querySelector('.hero-title');
        const heroDesc = document.querySelector('.hero-description');
        if (heroTitle) heroTitle.innerHTML = data.title;
        if (heroDesc) heroDesc.textContent = data.description;
        document.body.dataset.variant = currentVariant;
    }

    /* ---------- GA4 setup ---------- */
    function configureGtag() {
        if (typeof window.gtag !== 'function') return;
        // user properties: variant + utm_source for cross-event slicing
        window.gtag('set', 'user_properties', {
            lp_variant: currentVariant,
            lp_utm_source: utmParams.utm_source || '(direct)',
            lp_utm_campaign: utmParams.utm_campaign || '(none)'
        });
        // ensure GA4 page_view carries the same context
        window.gtag('set', {
            page_referrer: document.referrer || '',
            lp_variant: currentVariant
        });
    }

    function sendEvent(name, label, extra) {
        if (typeof window.gtag !== 'function') return;
        const payload = Object.assign(
            {
                event_category: 'instagram_lp',
                event_label: label || '',
                lp_variant: currentVariant,
                page_location: location.href
            },
            extra || {}
        );
        window.gtag('event', name, payload);
    }

    /* ---------- Click tracking (with dedupe) ---------- */
    function bindClickTracking() {
        document.querySelectorAll('.js-track').forEach((el) => {
            el.addEventListener('click', () => {
                const key = (el.dataset.event || 'cta_click') + '|' + (el.dataset.label || '');
                const now = Date.now();
                if (now - (lastClickAt.get(key) || 0) < CLICK_DEDUPE_MS) return;
                lastClickAt.set(key, now);

                const eventName = el.dataset.event || 'cta_click';
                const label = el.dataset.label || (el.textContent || '').trim();
                const target = el.getAttribute('href') || '';
                sendEvent(eventName, label, {
                    cta_position: el.dataset.label || '',
                    link_url: target,
                    is_outbound: isOutbound(target)
                });
            });
        });
    }

    /* ---------- Outbound link tracking ---------- */
    function bindOutboundTracking() {
        document.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href') || '';
            if (!isOutbound(href)) return;
            // Skip ones already tracked via .js-track (avoid double-firing same intent)
            if (a.classList.contains('js-track')) return;
            a.addEventListener('click', () => {
                sendEvent('outbound_click', deriveOutboundLabel(href), {
                    link_url: href,
                    link_domain: hostnameOf(href)
                });
            });
        });
    }

    function isOutbound(href) {
        if (!href) return false;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        try {
            const u = new URL(href, location.href);
            return u.hostname && u.hostname !== PRIMARY_HOST;
        } catch (_) {
            return false;
        }
    }
    function hostnameOf(href) {
        try { return new URL(href, location.href).hostname; } catch (_) { return ''; }
    }
    function deriveOutboundLabel(href) {
        const h = hostnameOf(href);
        if (!h) return 'unknown';
        if (h.includes('instagram.com')) return 'instagram';
        if (h.includes('airtable.com')) return 'airtable';
        if (h.includes('apple.com')) return 'apple_podcasts';
        if (h.includes('metagri-labo.com')) return 'metagri_main';
        return h;
    }

    /* ---------- Reveal on intersection (with stagger via index) ---------- */
    function bindReveal() {
        const targets = document.querySelectorAll(
            '.section, .experience-card, .evidence-card, .principle-grid article, .flow-steps li, .voice-card, .voice-proof-item, .fit-card, .requirements-grid > div, .faq-item, .link-card, .skill-list div, .application-list li, .statement-item'
        );
        targets.forEach((el) => el.classList.add('fade-in'));

        // assign sibling-index for staggered reveal
        document.querySelectorAll(
            '.experience-grid, .evidence-grid, .principle-grid, .flow-steps, .voices-grid, .voice-proof-grid, .fit-grid, .requirements-grid, .faq-grid, .link-grid, .skill-list, .application-list, .statement-list'
        ).forEach((parent) => {
            Array.from(parent.children).forEach((child, i) => {
                child.style.setProperty('--reveal-delay', (i * 60) + 'ms');
            });
        });

        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0, rootMargin: '0px 0px -80px 0px' });
        targets.forEach((el) => obs.observe(el));
    }

    /* ---------- Section impression tracking ----------
     * Fires once per section that has [data-track-section]
     * Also keeps existing [data-track-view] behavior.
     * --------------------------------------------------- */
    function bindSectionImpressions() {
        const viewTargets = document.querySelectorAll('[data-track-view]');
        const viewObs = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id || entry.target.dataset.trackView;
                sendEvent(entry.target.dataset.trackView, id);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.3 });
        viewTargets.forEach((el) => viewObs.observe(el));

        const sectionTargets = document.querySelectorAll('[data-track-section]');
        const secObs = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const name = entry.target.dataset.trackSection;
                if (sentSection.has(name)) return;
                sentSection.add(name);
                sendEvent('section_view', name, { section_id: name });
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.45 });
        sectionTargets.forEach((el) => secObs.observe(el));
    }

    /* ---------- Counter animation ---------- */
    function bindCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const target = entry.target;
                const endValue = Number(target.dataset.count || 0);
                const suffix = (target.textContent || '').replace(/[0-9,]/g, '');
                const formatter = new Intl.NumberFormat('ja-JP');
                const startTime = performance.now();
                const duration = 1100;
                const tick = (now) => {
                    const p = Math.min((now - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    target.textContent = formatter.format(Math.round(endValue * eased)) + suffix;
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                observer.unobserve(target);
            });
        }, { threshold: 0.6 });
        counters.forEach((c) => obs.observe(c));
    }

    /* ---------- Scroll depth ---------- */
    function bindScrollDepth() {
        // reported in dynamic scroll handler; left as a no-op for clarity.
    }
    function reportScrollDepth() {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const current = Math.round((window.scrollY / scrollable) * 100);
        SCROLL_BUCKETS.forEach((depth) => {
            if (current >= depth && !sentScroll.has(depth)) {
                sentScroll.add(depth);
                sendEvent('scroll_depth', depth + '%', { scroll_depth: depth });
            }
        });
    }

    /* ---------- Engagement time ----------
     * Counts only when tab is visible and user has been
     * active (mouse / scroll / keydown) within last 5s.
     * Reports cumulative seconds at 15/30/60/120/300.
     * -------------------------------------------------- */
    function bindEngagementTimer() {
        let lastActive = Date.now();
        const bumpActive = () => { lastActive = Date.now(); };
        ['mousemove', 'keydown', 'scroll', 'touchstart', 'pointerdown'].forEach((ev) => {
            window.addEventListener(ev, bumpActive, { passive: true });
        });

        const tick = () => {
            const visible = document.visibilityState === 'visible';
            const recentActive = Date.now() - lastActive < 5000;
            if (visible && recentActive) {
                activeMs += 1000;
                const sec = Math.floor(activeMs / 1000);
                ENGAGEMENT_BUCKETS.forEach((b) => {
                    if (sec >= b && !sentEngagement.has(b)) {
                        sentEngagement.add(b);
                        sendEvent('engaged_time', b + 's', {
                            engagement_seconds: b,
                            engagement_time_msec: b * 1000
                        });
                    }
                });
            }
        };
        activeTimerId = setInterval(tick, 1000);

        window.addEventListener('beforeunload', () => {
            if (activeTimerId) clearInterval(activeTimerId);
            if (activeMs > 0) {
                sendEvent('lp_exit', currentVariant, {
                    final_engagement_seconds: Math.floor(activeMs / 1000),
                    max_scroll_depth: maxScrollDepth()
                });
            }
        });
    }

    function maxScrollDepth() {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return 0;
        return Math.round((window.scrollY / scrollable) * 100);
    }

    /* ---------- Form impression / focus ---------- */
    function bindFormTracking() {
        const frame = document.querySelector('.form-frame');
        if (!frame) return;
        // Already covered by [data-track-view="form_reached"] in HTML — add focus event when iframe area entered fully
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.intersectionRatio >= 0.8) {
                    sendEvent('form_inview_full', 'apply_form', { intersection: entry.intersectionRatio });
                    obs.disconnect();
                }
            });
        }, { threshold: [0, 0.5, 0.8, 1] });
        obs.observe(frame);

        // Iframe focus = strong intent. Triggered when user clicks into Airtable area.
        let focused = false;
        window.addEventListener('blur', () => {
            if (focused) return;
            const active = document.activeElement;
            if (active && active.tagName === 'IFRAME' && frame.contains(active)) {
                focused = true;
                sendEvent('form_focus', 'apply_form');
            }
        });
    }

    /* ---------- Hero kinetic reveal ---------- */
    function bindHeroKinetics() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        // class triggers CSS-driven reveal
        requestAnimationFrame(() => hero.classList.add('is-ready'));
    }

    /* ---------- Pointer-tracking glow on cards ---------- */
    function bindPointerGlow() {
        const glowable = document.querySelectorAll(
            '.experience-card, .evidence-card, .fit-card, .principle-grid article, .requirements-grid > div, .faq-item, .link-card, .flow-steps li'
        );
        glowable.forEach((el) => {
            el.classList.add('has-glow');
            el.addEventListener('pointermove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                el.style.setProperty('--glow-x', x + '%');
                el.style.setProperty('--glow-y', y + '%');
            });
            el.addEventListener('pointerleave', () => {
                el.style.setProperty('--glow-x', '50%');
                el.style.setProperty('--glow-y', '-30%');
            });
        });
    }

    /* ---------- Flow connector line ---------- */
    function bindFlowConnector() {
        const flow = document.querySelector('.flow-steps');
        if (!flow) return;
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                flow.classList.add('connector-active');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.2 });
        obs.observe(flow);
    }

    /* ---------- Dynamic scroll: progress bar / parallax / scroll-depth ---------- */
    function bindDynamicScroll() {
        const onScroll = () => {
            reportScrollDepth();
            if (scrollTicking) return;
            scrollTicking = true;
            requestAnimationFrame(() => {
                const scrollable = document.documentElement.scrollHeight - window.innerHeight;
                const progress = scrollable > 0
                    ? Math.min((window.scrollY / scrollable) * 100, 100)
                    : 0;
                document.body.style.setProperty('--scroll-progress', progress + '%');
                document.body.style.setProperty('--hero-offset', Math.min(window.scrollY * 0.12, 80) + 'px');
                document.body.style.setProperty(
                    '--hero-blur',
                    Math.min(window.scrollY / 12, 6) + 'px'
                );
                document.body.classList.toggle('has-scrolled', window.scrollY > 80);
                scrollTicking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
})();
