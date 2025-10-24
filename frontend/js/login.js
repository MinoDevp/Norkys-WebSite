// login.js

// Manejo del formulario
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Completa todos los campos');
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/pages/index.html';
        } else {
            alert(data.error || 'Usuario o contraseña incorrectos');
        }
    } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor');
    }
});

// -------------------------------
// Inicialización 3D del login
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('login3d');
    if (!container) return;

    initLogin3D(container);
});

function initLogin3D(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const loader = new THREE.GLTFLoader();
    loader.load('/models/french_fries.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.2, 0.2, 0.2);
        model.position.y = -0.5;
        scene.add(model);

        container.addEventListener('click', () => {
            const duration = 200;
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
}
