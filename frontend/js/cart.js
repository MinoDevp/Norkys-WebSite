document.addEventListener('DOMContentLoaded', () => {

    const cartItemsList = document.getElementById('cart-items-list');
    const cartEmpty = document.getElementById('cart-empty');
    const subtotalElement = document.getElementById('subtotal');
    const deliveryElement = document.getElementById('delivery-cost');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');

    function readCartFromStorage() {
        const raw = localStorage.getItem('norkys_cart');
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return parsed.map(item => ({
                id: String(item.id),
                name: item.name || item.nombre || `Producto ${item.id}`,
                price: Number(item.price ?? item.precio ?? 0),
                // ⚡ RUTA UNIFICADA RELATIVA
                image: item.image || item.imagen || 'images/default.png',
                quantity: parseInt(item.quantity ?? item.cantidad ?? 1, 10)
            }));
        } catch (e) {
            console.warn('Error parsing localStorage carrito:', e);
            return [];
        }
    }

    let cartData = readCartFromStorage();

    function updateHeaderCartCount() {
        const cartCount = document.querySelector(".cart-count");
        if (!cartCount) return;
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    function updateCartUI() {
        cartItemsList.innerHTML = '';

        if (!cartData || cartData.length === 0) {
            cartEmpty.style.display = 'block';
            cartItemsList.style.display = 'none';
            updateSummary();
            updateHeaderCartCount();
            return;
        }

        cartEmpty.style.display = 'none';
        cartItemsList.style.display = 'block';

        cartData.forEach(item => {
            const imgSrc = item.image && item.image !== '' ? item.image : 'images/default.png';

            const div = document.createElement('div');
            div.classList.add('cart-item');
            div.setAttribute('data-id', item.id);
            div.innerHTML = `
                <div class="cart-item-image">
                    <img src="${imgSrc}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>S/ ${Number(item.price).toFixed(2)}</p>
                    <div class="cart-item-controls">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <input type="text" readonly class="quantity-input" value="${item.quantity}">
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        <button class="remove-btn" data-id="${item.id}">Eliminar</button>
                    </div>
                </div>
            `;
            cartItemsList.appendChild(div);
        });

        updateSummary();
        updateHeaderCartCount();
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function updateSummary() {
        const subtotal = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = 5;
        const total = subtotal + delivery;

        subtotalElement.textContent = `S/ ${subtotal.toFixed(2)}`;
        deliveryElement.textContent = `S/ ${delivery.toFixed(2)}`;
        totalElement.textContent = `S/ ${total.toFixed(2)}`;

        localStorage.setItem('norkys_cart', JSON.stringify(cartData));
    }

    cartItemsList.addEventListener('click', (e) => {
        const id = e.target?.getAttribute('data-id');
        if (!id) return;

        if (e.target.classList.contains('increase')) {
            const item = cartData.find(i => i.id === id);
            if (item) item.quantity++;
        } else if (e.target.classList.contains('decrease')) {
            const item = cartData.find(i => i.id === id);
            if (item) {
                if (item.quantity > 1) item.quantity--;
                else cartData = cartData.filter(i => i.id !== id);
            }
        } else if (e.target.classList.contains('remove-btn')) {
            cartData = cartData.filter(i => i.id !== id);
        }

        localStorage.setItem('norkys_cart', JSON.stringify(cartData));
        updateCartUI();
    });

    checkoutBtn.addEventListener('click', async () => {
        if (!cartData || cartData.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Tu carrito está vacío' });
            return;
        }

        const nombre = document.getElementById('name').value.trim();
        const telefono = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const direccion = document.getElementById('address').value.trim();

        if (!nombre || !telefono || !direccion) {
            Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Completa los campos obligatorios' });
            return;
        }

        const subtotal = cartData.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const delivery = 5;
        const total = subtotal + delivery;

        const pedido = {
            cliente: { nombre, telefono, email, direccion },
            productos: cartData.map(i => ({ id_producto: i.id, cantidad: i.quantity, precio: i.price, name: i.name })),
            total
        };

        try {
           const API_BASE = window.location.hostname.includes('localhost')
             ? 'http://localhost:3000'       // sigue siendo tu local
             : 'https://norkys-website.onrender.com';  // tu Render URL


            const response = await fetch(`${API_BASE}/api/pedidos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pedido)
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: '✅ Pedido registrado con éxito',
                    html: `
                        <p>Gracias <strong>${escapeHtml(nombre)}</strong> por tu compra.</p>
                        <p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>
                        <p>Tu boleta ya está lista para descargar.</p>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: '🧾 Ver Boleta PDF',
                    cancelButtonText: 'Cerrar',
                }).then((r) => {
                    if (r.isConfirmed && result.boletaURL) {
                        window.open(result.boletaURL, '_blank');
                    }
                });

                localStorage.removeItem('norkys_cart');
                cartData = [];
                updateCartUI();
            } else {
                Swal.fire({ icon: 'error', title: 'Error en el pedido', text: result.error || 'Problema al procesar el pedido.' });
            }

        } catch (error) {
            console.error('Error en fetch:', error);
            Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor.' });
        }
    });

    updateCartUI();
    console.log('[cart.js] Carrito cargado y listo', cartData);

});
