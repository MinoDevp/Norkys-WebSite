document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------
    // 1️⃣ Carrito de compras
    // -------------------------------
    class Cart {
        constructor() {
            this.cart = JSON.parse(localStorage.getItem("norkys_cart")) || [];
            this.updateCartCount();
            this.setupAddToCartButtons();
        }

        setupAddToCartButtons() {
            const buttons = document.querySelectorAll(".add-to-cart");
            buttons.forEach(button => {
                button.addEventListener("click", () => {
                    const product = {
                        id: button.dataset.id,
                        name: button.dataset.name,
                        price: parseFloat(button.dataset.price),
                        image: button.dataset.image,
                        quantity: 1
                    };
                    this.addItem(product);

                    Swal.fire({
                        icon: "success",
                        title: "Producto agregado",
                        text: `${product.name} fue añadido al carrito.`,
                        showConfirmButton: false,
                        timer: 1200
                    });
                });
            });
        }

        addItem(product) {
            const existing = this.cart.find(item => item.id === product.id);
            if (existing) existing.quantity += 1;
            else this.cart.push(product);
            this.saveCart();
            this.updateCartCount();
        }

        updateCartCount() {
            // Guardamos en localStorage
            localStorage.setItem("norkys_cart", JSON.stringify(this.cart));

            // Actualizamos todos los contadores del header
            const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            document.querySelectorAll(".cart-count").forEach(el => el.textContent = count);
        }

        saveCart() {
            localStorage.setItem("norkys_cart", JSON.stringify(this.cart));
        }
    }

    const cart = new Cart();

    // -------------------------------
    // 2️⃣ Filtrado de categorías de menú
    // -------------------------------
    class MenuFilter {
        constructor() {
            this.categoryButtons = document.querySelectorAll(".category-btn");
            this.menuCategories = document.querySelectorAll(".menu-category");

            this.init();
            this.setupEventListeners();
        }

        init() {
            this.showCategory("pollo");
            this.setActiveButton(document.querySelector(".category-btn[data-category='pollo']"));
        }

        setupEventListeners() {
            this.categoryButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    this.setActiveButton(btn);
                    this.showCategory(btn.dataset.category);
                });
            });
        }

        setActiveButton(button) {
            this.categoryButtons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");
        }

        showCategory(categoryId) {
            this.menuCategories.forEach(cat => {
                cat.style.display = (cat.id === categoryId) ? "block" : "none";
            });
        }
    }

    const menuFilter = new MenuFilter();

    // -------------------------------
    // 3️⃣ Búsqueda de productos por palabra
    // -------------------------------
    // -------------------------------
    // Búsqueda por palabra en el nombre del producto
    // -------------------------------
    function filterByPartialName() {
        const params = new URLSearchParams(window.location.search);
        const searchQuery = params.get("search");
        if (!searchQuery) return;

        const query = searchQuery.trim().toLowerCase();
        const allItems = document.querySelectorAll(".menu-item");

        allItems.forEach(item => {
            const name = item.querySelector("h4").textContent.toLowerCase();
            const match = name.includes(query); // true si la query aparece en cualquier parte del nombre
            item.style.display = match ? "block" : "none";
        });

        // Mostrar solo la categoría del primer resultado visible
        const firstVisible = Array.from(allItems).find(item => item.style.display === "block");
        if (firstVisible) {
            const categoryId = firstVisible.closest(".menu-category").id;
            menuFilter.showCategory(categoryId);
            menuFilter.setActiveButton(document.querySelector(`.category-btn[data-category="${categoryId}"]`));
        }
    }



    filterByPartialName();


});
