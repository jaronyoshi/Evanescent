// ── Loading Screen ──
(function() {
    const loader = document.getElementById('loader');
    const percentEl = document.getElementById('loader-percent');
    const video = loader.querySelector('.loader__video');
    const blinkTop = document.getElementById('blink-top');
    const blinkBottom = document.getElementById('blink-bottom');

    const skipLoader = sessionStorage.getItem('evanescent-visited');
    sessionStorage.setItem('evanescent-visited', '1');

    if (skipLoader) {
        // Skip loader, just do eye-opening transition
        loader.style.display = 'none';
        document.documentElement.classList.add('is-loading');
        window.addEventListener('load', () => startTransition());
    } else {
        // Full loader
        document.documentElement.classList.add('is-loading');
        video.play();

        const totalDuration = 6200;
        let currentPercent = 0;
        let pauseUntil = 0;
        let hasPausedMid = false;
        let hasPausedLate = false;

        const startTime = Date.now();

        function updateLoader() {
            const now = Date.now();

            if (now < pauseUntil) {
                requestAnimationFrame(updateLoader);
                return;
            }

            const elapsed = now - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);
            const target = Math.floor(progress * 100);

            if (!hasPausedMid && currentPercent >= 40 + Math.floor(Math.random() * 11) && currentPercent <= 50) {
                hasPausedMid = true;
                pauseUntil = now + 500;
                requestAnimationFrame(updateLoader);
                return;
            }
            if (!hasPausedLate && currentPercent >= 70 + Math.floor(Math.random() * 26) && currentPercent <= 95) {
                hasPausedLate = true;
                pauseUntil = now + 500;
                requestAnimationFrame(updateLoader);
                return;
            }

            if (Math.random() > 0.25 || target - currentPercent > 4) {
                currentPercent = Math.min(currentPercent + Math.floor(Math.random() * 3) + 1, target);
            }

            percentEl.textContent = currentPercent + '%';

            if (progress < 1) {
                requestAnimationFrame(updateLoader);
            } else {
                currentPercent = 100;
                percentEl.textContent = '100%';
                setTimeout(startTransition, 400);
            }
        }

        requestAnimationFrame(updateLoader);
    }

    function startTransition() {
        const tl = gsap.timeline();

        if (!skipLoader) {
            tl.to([percentEl, video], {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in'
            });

            tl.call(() => {
                loader.style.display = 'none';
                document.documentElement.classList.remove('is-loading');
            }, null, '-=0.1');
        } else {
            tl.call(() => {
                document.documentElement.classList.remove('is-loading');
            });
        }
        const gradientAnim = { stop: 100 }; // 100 = fully solid
        tl.to(gradientAnim, {
            stop: 30,  // 30% solid, rest fades to transparent
            duration: 0.7,
            ease: 'power4.out',
            onUpdate: () => {
                blinkTop.style.background = 'linear-gradient(to bottom, #000 ' + gradientAnim.stop + '%, transparent 100%)';
                blinkBottom.style.background = 'linear-gradient(to top, #000 ' + gradientAnim.stop + '%, transparent 100%)';
            }
        }, 'eyeOpen');

        // Eyes open — starts slow then accelerates
        tl.to(blinkTop, {
            translateY: '-100%',
            duration: 0.9,
            ease: 'power2.inOut'
        }, 'eyeOpen');
        tl.to(blinkBottom, {
            translateY: '100%',
            duration: 0.9,
            ease: 'power2.inOut',
            onComplete: () => {
                blinkTop.remove();
                blinkBottom.remove();
                // Nav slides in from top
                gsap.to(['.nav', '.nav-gradient', '.nav-gradient-bottom'], {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power2.out'
                });
                gsap.to('.hero__intro', {
                    opacity: 1,
                    duration: 1.5,
                    ease: 'power2.out',
                    delay: 0.3
                });
            }
        }, '<');
    }
})();

// ── Scroll Animations ──
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

// Responsive scroll trigger config
const isMobile = window.matchMedia("(max-width: 480px)").matches;
const isTablet = window.matchMedia("(max-width: 768px)").matches;

const scrollConfig = isMobile ? {
    introEnd: "12% top",
    overlayStart: "3% top",
    overlayEnd: "30% top",
    textStart: "25% top",
    textEnd: "92% top",
    cardStart: 3, cardStep: 5, cardEndOffset: 5,
    headingStart: "25% top", headingEnd: "35% top",
    subStart: "35% top", subEnd: "42% top",
    bodyStart: "42% top", bodyEnd: "50% top",
    navEnd: "20% top"
} : isTablet ? {
    introEnd: "10% top",
    overlayStart: "2% top",
    overlayEnd: "35% top",
    textStart: "30% top",
    textEnd: "93% top",
    cardStart: 4, cardStep: 6, cardEndOffset: 6,
    headingStart: "30% top", headingEnd: "42% top",
    subStart: "42% top", subEnd: "50% top",
    bodyStart: "50% top", bodyEnd: "58% top",
    navEnd: "18% top"
} : {
    introEnd: "8% top",
    overlayStart: "2% top",
    overlayEnd: "40% top",
    textStart: "35% top",
    textEnd: "95% top",
    cardStart: 5, cardStep: 8, cardEndOffset: 7,
    headingStart: "40% top", headingEnd: "52% top",
    subStart: "52% top", subEnd: "58% top",
    bodyStart: "58% top", bodyEnd: "66% top",
    navEnd: "15% top"
};

// Zoom into the iris (centre of image) as user scrolls
gsap.to(".hero__image", {
    scale: 5,
    ease: "none",
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
        pin: false
    }
});

// Intro text fades out during early zoom
gsap.to(".hero__intro", {
    opacity: 0,
    ease: "none",
    immediateRender: false,
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: scrollConfig.introEnd,
        scrub: 1
    }
});

// Fade out the eye image to reveal body background
gsap.to(".hero__image", {
    opacity: 0,
    ease: "power2.in",
    scrollTrigger: {
        trigger: ".hero",
        start: scrollConfig.overlayStart,
        end: scrollConfig.overlayEnd,
        scrub: 1
    }
});

// Single timeline for all text
const lines = document.querySelectorAll(".hero__body");
const textTl = gsap.timeline({
    scrollTrigger: {
        trigger: ".hero",
        start: scrollConfig.textStart,
        end: scrollConfig.textEnd,
        scrub: 1
    }
});

// 1. Reveal heading
textTl.fromTo(".hero__heading",
    { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
    { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 10, ease: "none" }
);

// 2. Reveal each body line + shuffle background images
const shuffleImgs = document.querySelectorAll(".hero__shuffle-img");
const shuffleContainer = document.querySelector(".hero__shuffle");

// Fade in the shuffle container when body text starts
textTl.to(shuffleContainer, { opacity: 0.5, duration: 2, ease: "none" }, "bodyStart");

lines.forEach((line, i) => {
    textTl.fromTo(line,
        { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
        { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 4, ease: "none" },
        "bodyStart+=" + (i * 4)
    );
});

// Crossfade between images during body reveal (total body duration = 24)
const imgDuration = 24 / shuffleImgs.length;
shuffleImgs.forEach((img, i) => {
    if (i === 0) {
        // First image is already visible, fade it out when next one starts
        textTl.to(img, { opacity: 0, duration: imgDuration * 0.3, ease: "none" }, "bodyStart+=" + imgDuration);
    } else {
        // Fade in
        textTl.to(img, { opacity: 1, duration: imgDuration * 0.3, ease: "none" }, "bodyStart+=" + (i * imgDuration));
        // Fade out (unless last image)
        if (i < shuffleImgs.length - 1) {
            textTl.to(img, { opacity: 0, duration: imgDuration * 0.3, ease: "none" }, "bodyStart+=" + ((i + 1) * imgDuration));
        }
    }
});

// Fade out shuffle container at reading pause
textTl.to(shuffleContainer, { opacity: 0, duration: 3, ease: "none" });

// 3. Reading pause
textTl.to({}, { duration: 4 });

// 4. Unreveal body lines in reverse order (quicker)
Array.from(lines).reverse().forEach((line) => {
    textTl.to(line,
        { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)", duration: 3, ease: "none" }
    );
});

// 5. Unreveal heading last
textTl.to(".hero__heading",
    { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)", duration: 6, ease: "none" }
);

// ── Installations section ──

// Cards appear one by one
const cards = document.querySelectorAll(".glass-card");
cards.forEach((card, i) => {
    gsap.to(card, {
        opacity: 1,
        y: 0,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".installations",
            start: (scrollConfig.cardStart + i * scrollConfig.cardStep) + "% top",
            end: (scrollConfig.cardStart + i * scrollConfig.cardStep + scrollConfig.cardEndOffset) + "% top",
            scrub: 1
        }
    });
});

// Floating animation for each card (desktop only)
const floatAnims = [];
if (!isTablet) {
    cards.forEach((card, i) => {
        const anim = gsap.to(card, {
            y: "-=12",
            x: (i % 2 === 0) ? "+=6" : "-=6",
            duration: 3 + i * 0.5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
        });
        floatAnims.push(anim);
    });
} else {
    cards.forEach(() => floatAnims.push(null));
}

// Card click → move to center + 3D flip, click away to dismiss
let activeCard = null;
let activeCardIndex = -1;
const cardScale = isMobile ? 1.8 : isTablet ? 1.8 : 2.5;

function dismissActiveCard() {
    if (!activeCard) return;
    const card = activeCard;
    const idx = activeCardIndex;
    const inner = card.querySelector('.glass-card__inner');

    activeCard = null;
    activeCardIndex = -1;

    // Remove escape cursor
    document.body.style.cursor = '';
    document.body.classList.remove('card-open');

    // Animate back to original position
    gsap.to(card, {
        x: card._returnX,
        y: card._returnY,
        scale: 1,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
            card.classList.remove('is-active');
            if (floatAnims[idx]) floatAnims[idx].resume();
        }
    });

    gsap.to(inner, {
        rotationY: 0,
        duration: 0.6,
        ease: 'power2.inOut'
    });
}

cards.forEach((card, i) => {
    const inner = card.querySelector('.glass-card__inner');

    card.addEventListener('click', (e) => {
        // If a card is already active, treat click on any card as dismiss
        if (activeCard) {
            dismissActiveCard();
            return;
        }

        e.stopPropagation();

        activeCard = card;
        activeCardIndex = i;

        // Pause floating (desktop only)
        if (floatAnims[i]) floatAnims[i].pause();

        // Store current position for return
        const rect = card.getBoundingClientRect();
        card._returnX = gsap.getProperty(card, 'x');
        card._returnY = gsap.getProperty(card, 'y');

        // Calculate center of viewport
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const viewCenterX = window.innerWidth / 2;
        const viewCenterY = window.innerHeight / 2;
        const dx = viewCenterX - cardCenterX;
        const dy = viewCenterY - cardCenterY;

        card.classList.add('is-active');

        // Set escape cursor on body
        document.body.style.cursor = "url('assets/cursors/escape-cursor.svg') 32 10, pointer";
        document.body.classList.add('card-open');

        // Move to center + scale up
        gsap.to(card, {
            x: '+=' + dx,
            y: '+=' + dy,
            scale: cardScale,
            duration: 0.6,
            ease: 'power2.out'
        });

        // 3D flip
        gsap.to(inner, {
            rotationY: 720,
            duration: 1.2,
            ease: 'power2.inOut'
        });
    });
});

// Click anywhere else to dismiss
document.addEventListener('click', () => {
    dismissActiveCard();
});

// Left text reveal — heading wipe
gsap.to(".installations__heading", {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    ease: "none",
    scrollTrigger: {
        trigger: ".installations",
        start: scrollConfig.headingStart,
        end: scrollConfig.headingEnd,
        scrub: 1
    }
});

// Left text — subheading fade
gsap.to(".installations__subheading", {
    opacity: 1,
    ease: "none",
    scrollTrigger: {
        trigger: ".installations",
        start: scrollConfig.subStart,
        end: scrollConfig.subEnd,
        scrub: 1
    }
});

// Left text — body fade
gsap.to(".installations__body", {
    opacity: 1,
    ease: "none",
    scrollTrigger: {
        trigger: ".installations",
        start: scrollConfig.bodyStart,
        end: scrollConfig.bodyEnd,
        scrub: 1
    }
});

// ── Experience section ──

// Card barges in from bottom
gsap.to(".experience__card", {
    y: 0,
    ease: "power3.out",
    scrollTrigger: {
        trigger: ".experience",
        start: "top bottom",
        end: "25% top",
        scrub: 1
    }
});

// Content appears when section enters viewport
gsap.to(".experience__content", {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power2.out",
    scrollTrigger: {
        trigger: ".experience",
        start: "10% top",
        toggleActions: "play none none none"
    }
});


// Fade out the nav + gradient on scroll (delayed until nav intro finishes)
gsap.to([".nav", ".nav-gradient", ".nav-gradient-bottom"], {
    opacity: 0,
    ease: "none",
    immediateRender: false,
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: scrollConfig.navEnd,
        scrub: 1
    }
});

// ── Liquid glass filter generator (adapted from archisvaze/liquid-glass) ──
(function() {
    const SURFACE_FN = (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25);

    // Figma params: Refraction 80, Depth 92, Frost 8, Dispersion 45, Splay 100
    const GLASS_THICKNESS = 80;
    const BEZEL_WIDTH = 60;
    const IOR = 3.0;
    const SCALE_RATIO = 1.0;
    const BLUR_AMT = 0.3;
    const SPEC_OPACITY = 0.5;
    const SPEC_SAT = 4;
    const RADIUS = 20;

    function calcRefractionProfile(thick, bezel, heightFn, ior, samples) {
        samples = samples || 128;
        const eta = 1 / ior;
        function refract(nx, ny) {
            const dot = ny;
            const k = 1 - eta * eta * (1 - dot * dot);
            if (k < 0) return null;
            const sq = Math.sqrt(k);
            return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
        }
        const profile = new Float64Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = i / samples;
            const y = heightFn(x);
            const dx = x < 1 ? 0.0001 : -0.0001;
            const y2 = heightFn(x + dx);
            const deriv = (y2 - y) / dx;
            const mag = Math.sqrt(deriv * deriv + 1);
            const ref = refract(-deriv / mag, -1 / mag);
            if (!ref) { profile[i] = 0; continue; }
            profile[i] = ref[0] * ((y * bezel + thick) / ref[1]);
        }
        return profile;
    }

    function genDisplacementMap(w, h, r, bezel, profile, maxDisp) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) { d[i] = 128; d[i+1] = 128; d[i+2] = 0; d[i+3] = 255; }
        const rSq = r*r, r1Sq = (r+1)**2, rBSq = Math.max(r - bezel, 0)**2;
        const wB = w - r*2, hB = h - r*2, S = profile.length;
        for (let y1 = 0; y1 < h; y1++) {
            for (let x1 = 0; x1 < w; x1++) {
                const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
                const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
                const dSq = x*x + y*y;
                if (dSq > r1Sq || dSq < rBSq) continue;
                const dist = Math.sqrt(dSq);
                const fromSide = r - dist;
                const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
                if (op <= 0 || dist === 0) continue;
                const cos = x / dist, sin = y / dist;
                const bi = Math.min(((fromSide / bezel) * S) | 0, S - 1);
                const disp = profile[bi] || 0;
                const dX = (-cos * disp) / maxDisp, dY = (-sin * disp) / maxDisp;
                const idx = (y1 * w + x1) * 4;
                d[idx] = (128 + dX * 127 * op + 0.5) | 0;
                d[idx+1] = (128 + dY * 127 * op + 0.5) | 0;
            }
        }
        ctx.putImageData(img, 0, 0);
        return c.toDataURL();
    }

    function genSpecularMap(w, h, r, bezel, angle) {
        angle = angle != null ? angle : Math.PI / 3;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(w, h);
        const d = img.data; d.fill(0);
        const rSq = r*r, r1Sq = (r+1)**2, rBSq = Math.max(r - bezel, 0)**2;
        const wB = w - r*2, hB = h - r*2;
        const sv = [Math.cos(angle), Math.sin(angle)];
        for (let y1 = 0; y1 < h; y1++) {
            for (let x1 = 0; x1 < w; x1++) {
                const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
                const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
                const dSq = x*x + y*y;
                if (dSq > r1Sq || dSq < rBSq) continue;
                const dist = Math.sqrt(dSq);
                const fromSide = r - dist;
                const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
                if (op <= 0 || dist === 0) continue;
                const cos = x / dist, sin = -y / dist;
                const dot = Math.abs(cos * sv[0] + sin * sv[1]);
                const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide)**2));
                const coeff = dot * edge;
                const col = (255 * coeff) | 0;
                const alpha = (col * coeff * op) | 0;
                const idx = (y1 * w + x1) * 4;
                d[idx] = col; d[idx+1] = col; d[idx+2] = col; d[idx+3] = alpha;
            }
        }
        ctx.putImageData(img, 0, 0);
        return c.toDataURL();
    }

    function buildFilter() {
        const w = 240, h = 320;
        const clampedBezel = Math.min(BEZEL_WIDTH, RADIUS - 1, Math.min(w, h) / 2 - 1);
        const profile = calcRefractionProfile(GLASS_THICKNESS, clampedBezel, SURFACE_FN, IOR, 128);
        const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1;
        const dispUrl = genDisplacementMap(w, h, RADIUS, clampedBezel, profile, maxDisp);
        const specUrl = genSpecularMap(w, h, RADIUS, clampedBezel * 2.5);
        const scale = maxDisp * SCALE_RATIO;

        document.getElementById('svg-defs').innerHTML = `
            <filter id="liquid-glass-filter" x="0%" y="0%" width="100%" height="100%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="${BLUR_AMT}" result="blurred_source" />
                <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="disp_map" />
                <feDisplacementMap in="blurred_source" in2="disp_map"
                    scale="${scale}" xChannelSelector="R" yChannelSelector="G"
                    result="displaced" />
                <feColorMatrix in="displaced" type="saturate" values="${SPEC_SAT}" result="displaced_sat" />
                <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="spec_layer" />
                <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
                <feComponentTransfer in="spec_layer" result="spec_faded">
                    <feFuncA type="linear" slope="${SPEC_OPACITY}" />
                </feComponentTransfer>
                <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
                <feBlend in="spec_faded" in2="with_sat" mode="normal" />
            </filter>
        `;
    }

    requestAnimationFrame(() => requestAnimationFrame(buildFilter));
})();
