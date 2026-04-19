/* ============================================================
   MAIN.JS — Application Entry Point
   ============================================================ */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        /* 1. Initialize Three.js 3D scene */
        if (window.ThreeScene) {
            window.ThreeScene.init();
        }

        /* 2. Initialize GSAP + Lenis animations */
        if (window.Animations) {
            window.Animations.init();
        }

        /* 3. Initialize interactive UI components */
        if (window.UIComponents) {
            window.UIComponents.init();
        }

        /* 4. Handle window resize */
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.ThreeScene) {
                    window.ThreeScene.resize();
                }
            }, 100);
        });

        /* 5. Active nav link tracking */
        initNavTracking();

        /* 6. Trigger resize once to set correct canvas size */
        if (window.ThreeScene) {
            window.ThreeScene.resize();
        }
    });

    /* ============================
       NAV LINK TRACKING
       ============================ */
    function initNavTracking() {
        const links = document.querySelectorAll('.nav__link');
        const sections = ['hero', 'musculature', 'nutrition'];

        if (typeof ScrollTrigger === 'undefined') return;

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (!section) return;

            ScrollTrigger.create({
                trigger: section,
                start: 'top center',
                end: 'bottom center',
                onEnter: () => setActiveNav(id),
                onEnterBack: () => setActiveNav(id)
            });
        });

        function setActiveNav(sectionId) {
            links.forEach(link => {
                link.classList.toggle('nav__link--active', link.dataset.section === sectionId);
            });
        }

        /* Smooth scroll on nav click */
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(link.dataset.section);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
})();
