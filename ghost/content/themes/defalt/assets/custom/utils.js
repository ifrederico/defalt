/* Pricing toggle */
(function () {
    const section = document.querySelector('.gd-pricing-section');
    if (!section) return;

    const toggleBtns = section.querySelectorAll('.gd-toggle-btn');

    toggleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const plan = this.dataset.plan;

            toggleBtns.forEach(function (b) {
                b.classList.remove('is-active');
            });
            this.classList.add('is-active');

            section.dataset.plan = plan;
        });
    });
})();
