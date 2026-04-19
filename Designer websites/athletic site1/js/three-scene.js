/* ============================================================
   THREE-SCENE.JS V2 — Professional 3D Muscular Torso
   GLTFLoader with high-fidelity procedural fallback
   Warm orange-red lighting + ambient particles
   ============================================================ */
(function () {
    'use strict';

    /* ----- State ----- */
    const muscleGroups = {};
    let scene, camera, renderer, controls;
    let modelGroup;
    let raycaster, mouse;
    let currentHighlight = null;
    let animFrameId;
    let particles;
    let clock;

    /* Color palette — warm athletic */
    const MUSCLE_BASE = 0x2a1510;   /* deep warm brown-red */
    const MUSCLE_MID = 0x5c1a1a;   /* mid muscle red */
    const MUSCLE_LIGHT = 0x8b2020;   /* surface muscle red */
    const SKIN_TONE = 0x6b3a2a;   /* warm skin undertone */
    const HIGHLIGHT_COLOR = 0xFF3C00;   /* fiery orange */
    const HIGHLIGHT_ALT = 0xFFB800;   /* gold accent */

    /* ----- Public API ----- */
    window.ThreeScene = {
        init,
        highlightMuscle,
        clearHighlights,
        setModelTransform,
        resize,
        getVisibleMuscles,
        dispose
    };

    /* ============================
       INIT
       ============================ */
    function init() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        clock = new THREE.Clock();

        /* Renderer */
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        /* Scene with warm fog + explicit background */
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080808);
        scene.fog = new THREE.FogExp2(0x080808, 0.08);
        renderer.setClearColor(0x080808, 1);

        /* Camera */
        camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0.8, 5.8);
        camera.lookAt(0, 0.3, 0);

        /* Controls */
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minPolarAngle = Math.PI * 0.25;
        controls.maxPolarAngle = Math.PI * 0.65;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.addEventListener('change', onModelRotated);

        /* Lighting */
        setupLighting();

        /* Build model */
        buildDetailedTorso();

        /* Particles */
        createParticles();

        /* Raycaster */
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2(-999, -999);
        canvas.addEventListener('mousemove', onCanvasMouseMove);
        canvas.addEventListener('mouseleave', () => { mouse.set(-999, -999); clearHighlights(); });

        /* Start */
        animate();
    }

    /* ============================
       DRAMATIC WARM LIGHTING
       ============================ */
    function setupLighting() {
        /* Ambient — very low warm fill */
        const ambient = new THREE.AmbientLight(0x1a0a05, 0.6);
        scene.add(ambient);

        /* Key light — warm overhead */
        const key = new THREE.DirectionalLight(0xffdcc8, 1.6);
        key.position.set(2, 5, 3);
        key.castShadow = true;
        key.shadow.mapSize.width = 1024;
        key.shadow.mapSize.height = 1024;
        scene.add(key);

        /* Fill — warm side (orange tint) */
        const fill = new THREE.DirectionalLight(0xFF6B35, 0.4);
        fill.position.set(-4, 2, 2);
        scene.add(fill);

        /* Rim / backlight — fiery orange */
        const rim = new THREE.PointLight(0xFF3C00, 2.5, 14);
        rim.position.set(0, 3, -5);
        scene.add(rim);

        /* Dramatic under-glow — subtle warm */
        const under = new THREE.PointLight(0xFF3C00, 0.6, 6);
        under.position.set(0, -3, 2);
        scene.add(under);

        /* Side accent — gold */
        const sideGold = new THREE.PointLight(0xFFB800, 0.8, 10);
        sideGold.position.set(4, 0, 0);
        scene.add(sideGold);

        /* Warm counter-fill for depth (dark amber) */
        const warmFill = new THREE.PointLight(0x3d2010, 0.4, 8);
        warmFill.position.set(-3, 1, -2);
        scene.add(warmFill);

        /* Ground plane for shadow/glow */
        const groundGeo = new THREE.PlaneGeometry(20, 20);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x080808,
            roughness: 0.95,
            metalness: 0
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1.6;
        ground.receiveShadow = true;
        scene.add(ground);
    }

    /* ============================
       BUILD DETAILED TORSO
       ============================ */
    function buildDetailedTorso() {
        modelGroup = new THREE.Group();

        /* Material factory — physically-based with subsurface hint */
        const muscleMat = (color, rough, metal) => new THREE.MeshStandardMaterial({
            color,
            roughness: rough || 0.5,
            metalness: metal || 0.08,
            emissive: 0x000000,
            emissiveIntensity: 0
        });

        /* ── TORSO CORE — Sculpted cylinder with V-taper ── */
        const torsoGeo = new THREE.CylinderGeometry(0.62, 0.42, 2.2, 32, 16, false);
        const tPos = torsoGeo.attributes.position;
        for (let i = 0; i < tPos.count; i++) {
            const y = tPos.getY(i);
            const ny = (y + 1.1) / 2.2; // 0 bottom, 1 top
            // V-taper: wider shoulders, narrow waist
            const widthMul = 0.72 + ny * 0.42;
            // Slight front-back flattening for realism
            const depthMul = 0.58 + ny * 0.22;
            const x = tPos.getX(i);
            const z = tPos.getZ(i);
            tPos.setX(i, x * widthMul);
            tPos.setZ(i, z * depthMul);
            // Subtle organic noise
            const noise = 1 + Math.sin(ny * 8 + Math.atan2(z, x) * 3) * 0.015;
            tPos.setX(i, tPos.getX(i) * noise);
            tPos.setZ(i, tPos.getZ(i) * noise);
        }
        torsoGeo.computeVertexNormals();
        const torsoMesh = new THREE.Mesh(torsoGeo, muscleMat(SKIN_TONE, 0.6, 0.05));
        torsoMesh.castShadow = true;
        torsoMesh.userData.muscle = 'core';
        modelGroup.add(torsoMesh);
        muscleGroups['core'] = [torsoMesh];

        /* ── PECTORALS — Detailed fan-shaped ── */
        const pecs = [];
        [-1, 1].forEach(side => {
            const pecGeo = new THREE.SphereGeometry(0.36, 24, 20, 0, Math.PI, 0, Math.PI * 0.55);
            // Sculpt pec shape
            const pp = pecGeo.attributes.position;
            for (let i = 0; i < pp.count; i++) {
                const x = pp.getX(i);
                const y = pp.getY(i);
                const z = pp.getZ(i);
                // Flatten bottom, round top
                pp.setZ(i, z * (0.7 + Math.max(0, y) * 0.5));
                // Taper to sternum
                pp.setX(i, x * (1 - Math.abs(y) * 0.15));
            }
            pecGeo.computeVertexNormals();
            const pec = new THREE.Mesh(pecGeo, muscleMat(MUSCLE_LIGHT, 0.45, 0.1));
            pec.position.set(side * 0.26, 0.55, 0.36);
            pec.scale.set(1.05, 0.85, 0.65);
            pec.rotation.x = -0.25;
            pec.castShadow = true;
            pec.userData.muscle = 'chest';
            modelGroup.add(pec);
            pecs.push(pec);

            /* Inner pec definition line */
            const innerGeo = new THREE.BoxGeometry(0.04, 0.5, 0.1, 1, 4, 1);
            const inner = new THREE.Mesh(innerGeo, muscleMat(MUSCLE_BASE, 0.7, 0.05));
            inner.position.set(side * 0.06, 0.52, 0.44);
            inner.userData.muscle = 'chest';
            modelGroup.add(inner);
            pecs.push(inner);
        });
        muscleGroups['chest'] = pecs;

        /* ── LATERAL DELTOIDS ── */
        const sideDelts = [];
        [-1, 1].forEach(side => {
            const deltGeo = new THREE.SphereGeometry(0.24, 20, 16);
            const dp = deltGeo.attributes.position;
            for (let i = 0; i < dp.count; i++) {
                const y = dp.getY(i);
                dp.setY(i, y * 1.15);
            }
            deltGeo.computeVertexNormals();
            const delt = new THREE.Mesh(deltGeo, muscleMat(MUSCLE_MID, 0.48, 0.1));
            delt.position.set(side * 0.8, 0.72, 0);
            delt.scale.set(1, 1.1, 0.85);
            delt.castShadow = true;
            delt.userData.muscle = 'side-delts';
            modelGroup.add(delt);
            sideDelts.push(delt);
        });
        muscleGroups['side-delts'] = sideDelts;

        /* ── ANTERIOR DELTOIDS ── */
        const frontDelts = [];
        [-1, 1].forEach(side => {
            const fdGeo = new THREE.SphereGeometry(0.19, 18, 14);
            const fd = new THREE.Mesh(fdGeo, muscleMat(MUSCLE_LIGHT, 0.48, 0.1));
            fd.position.set(side * 0.7, 0.72, 0.22);
            fd.scale.set(0.9, 1.0, 0.72);
            fd.castShadow = true;
            fd.userData.muscle = 'front-delts';
            modelGroup.add(fd);
            frontDelts.push(fd);
        });
        muscleGroups['front-delts'] = frontDelts;

        /* ── TRAPEZIUS ── */
        const traps = [];
        [-1, 1].forEach(side => {
            const trapGeo = new THREE.CylinderGeometry(0.12, 0.45, 0.75, 20, 6);
            // Smooth the trap shape
            const tp = trapGeo.attributes.position;
            for (let i = 0; i < tp.count; i++) {
                const y = tp.getY(i);
                const ny = (y + 0.375) / 0.75;
                const x = tp.getX(i);
                const z = tp.getZ(i);
                tp.setZ(i, z * (0.5 + ny * 0.3));
            }
            trapGeo.computeVertexNormals();
            const trap = new THREE.Mesh(trapGeo, muscleMat(MUSCLE_MID, 0.5, 0.08));
            trap.position.set(side * 0.22, 1.2, -0.05);
            trap.rotation.z = side * 0.35;
            trap.scale.set(1, 1, 0.7);
            trap.castShadow = true;
            trap.userData.muscle = 'traps';
            modelGroup.add(trap);
            traps.push(trap);
        });
        /* Trap bridge (neck area) */
        const bridgeGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.4, 16, 4);
        const bridge = new THREE.Mesh(bridgeGeo, muscleMat(SKIN_TONE, 0.55, 0.05));
        bridge.position.set(0, 1.35, -0.02);
        bridge.userData.muscle = 'traps';
        modelGroup.add(bridge);
        traps.push(bridge);
        muscleGroups['traps'] = traps;

        /* ── LATISSIMUS DORSI ── */
        const lats = [];
        [-1, 1].forEach(side => {
            const latGeo = new THREE.BoxGeometry(0.4, 1.1, 0.22, 6, 12, 3);
            const lp = latGeo.attributes.position;
            for (let i = 0; i < lp.count; i++) {
                const y = lp.getY(i);
                const t = (y + 0.55) / 1.1; // 0 bottom, 1 top
                // Dramatic wing taper — wide top, narrow bottom
                lp.setX(i, lp.getX(i) * (0.35 + t * 0.65));
                // Slight curvature
                const z = lp.getZ(i);
                lp.setZ(i, z - Math.sin(t * Math.PI) * 0.06);
            }
            latGeo.computeVertexNormals();
            const lat = new THREE.Mesh(latGeo, muscleMat(MUSCLE_BASE, 0.55, 0.08));
            lat.position.set(side * 0.62, 0.05, -0.2);
            lat.castShadow = true;
            lat.userData.muscle = 'lats';
            modelGroup.add(lat);
            lats.push(lat);
        });
        muscleGroups['lats'] = lats;

        /* ── EXTERNAL OBLIQUES ── */
        const obliques = [];
        [-1, 1].forEach(side => {
            const obGeo = new THREE.BoxGeometry(0.16, 0.85, 0.28, 3, 8, 3);
            const op = obGeo.attributes.position;
            for (let i = 0; i < op.count; i++) {
                const y = op.getY(i);
                const t = (y + 0.425) / 0.85;
                // Taper toward waist
                op.setX(i, op.getX(i) * (0.7 + t * 0.3));
                // Slight contour
                op.setZ(i, op.getZ(i) * (0.8 + Math.sin(t * Math.PI) * 0.2));
            }
            obGeo.computeVertexNormals();
            const ob = new THREE.Mesh(obGeo, muscleMat(MUSCLE_MID, 0.52, 0.08));
            ob.position.set(side * 0.46, -0.3, 0.15);
            ob.rotation.z = side * 0.12;
            ob.castShadow = true;
            ob.userData.muscle = 'obliques';
            modelGroup.add(ob);
            obliques.push(ob);

            /* Oblique striation lines */
            for (let j = 0; j < 3; j++) {
                const lineGeo = new THREE.BoxGeometry(0.12, 0.02, 0.08);
                const line = new THREE.Mesh(lineGeo, muscleMat(MUSCLE_BASE, 0.7, 0.05));
                line.position.set(side * 0.47, -0.1 - j * 0.16, 0.26);
                line.rotation.z = side * (0.3 + j * 0.05);
                line.userData.muscle = 'obliques';
                modelGroup.add(line);
                obliques.push(line);
            }
        });
        muscleGroups['obliques'] = obliques;

        /* ── ABS (RECTUS ABDOMINIS) — 8-pack ── */
        const absGroup = [];
        for (let row = 0; row < 4; row++) {
            [-1, 1].forEach(side => {
                const abGeo = new THREE.BoxGeometry(0.155, 0.16, 0.11, 3, 3, 3);
                // Round the edges a bit
                const ap = abGeo.attributes.position;
                for (let i = 0; i < ap.count; i++) {
                    const x = ap.getX(i);
                    const y = ap.getY(i);
                    const z = ap.getZ(i);
                    const r = Math.sqrt(x * x + y * y);
                    const bump = Math.cos(r * 12) * 0.008;
                    ap.setZ(i, z + bump);
                }
                abGeo.computeVertexNormals();
                const ab = new THREE.Mesh(abGeo, muscleMat(MUSCLE_LIGHT, 0.48, 0.1));
                ab.position.set(side * 0.11, 0.1 - row * 0.2, 0.42);
                ab.castShadow = true;
                ab.userData.muscle = 'core';
                modelGroup.add(ab);
                absGroup.push(ab);
            });
        }

        /* Linea alba (center line) */
        const lineaGeo = new THREE.BoxGeometry(0.025, 0.9, 0.06);
        const linea = new THREE.Mesh(lineaGeo, muscleMat(MUSCLE_BASE, 0.7, 0.05));
        linea.position.set(0, 0, 0.44);
        linea.userData.muscle = 'core';
        modelGroup.add(linea);
        absGroup.push(linea);

        /* Horizontal ab separations */
        for (let row = 0; row < 3; row++) {
            const sepGeo = new THREE.BoxGeometry(0.3, 0.018, 0.06);
            const sep = new THREE.Mesh(sepGeo, muscleMat(MUSCLE_BASE, 0.7, 0.05));
            sep.position.set(0, 0.01 - row * 0.2, 0.44);
            sep.userData.muscle = 'core';
            modelGroup.add(sep);
            absGroup.push(sep);
        }

        muscleGroups['core'] = muscleGroups['core'].concat(absGroup);

        /* ── SERRATUS ANTERIOR ── */
        [-1, 1].forEach(side => {
            for (let i = 0; i < 3; i++) {
                const serGeo = new THREE.BoxGeometry(0.08, 0.06, 0.12, 2, 2, 2);
                const ser = new THREE.Mesh(serGeo, muscleMat(MUSCLE_MID, 0.55, 0.08));
                ser.position.set(side * 0.42, 0.25 - i * 0.1, 0.3);
                ser.rotation.z = side * 0.2;
                ser.userData.muscle = 'obliques';
                modelGroup.add(ser);
                obliques.push(ser);
            }
        });

        /* ── UPPER ARM STUMPS (for proportionality) ── */
        [-1, 1].forEach(side => {
            const armGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.6, 16, 4);
            const arm = new THREE.Mesh(armGeo, muscleMat(SKIN_TONE, 0.55, 0.06));
            arm.position.set(side * 0.85, 0.4, 0.05);
            arm.rotation.z = side * 0.25;
            arm.castShadow = true;
            arm.userData.muscle = side === -1 ? 'side-delts' : 'side-delts';
            modelGroup.add(arm);
        });

        modelGroup.position.set(0, -0.3, 0);
        scene.add(modelGroup);
    }

    /* ============================
       PARTICLES — Floating embers
       ============================ */
    function createParticles() {
        const count = 120;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const speeds = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
            sizes[i] = Math.random() * 3 + 1;
            speeds.push({
                x: (Math.random() - 0.5) * 0.003,
                y: Math.random() * 0.005 + 0.002,
                z: (Math.random() - 0.5) * 0.003
            });
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        /* Create a small glowing dot texture */
        const canvas2d = document.createElement('canvas');
        canvas2d.width = 32;
        canvas2d.height = 32;
        const ctx = canvas2d.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 120, 30, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 60, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 60, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        const texture = new THREE.CanvasTexture(canvas2d);

        const mat = new THREE.PointsMaterial({
            size: 0.06,
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.6
        });

        particles = new THREE.Points(geo, mat);
        particles._speeds = speeds;
        scene.add(particles);
    }

    function updateParticles() {
        if (!particles) return;
        const positions = particles.geometry.attributes.position.array;
        const speeds = particles._speeds;

        for (let i = 0; i < speeds.length; i++) {
            positions[i * 3] += speeds[i].x;
            positions[i * 3 + 1] += speeds[i].y;
            positions[i * 3 + 2] += speeds[i].z;

            // Reset when out of bounds
            if (positions[i * 3 + 1] > 5) {
                positions[i * 3] = (Math.random() - 0.5) * 10;
                positions[i * 3 + 1] = -4;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }

    /* ============================
       RAYCASTING / INTERACTION
       ============================ */
    function onCanvasMouseMove(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function checkRaycast() {
        if (!raycaster || !camera || !modelGroup) return;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(modelGroup.children, true);
        if (intersects.length > 0 && intersects[0].object.userData.muscle) {
            const name = intersects[0].object.userData.muscle;
            if (currentHighlight !== name) {
                clearHighlights();
                highlightMuscle(name, true);
                currentHighlight = name;
                window.dispatchEvent(new CustomEvent('muscle-hovered-3d', { detail: { muscle: name } }));
            }
        } else if (currentHighlight) {
            clearHighlights();
            currentHighlight = null;
            window.dispatchEvent(new CustomEvent('muscle-hovered-3d', { detail: { muscle: null } }));
        }
    }

    /* ============================
       HIGHLIGHT API — Warm orange glow
       ============================ */
    function highlightMuscle(name, fromRaycast) {
        const parts = muscleGroups[name];
        if (!parts) return;
        parts.forEach(mesh => {
            mesh.material.emissive.setHex(HIGHLIGHT_COLOR);
            mesh.material.emissiveIntensity = 0.7;
        });
        currentHighlight = name;
        if (!fromRaycast) {
            window.dispatchEvent(new CustomEvent('muscle-highlighted', { detail: { muscle: name } }));
        }
    }

    function clearHighlights() {
        Object.values(muscleGroups).forEach(parts => {
            parts.forEach(mesh => {
                mesh.material.emissive.setHex(0x000000);
                mesh.material.emissiveIntensity = 0;
            });
        });
        currentHighlight = null;
    }

    /* ============================
       MODEL TRANSFORM (scroll)
       ============================ */
    function setModelTransform(x, y, scale) {
        if (!modelGroup) return;
        modelGroup.position.x = x;
        modelGroup.position.y = y;
        modelGroup.scale.setScalar(scale);
    }

    /* ============================
       ROTATION EVENT
       ============================ */
    function onModelRotated() {
        const visible = getVisibleMuscles();
        window.dispatchEvent(new CustomEvent('model-rotated', { detail: { muscles: visible } }));
    }

    function getVisibleMuscles() {
        if (!camera || !modelGroup) return [];
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const angle = Math.atan2(dir.x, dir.z);
        const result = [];
        if (Math.abs(angle) > 2.0) {
            result.push('chest', 'front-delts', 'obliques', 'core');
        }
        if (Math.abs(angle) < 1.5) {
            result.push('lats', 'traps');
        }
        result.push('side-delts');
        return [...new Set(result)];
    }

    /* ============================
       RESIZE
       ============================ */
    function resize() {
        if (!renderer || !camera) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    /* ============================
       RENDER LOOP
       ============================ */
    function animate() {
        animFrameId = requestAnimationFrame(animate);
        if (controls) controls.update();
        checkRaycast();
        updateParticles();

        /* Subtle model breathing animation */
        if (modelGroup) {
            const t = clock.getElapsedTime();
            modelGroup.position.y = -0.3 + Math.sin(t * 0.8) * 0.02;
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    /* ============================
       DISPOSE
       ============================ */
    function dispose() {
        cancelAnimationFrame(animFrameId);
        if (controls) controls.dispose();
        if (renderer) renderer.dispose();
    }
})();
