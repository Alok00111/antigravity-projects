/* ============================================================
   ANIMATIONS.JS V2 — GSAP Timelines + Lenis Smooth Scroll
   Warm athletic palette compatible
   ============================================================ */
(function () {
    'use strict';

    window.Animations = { init };

    let lenis;

    function init() {
        initLenis();
        gsap.registerPlugin(ScrollTrigger);

        /* Force scroll to top on fresh load to avoid stale state */
        window.scrollTo(0, 0);
        if (lenis) lenis.scrollTo(0, { immediate: true });

        /* Small delay to ensure DOM settle */
        requestAnimationFrame(() => {
            buildHeroTimeline();
            buildMuscleTimeline();
            buildNutritionTimeline();
            ScrollTrigger.refresh();
        });
    }

    /* ============================
       LENIS SMOOTH SCROLL
       ============================ */
    function initLenis() {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2
        });

        /* Sync Lenis ↔ GSAP ScrollTrigger */
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    /* ============================
       HERO TIMELINE
       ============================ */
    function buildHeroTimeline() {
        const heroContent = document.getElementById('hero-content');
        const scrollIndicator = document.getElementById('scroll-indicator');
        if (!heroContent) return;

        /* Ensure hero content starts visible */
        gsap.set(heroContent, { opacity: 1, y: 0 });
        gsap.set('.hero__tag', { opacity: 1, y: 0 });
        gsap.set('.hero__title-line', { opacity: 1, y: 0 });
        gsap.set('.hero__subtitle', { opacity: 1, y: 0 });
        gsap.set('.hero__cta', { opacity: 1, scale: 1 });
        if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 1, y: 0 });

        /* Scroll-driven hide on scroll down */
        gsap.timeline({
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.2,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const p = self.progress;
                    /* Move 3D model to left and scale down */
                    if (window.ThreeScene) {
                        const x = p * -2.2;
                        const y = -0.2 + p * 0.3;
                        const s = 1 - p * 0.35;
                        window.ThreeScene.setModelTransform(x, y, s);
                    }
                }
            }
        })
            .to(heroContent, {
                y: -120,
                opacity: 0,
                duration: 1,
                ease: 'power2.in'
            }, 0)
            .to(scrollIndicator, {
                opacity: 0,
                y: -20,
                duration: 0.3
            }, 0);

        /* Entrance animations (on load) */
        const loadTl = gsap.timeline({ delay: 0.3 });

        loadTl.from('.hero__tag', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        })
            .from('.hero__title-line', {
                y: 60,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out'
            }, '-=0.5')
            .from('.hero__subtitle', {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.5')
            .from('.hero__cta', {
                scale: 0.85,
                opacity: 0,
                duration: 0.8,
                ease: 'back.out(1.7)'
            }, '-=0.4')
            .from(scrollIndicator, {
                opacity: 0,
                y: 20,
                duration: 0.6,
                ease: 'power2.out'
            }, '-=0.3');
    }

    /* ============================
       MUSCULATURE CARDS TIMELINE
       ============================ */
    function buildMuscleTimeline() {
        const cards = gsap.utils.toArray('.muscle-card');
        if (!cards.length) return;

        /* Stagger-in cards from right */
        const muscleTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#musculature',
                start: 'top 75%',
                end: 'top 20%',
                toggleActions: 'play none none reverse'
            }
        });

        /* Section header fade in */
        muscleTl.from('.musculature__header .section-tag', {
            x: -40,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out'
        })
            .from('.musculature__header .section-title', {
                y: 40,
                opacity: 0,
                duration: 0.7,
                ease: 'power3.out'
            }, '-=0.3')
            .from('.musculature__header .section-subtitle', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out'
            }, '-=0.4');

        /* Cards stagger-in */
        muscleTl.to(cards, {
            x: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out'
        }, '-=0.2');
    }

    /* ============================
       NUTRITION SECTION TIMELINE
       ============================ */
    function buildNutritionTimeline() {
        const nutritionTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#nutrition',
                start: 'top 75%',
                end: 'top 30%',
                toggleActions: 'play none none reverse'
            }
        });

        /* Header reveal */
        nutritionTl.from('.nutrition__header .section-tag', {
            x: -40,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out'
        })
            .from('.nutrition__header .section-title', {
                y: 40,
                opacity: 0,
                duration: 0.7,
                ease: 'power3.out'
            }, '-=0.3')
            .from('.nutrition__header .section-subtitle', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out'
            }, '-=0.4');

        /* Chart panel */
        nutritionTl.from('.nutrition__chart-panel', {
            scale: 0.9,
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.2');

        /* Food rows stagger */
        const rows = gsap.utils.toArray('.food-row');
        if (rows.length) {
            nutritionTl.from(rows, {
                x: 60,
                opacity: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power3.out'
            }, '-=0.4');
        }
    }
})();
