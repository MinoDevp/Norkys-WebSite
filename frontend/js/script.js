// Navegación suavizada
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        if (this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Opcional: animaciones generales (sin afectar el menú)
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.specialty-item, .location-card, .promotion-item');
    elements.forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    function handleScroll() {
        elements.forEach(el => {
            if (el.classList.contains('visible')) return;
            if (el.offsetParent === null) return; // oculto
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                el.style.opacity = 1;
                el.style.transform = 'translateY(0)';
                el.classList.add('visible');
            }
        });
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();
});
