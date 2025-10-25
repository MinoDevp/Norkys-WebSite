document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.querySelector('.btn-register');

    // --- Barra y mensaje dinámicos ---
    const passwordStrength = document.createElement('div');
    const confirmMsg = document.createElement('div');

    passwordStrength.style.height = '5px';
    passwordStrength.style.marginTop = '5px';
    passwordStrength.style.borderRadius = '4px';
    confirmMsg.style.fontSize = '0.9em';
    confirmMsg.style.marginTop = '4px';
    confirmMsg.style.fontWeight = 'bold';

    passwordInput.parentNode.appendChild(passwordStrength);
    confirmPasswordInput.parentNode.appendChild(confirmMsg);

    // --- Inputs ---
    const inputs = {
        nombre: form.querySelector('input[name="nombre"]'),
        email: form.querySelector('input[name="email"]'),
        telefono: form.querySelector('input[name="telefono"]'),
        direccion: form.querySelector('input[name="direccion"]'),
        password: passwordInput,
        confirmPassword: confirmPasswordInput
    };

    // --- Regex ---
    const nombreRegex = /^[A-Za-z0-9]{5,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefonoRegex = /^\d{9}$/;

    // --- Solo números en teléfono ---
    inputs.telefono.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // --- Barra de fuerza de contraseña ---
    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        const len = val.length;

        if (len === 0) {
            passwordStrength.style.width = '0';
            passwordStrength.style.backgroundColor = 'transparent';
        } else if (len < 6) {
            passwordStrength.style.width = '40%';
            passwordStrength.style.backgroundColor = 'red';
        } else if (len < 7) {
            passwordStrength.style.width = '70%';
            passwordStrength.style.backgroundColor = 'orange';
        } else {
            passwordStrength.style.width = '100%';
            passwordStrength.style.backgroundColor = 'green';
        }
    });

    // --- Confirmación de contraseñas ---
    confirmPasswordInput.addEventListener('input', () => {
        if (!confirmPasswordInput.value) {
            confirmMsg.textContent = '';
            return;
        }
        if (confirmPasswordInput.value === passwordInput.value) {
            confirmMsg.textContent = '✔ Las contraseñas coinciden';
            confirmMsg.style.color = 'green';
        } else {
            confirmMsg.textContent = '✖ Las contraseñas no coinciden';
            confirmMsg.style.color = 'red';
        }
    });

    // --- Envío del formulario ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = inputs.nombre.value.trim();
        const email = inputs.email.value.trim();
        const telefono = inputs.telefono.value.trim();
        const direccion = inputs.direccion.value.trim();
        const password = inputs.password.value;
        const confirmPassword = inputs.confirmPassword.value;

        // 🧩 Validaciones front-end (antes de enviar)
        if (!nombreRegex.test(nombre)) {
            return Swal.fire({
                icon: 'warning',
                title: 'Nombre inválido',
                text: 'El nombre debe tener al menos 5 caracteres y solo letras o números.'
            });
        }

        if (!emailRegex.test(email)) {
            return Swal.fire({
                icon: 'warning',
                title: 'Correo inválido',
                text: 'Por favor, ingresa un correo electrónico válido.'
            });
        }

        if (!telefonoRegex.test(telefono)) {
            return Swal.fire({
                icon: 'warning',
                title: 'Teléfono inválido',
                text: 'El número de teléfono debe tener exactamente 9 dígitos.'
            });
        }

        if (password.length < 6) {
            return Swal.fire({
                icon: 'warning',
                title: 'Contraseña débil',
                text: 'La contraseña debe tener al menos 6 caracteres.'
            });
        }

        if (password !== confirmPassword) {
            return Swal.fire({
                icon: 'warning',
                title: 'Contraseñas no coinciden',
                text: 'Por favor, asegúrate de que ambas contraseñas sean iguales.'
            });
        }

        // --- Envío al backend ---
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, telefono, direccion, password })
            });

            const data = await res.json();

            if (!res.ok) {
                // Errores desde el backend (por ejemplo, teléfono ya registrado)
                return Swal.fire({
                    icon: 'error',
                    title: 'Error de registro',
                    text: data.error || 'Verifica tus datos e inténtalo nuevamente.'
                });
            }

            // Éxito total 🎉
            Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                text: 'Tu cuenta ha sido creada correctamente.',
                confirmButtonText: 'Iniciar sesión'
            }).then(() => {
                window.location.href = 'login.html';
            });

        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error del servidor',
                text: 'No se pudo conectar con el servidor. Intenta nuevamente.'
            });
            console.error('❌ Error en el registro:', err);
        }
    });
});
