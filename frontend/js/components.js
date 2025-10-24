/// js/components.js

// ===== Cargar componentes dinámicamente =====
async function loadComponent(id, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error cargando ${url}`);
        const html = await response.text();
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = html;

            if (id === 'header') initHeaderFunctions();
        }
    } catch (err) {
        console.error(`❌ No se pudo cargar ${id}:`, err);
        const container = document.getElementById(id);
        if (container) container.innerHTML = `<p>Error cargando ${id}</p>`;
    }
}

// ===== Actualizar contador del carrito =====
function updateCartCount() {
    const cartData = JSON.parse(localStorage.getItem('norkys_cart') || '[]');
    const count = cartData.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

// ===== Inicializar Header =====
function initHeaderFunctions() {
    updateCartCount();

    // --- Búsqueda ---
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) window.location.href = `menu.html?search=${encodeURIComponent(query)}`;
        });
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') searchBtn.click();
        });
    }

    // ===== LOGIN / LOGOUT =====
    function updateLoginState() {
        const user = JSON.parse(localStorage.getItem('user'));
        const loginDropdown = document.querySelector('.login-dropdown');
        const loginText = loginDropdown?.querySelector('.login-text');
        const logoutBtn = loginDropdown?.querySelector('#logoutBtn');
        const dropdownMenu = loginDropdown?.querySelector('.dropdown-menu');

        if (!loginDropdown || !loginText || !dropdownMenu) return;

        // --- Reiniciar menú visual ---
        dropdownMenu.style.display = 'none';

        if (user) {
            // ✅ Usuario logeado
            loginText.textContent = `Hola, ${user.nombre}`;

            // Reinicia carrito solo una vez por sesión
            if (!sessionStorage.getItem('cartReset')) {
                localStorage.removeItem('norkys_cart');
                updateCartCount();
                sessionStorage.setItem('cartReset', 'true');
            }

            // --- Hover (desktop) ---
            loginDropdown.onmouseenter = () => dropdownMenu.style.display = 'block';
            loginDropdown.onmouseleave = () => dropdownMenu.style.display = 'none';

            // --- Click alternar (mobile) ---
            loginText.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = dropdownMenu.style.display === 'block';
                dropdownMenu.style.display = isVisible ? 'none' : 'block';
            };

            // --- Logout ---
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Limpieza total
                    localStorage.removeItem('user');
                    localStorage.removeItem('norkys_cart');
                    sessionStorage.removeItem('cartReset');
                    updateCartCount();

                    // Oculta menú y actualiza el estado visual
                    dropdownMenu.style.display = 'none';
                    updateLoginState();
                };
            }

            // --- Cerrar si clic fuera del dropdown ---
            document.addEventListener('click', (e) => {
                if (!loginDropdown.contains(e.target)) dropdownMenu.style.display = 'none';
            });

        } else {
            // 🚪 Usuario NO logeado
            loginText.textContent = "Iniciar sesión";
            loginText.onclick = () => {
                window.location.href = '/pages/login.html';
            };

            // Limpia eventos viejos
            loginDropdown.onmouseenter = null;
            loginDropdown.onmouseleave = null;
            dropdownMenu.style.display = 'none';
        }
    }

    updateLoginState(); // Inicializa el header al cargar
}

// ===== Cargar Header y Footer =====
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('header', '../components/header.html');
    loadComponent('footer', '../components/footer.html');
});
