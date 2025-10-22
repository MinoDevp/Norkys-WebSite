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
    if (!container) return console.error('Contenedor 3D no encontrado');

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
