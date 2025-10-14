/// js/components.js

 async function loadComponent(id, url) {
     try {
         const response = await fetch(url);
         if (!response.ok) throw new Error(`Error cargando ${url}`);
         const html = await response.text();
         document.getElementById(id).innerHTML = html;

         if (id === 'header') {
             initHeaderFunctions();
         }
     } catch (err) {
         console.error(err);
     }
 }

// ✅ Función global para actualizar el contador del carrito
 function updateCartCount() {
         const cartData = JSON.parse(localStorage.getItem('norkys_cart') || '[]');
         const count = cartData.reduce((sum, item) => sum + item.quantity, 0);
         document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
     }


 // Inicializar funciones dinámicas del header
 function initHeaderFunctions() {
     // Actualizar contador del carrito


     updateCartCount();

     // Búsqueda dinámica
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
 }

 // Cargar componentes automáticamente
 document.addEventListener('DOMContentLoaded', () => {
     loadComponent('header', 'components/header.html');
     loadComponent('footer', 'components/footer.html');
 });
