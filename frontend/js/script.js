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

// Animaciones generales (fade y slide)
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

// -------------------------------
// Modelo 3D del pollo (Three.js global)
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('pollobrasa');
    if (!container) return;

    container.style.height = container.style.height || '400px';

    // Escena y cámara
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5.5);

    // Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Iluminación
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 10, 7.5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7
    ));

    // Cargar modelo GLB
    const loader = new THREE.GLTFLoader();
    loader.load('/models/pollobrasa.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(2, 2, 2);

        scene.add(model);

        function animate() {
            requestAnimationFrame(animate);
            model.rotation.y += 0.005;
            renderer.render(scene, camera);
        }
        animate();
    }, undefined, (error) => console.error('Error cargando GLB:', error));

    // Ajuste en resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
// ===== LOGIN 3D PAPAS =====
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('login3d');
    if (!container) return;

    // Escena y cámara
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    // Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Cargar modelo GLB
    const loader = new THREE.GLTFLoader();
    loader.load('/models/french_fries.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.2, 0.2, 0.2);
        model.position.y = -0.5;
        scene.add(model);

        // Animación de "saltito" al click
        container.addEventListener('click', () => {
            const duration = 200; // ms
            const initialY = model.position.y;
            const jumpHeight = 0.5;

            let start = null;
            function animateJump(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;

                if (progress < duration) {
                    model.position.y = initialY + Math.sin((progress / duration) * Math.PI) * jumpHeight;
                    requestAnimationFrame(animateJump);
                } else {
                    model.position.y = initialY;
                }
            }
            requestAnimationFrame(animateJump);
        });

        function animate() {
            requestAnimationFrame(animate);
            model.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();
    }, undefined, (error) => console.error('Error cargando GLB:', error));

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // ===== LOGIN VALIDACIÓN =====
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                window.location.href = "/pages/index.html";
            } else {
                alert(data.error || "Error al iniciar sesión");
            }
        } catch (err) {
            console.error(err);
            alert("Error al conectarse al servidor");
        }
    });
});
