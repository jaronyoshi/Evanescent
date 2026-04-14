// ── Mobile menu toggle ──
(function() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuClose = document.getElementById('mobile-menu-close');

    if (hamburgerBtn && mobileMenu && mobileMenuClose) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.add('is-open');
        });

        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('is-open');
        });
    }
})();
