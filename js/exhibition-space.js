(function() {
    const blinkTop = document.getElementById('blink-top');
    const blinkBottom = document.getElementById('blink-bottom');

    sessionStorage.setItem('evanescent-visited', '1');

    window.addEventListener('load', () => {
        const tl = gsap.timeline();

        const gradientAnim = { stop: 100 };
        tl.to(gradientAnim, {
            stop: 30,
            duration: 0.7,
            ease: 'power4.out',
            onUpdate: () => {
                blinkTop.style.background = 'linear-gradient(to bottom, #000 ' + gradientAnim.stop + '%, transparent 100%)';
                blinkBottom.style.background = 'linear-gradient(to top, #000 ' + gradientAnim.stop + '%, transparent 100%)';
            }
        }, 'eyeOpen');

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
                document.documentElement.classList.remove('is-loading');

                gsap.to(['.nav', '.nav-gradient'], {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power2.out'
                });

                gsap.to('.enter-btn', {
                    opacity: 1,
                    duration: 1.2,
                    ease: 'power2.out'
                });
            }
        }, '<');
    });
})();
