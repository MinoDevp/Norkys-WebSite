// contact.js - Versión moderna con SweetAlert2
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value.trim();

            // Validación de campos
            if (!name || !email || !subject || !message) {
                return Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Por favor, complete todos los campos obligatorios.'
                });
            }

            // Validar formato del correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return Swal.fire({
                    icon: 'error',
                    title: 'Correo inválido',
                    text: 'Por favor, ingrese un correo electrónico válido.'
                });
            }

            // Mostrar animación de "enviando"
            Swal.fire({
                title: 'Enviando mensaje...',
                html: '<div class="swal2-loading-spinner" style="display:flex;justify-content:center;align-items:center;">🌀</div><p>Conectando con el servidor...</p>',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Simular retardo de envío al backend (2 segundos)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: '¡Mensaje enviado!',
                html: `
                    <p>Gracias <strong>${name}</strong> por contactarnos.</p>
                    <p>Te responderemos pronto a <strong>${email}</strong>.</p>
                `,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#28a745'
            });

            contactForm.reset();
        });
    }

    // ✅ Preguntas frecuentes (FAQ)
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
