// contacto.js - Estilo moderno similar a locales.js con SweetAlert2 + Leaflet
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📩 Página de contacto cargada');

    // Simulación de carga
    Swal.fire({
        title: 'Cargando sección de contacto...',
        text: 'Conectando con el servidor 🔄',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    await new Promise(resolve => setTimeout(resolve, 1200));
    Swal.fire({
        icon: 'success',
        title: 'Sección lista ✅',
        timer: 1000,
        showConfirmButton: false
    });

    // Inicializar mapa si existe
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        const map = L.map('map').setView([-12.0464, -77.0428], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const locales = [
            { nombre: "Norky's México", lat: -12.0635, lng: -77.035, dir: "Av. México 1530" },
            { nombre: "Norky's Junín", lat: -12.052, lng: -77.042, dir: "Jr. Junín 250" },
            { nombre: "Norky's Gamarra", lat: -12.071, lng: -77.019, dir: "Jr. Sebastián Barranca 1565" }
        ];

        locales.forEach(loc => {
            L.marker([loc.lat, loc.lng])
                .addTo(map)
                .bindPopup(`<b>${loc.nombre}</b><br>${loc.dir}`);
        });

        console.log('🗺️ Mapa cargado con locales:', locales);
    }

    // Manejo del formulario de contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value.trim();

            // Validación
            if (!name || !email || !subject || !message) {
                return Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Por favor, complete todos los campos obligatorios.'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return Swal.fire({
                    icon: 'error',
                    title: 'Correo inválido',
                    text: 'Por favor, ingrese un correo electrónico válido.'
                });
            }

            // Animación de envío
            Swal.fire({
                title: 'Enviando mensaje...',
                html: '<div class="swal2-loading-spinner" style="display:flex;justify-content:center;align-items:center;">🌀</div><p>Conectando con el servidor...</p>',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                const response = await fetch('/api/contacto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: name, email, telefono: phone, asunto: subject, mensaje: message })
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Error al enviar el mensaje');

                Swal.fire({
                    icon: 'success',
                    title: '¡Mensaje enviado!',
                    html: `<p>Gracias <strong>${name}</strong> por contactarnos.</p><p>Te responderemos pronto a <strong>${email}</strong>.</p>`,
                    confirmButtonText: 'Cerrar',
                    confirmButtonColor: '#28a745'
                });

                contactForm.reset();
            } catch (error) {
                console.error('❌ Error al enviar contacto:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'No se pudo enviar el mensaje. Intente nuevamente.'
                });
            }
        });
    }

    // FAQ interactivo
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            const isVisible = answer.style.display === 'block';
            answer.style.display = isVisible ? 'none' : 'block';
            icon.classList.toggle('fa-chevron-up', !isVisible);
            icon.classList.toggle('fa-chevron-down', isVisible);
        });
    });
});
