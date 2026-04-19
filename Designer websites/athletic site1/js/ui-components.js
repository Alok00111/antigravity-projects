/* ============================================================
   UI-COMPONENTS.JS — Magnetic Buttons, 3D Tilt Cards, Macro Dashboard
   ============================================================ */
(function () {
    'use strict';

    window.UIComponents = { init };

    /* State for macro tracking */
    const macroState = {
        protein: 0,
        carbs: 0,
        fat: 0,
        cal: 0,
        activeFoods: new Set()
    };

    const TARGETS = { protein: 150, carbs: 300, fat: 80 };
    const CIRCUMFERENCE = 2 * Math.PI * 85; // ~534

    function init() {
        initMagneticButtons();
        initCardTilt();
        initCardMuscleHover();
        initModelToCardSync();
        initFoodList();
    }

    /* ============================
       MAGNETIC BUTTONS
       ============================ */
    function initMagneticButtons() {
        const btns = document.querySelectorAll('.magnetic-btn');

        btns.forEach(btn => {
            const strength = 0.35;
            let raf;

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) * strength;
                const dy = (e.clientY - cy) * strength;

                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    btn.style.transform = `translate(${dx}px, ${dy}px)`;
                });
            });

            btn.addEventListener('mouseleave', () => {
                cancelAnimationFrame(raf);
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.4)',
                    clearProps: 'transform'
                });
            });
        });
    }

    /* ============================
       3D CARD TILT
       ============================ */
    function initCardTilt() {
        const cards = document.querySelectorAll('.muscle-card');

        cards.forEach(card => {
            const inner = card.querySelector('.muscle-card__inner');
            if (!inner) return;

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const rotateY = ((x - cx) / cx) * 8;  // max ±8 degrees
                const rotateX = ((cy - y) / cy) * 6;

                inner.style.setProperty('--rotateX', `${rotateX}deg`);
                inner.style.setProperty('--rotateY', `${rotateY}deg`);
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(inner, {
                    '--rotateX': '0deg',
                    '--rotateY': '0deg',
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
        });
    }

    /* ============================
       CARD → 3D MODEL HOVER SYNC
       ============================ */
    function initCardMuscleHover() {
        const cards = document.querySelectorAll('.muscle-card');

        cards.forEach(card => {
            const muscleName = card.dataset.muscle;

            card.addEventListener('mouseenter', () => {
                if (window.ThreeScene && muscleName) {
                    window.ThreeScene.clearHighlights();
                    window.ThreeScene.highlightMuscle(muscleName);
                }
            });

            card.addEventListener('mouseleave', () => {
                if (window.ThreeScene) {
                    window.ThreeScene.clearHighlights();
                }
            });

            card.addEventListener('focus', () => {
                if (window.ThreeScene && muscleName) {
                    window.ThreeScene.clearHighlights();
                    window.ThreeScene.highlightMuscle(muscleName);
                }
            });
        });

        /* 3D model hover → highlight card */
        window.addEventListener('muscle-hovered-3d', (e) => {
            const { muscle } = e.detail;
            cards.forEach(c => c.classList.remove('muscle-card--highlighted'));
            if (muscle) {
                const target = document.querySelector(`.muscle-card[data-muscle="${muscle}"]`);
                if (target) {
                    target.classList.add('muscle-card--highlighted');
                    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        });
    }

    /* ============================
       MODEL ROTATION → CARD FOCUS
       ============================ */
    function initModelToCardSync() {
        window.addEventListener('model-rotated', (e) => {
            const { muscles } = e.detail;
            if (!muscles || !muscles.length) return;

            /* Scroll the first relevant muscle card into view */
            const firstMuscle = muscles[0];
            const card = document.querySelector(`.muscle-card[data-muscle="${firstMuscle}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    /* ============================
       FOOD LIST / MACRO DASHBOARD
       ============================ */
    function initFoodList() {
        const foodRows = document.querySelectorAll('.food-row');

        foodRows.forEach(row => {
            const toggle = row.querySelector('.food-row__toggle');
            const main = row.querySelector('.food-row__main');
            if (!toggle || !main) return;

            const handler = () => {
                const id = row.id;
                const isActive = row.classList.contains('food-row--active');

                if (isActive) {
                    row.classList.remove('food-row--active');
                    macroState.activeFoods.delete(id);
                    macroState.protein -= parseInt(row.dataset.protein) || 0;
                    macroState.carbs -= parseInt(row.dataset.carbs) || 0;
                    macroState.fat -= parseInt(row.dataset.fat) || 0;
                    macroState.cal -= parseInt(row.dataset.cal) || 0;
                } else {
                    row.classList.add('food-row--active');
                    macroState.activeFoods.add(id);
                    macroState.protein += parseInt(row.dataset.protein) || 0;
                    macroState.carbs += parseInt(row.dataset.carbs) || 0;
                    macroState.fat += parseInt(row.dataset.fat) || 0;
                    macroState.cal += parseInt(row.dataset.cal) || 0;
                }

                // Clamp to 0
                macroState.protein = Math.max(0, macroState.protein);
                macroState.carbs = Math.max(0, macroState.carbs);
                macroState.fat = Math.max(0, macroState.fat);
                macroState.cal = Math.max(0, macroState.cal);

                updateMacroDashboard();
            };

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                handler();
            });
            main.addEventListener('click', handler);
        });
    }

    /* ============================
       UPDATE MACRO DASHBOARD
       ============================ */
    function updateMacroDashboard() {
        const { protein, carbs, fat, cal } = macroState;
        const totalMacroGrams = protein + carbs + fat || 1;

        /* Count-up animations for text values */
        animateValue('#macro-protein', protein, 'g');
        animateValue('#macro-carbs', carbs, 'g');
        animateValue('#macro-fat', fat, 'g');
        animateValue('#total-cal', cal, '', true);

        /* Target bar fills */
        animateBar('#target-protein-fill', '#target-protein-val', protein, TARGETS.protein);
        animateBar('#target-carbs-fill', '#target-carbs-val', carbs, TARGETS.carbs);
        animateBar('#target-fat-fill', '#target-fat-val', fat, TARGETS.fat);

        /* Donut chart segments — proportional arcs */
        const proteinFrac = protein / totalMacroGrams;
        const carbsFrac = carbs / totalMacroGrams;
        const fatFrac = fat / totalMacroGrams;

        const proteinArc = proteinFrac * CIRCUMFERENCE;
        const carbsArc = carbsFrac * CIRCUMFERENCE;
        const fatArc = fatFrac * CIRCUMFERENCE;

        /* Calculate offsets so segments are sequential around the circle */
        const segProtein = document.getElementById('seg-protein');
        const segCarbs = document.getElementById('seg-carbs');
        const segFat = document.getElementById('seg-fat');

        if (segProtein && segCarbs && segFat) {
            /* Protein starts at 0 */
            gsap.to(segProtein, {
                attr: { 'stroke-dasharray': `${proteinArc} ${CIRCUMFERENCE}` },
                'stroke-dashoffset': 0,
                duration: 0.8,
                ease: 'power3.out'
            });

            /* Carbs starts after protein */
            gsap.to(segCarbs, {
                attr: { 'stroke-dasharray': `${carbsArc} ${CIRCUMFERENCE}` },
                'stroke-dashoffset': -proteinArc,
                duration: 0.8,
                ease: 'power3.out'
            });

            /* Fat starts after protein + carbs */
            gsap.to(segFat, {
                attr: { 'stroke-dasharray': `${fatArc} ${CIRCUMFERENCE}` },
                'stroke-dashoffset': -(proteinArc + carbsArc),
                duration: 0.8,
                ease: 'power3.out'
            });
        }
    }

    function animateValue(selector, targetVal, suffix, isCal) {
        const el = document.querySelector(selector);
        if (!el) return;
        const obj = { val: parseFloat(el.textContent) || 0 };
        gsap.to(obj, {
            val: targetVal,
            duration: 0.7,
            ease: 'power2.out',
            snap: { val: 1 },
            onUpdate: () => {
                el.textContent = isCal ? Math.round(obj.val) : `${Math.round(obj.val)}${suffix}`;
            }
        });
    }

    function animateBar(fillSelector, valSelector, current, max) {
        const fill = document.querySelector(fillSelector);
        const valEl = document.querySelector(valSelector);
        if (!fill) return;
        const pct = Math.min((current / max) * 100, 100);
        gsap.to(fill, {
            width: `${pct}%`,
            duration: 0.7,
            ease: 'power3.out'
        });
        if (valEl) {
            const obj = { v: parseFloat(valEl.textContent) || 0 };
            gsap.to(obj, {
                v: current,
                duration: 0.7,
                ease: 'power2.out',
                snap: { v: 1 },
                onUpdate: () => { valEl.textContent = Math.round(obj.v); }
            });
        }
    }
})();
