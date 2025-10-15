// js/locales.js
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🌍 Página de locales cargada');

  // Simulación de carga desde backend
  Swal.fire({
    title: 'Cargando locales...',
    text: 'Conectando con el servidor 🔄',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  Swal.fire({
    icon: 'success',
    title: 'Locales cargados correctamente ✅',
    timer: 1500,
    showConfirmButton: false
  });

  // Inicializar mapa con Leaflet
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
});
