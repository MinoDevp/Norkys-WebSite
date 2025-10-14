// ====== IMPORTACIONES ======
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// ====== CONFIGURACIÓN ======
const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, '../frontend')));

// ====== CONFIGURAR CARPETA DE BOLETAS ======
const boletasDir = path.join(__dirname, 'boletas');
if (!fs.existsSync(boletasDir)) fs.mkdirSync(boletasDir);
app.use('/boletas', express.static(boletasDir));

// ====== RUTAS ======

// --- Obtener usuarios ---
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// --- Crear un nuevo pedido ---
app.post('/api/pedidos', async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente, productos, total } = req.body;
    console.log("📦 Datos recibidos del pedido:", req.body);

    if (!cliente || !productos || productos.length === 0) {
      return res.status(400).json({ error: 'Faltan datos del pedido o productos.' });
    }

    await client.query('BEGIN');

    // === Insertar cliente ===
    const clienteQuery = `
      INSERT INTO usuarios (nombre, email, telefono, direccion)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const clienteResult = await client.query(clienteQuery, [
      cliente.nombre,
      cliente.email || null,
      cliente.telefono,
      cliente.direccion
    ]);
    const usuarioId = clienteResult.rows[0].id;
    console.log("✅ Cliente insertado con ID:", usuarioId);

    // === Insertar pedido ===
    const pedidoQuery = `
      INSERT INTO pedidos (usuario_id, fecha, metodo_entrega, direccion_entrega, sucursal_recojo, total, estado)
      VALUES ($1, NOW(), $2, $3, $4, $5, 'Pendiente')
      RETURNING id
    `;
    const metodoEntrega = cliente.metodoEntrega || 'delivery';
    const sucursal = cliente.sucursal || 'Sucursal Central';
    const pedidoResult = await client.query(pedidoQuery, [
      usuarioId,
      metodoEntrega,
      cliente.direccion,
      sucursal,
      total
    ]);
    const pedidoId = pedidoResult.rows[0].id;
    console.log("✅ Pedido insertado con ID:", pedidoId);

    // === Insertar productos del pedido ===
    for (const producto of productos) {
      if (!producto.id_producto || !producto.cantidad || !producto.precio) continue;
      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, producto.id_producto, producto.cantidad, producto.precio]
      );
    }

    console.log("📦 Productos insertados correctamente.");

    // === Obtener nombres de los productos desde la BD ===
    const ids = productos.map(p => p.id_producto);

    const { rows: productosDB } = await client.query(
      `SELECT id, nombre FROM productos WHERE id = ANY($1::int[])`,
      [ids]
    );

    // Crear un mapa { id: nombre }
    const mapaNombres = Object.fromEntries(productosDB.map(p => [p.id, p.nombre]));

    // Agregar los nombres a los objetos del array 'productos'
    productos.forEach(p => {
      p.nombre = mapaNombres[p.id_producto] || `Producto #${p.id_producto}`;
    });

    await client.query('COMMIT');
    console.log("✅ Pedido, detalles y nombres obtenidos correctamente.");


    // ====== GENERAR PDF ELEGANTE Y COLOREADO ======
    const pdfPath = path.join(boletasDir, `boleta_${pedidoId}.pdf`);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.pipe(fs.createWriteStream(pdfPath));

    // === COLORES ===
    const primaryColor = '#2e7d32';   // verde Norky's
    const secondaryColor = '#fdd835'; // amarillo Norky's
    const textColor = '#333';

    // === LOGO ===
   const logoPath = path.resolve(__dirname, '../images/pollo_v1.png');
   console.log("📌 Ruta del logo:", logoPath);
   if (fs.existsSync(logoPath)) {
     doc.image(logoPath, 50, 40, { width: 80, height: 80 });
   } else {
     console.warn("⚠️ Logo no encontrado, se omitirá en el PDF.");
   }


    // === ENCABEZADO ===
    doc.fillColor(primaryColor)
       .fontSize(24)
       .text("Norky's Pollería", 150, 50);

    doc.fillColor(textColor)
       .fontSize(10)
       .text("Av. Principal 123 - Lima", 150, 80)
       .text("Teléfono: 987-654-321", 150, 95);

    doc.moveTo(50, 130).lineTo(550, 130).strokeColor(primaryColor).stroke();

   // === DATOS DEL CLIENTE ===
   doc.fontSize(14).fillColor(primaryColor)
      .text(`Boleta de Venta N°: ${pedidoId}`, { align: 'center' });

   doc.moveDown(1); // deja espacio extra antes de los datos del cliente

   doc.fillColor(textColor)
      .fontSize(12)
      .text(`Cliente: ${cliente.nombre}`)
      .text(`Teléfono: ${cliente.telefono}`)
      .text(`Dirección: ${cliente.direccion}`)
      .text(`Fecha: ${new Date().toLocaleString()}`);

   doc.moveDown(1.5); // espacio extra antes de la tabla

  // === TABLA DE PRODUCTOS ===
  let startY = doc.y; // posición inicial de la tabla

  // Título de la tabla
  doc.fontSize(12).fillColor(primaryColor)
     .text("Detalle del Pedido:", 50, startY, { underline: true });

  startY += 25; // separa el título de la cabecera

  // Cabecera de la tabla con fondo amarillo
  doc.rect(50, startY - 5, 500, 25).fill(secondaryColor).stroke();
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .text("ID", 55, startY)
     .text("Producto", 100, startY)
     .text("Cant.", 320, startY)
     .text("Precio", 400, startY)
     .text("Subtotal", 480, startY);

  startY += 30; // separa cabecera de productos

  // Productos
  doc.font('Helvetica').fillColor(textColor);
  productos.forEach(p => {
    const subtotal = (p.precio * p.cantidad).toFixed(2);
    doc.text(p.id_producto.toString(), 55, startY)
       .text(p.nombre || `Producto #${p.id_producto}`, 100, startY)
       .text(p.cantidad.toString(), 320, startY)
       .text(`S/ ${p.precio.toFixed(2)}`, 400, startY)
       .text(`S/ ${subtotal}`, 480, startY);
    startY += 20; // espacio entre productos
  });

  // Línea antes del total
  doc.moveTo(50, startY).lineTo(550, startY).strokeColor(primaryColor).stroke();
  startY += 10;

  // TOTAL en recuadro verde con texto blanco
  doc.rect(400, startY, 150, 25).fill(primaryColor);
  doc.fillColor('#fff').fontSize(14)
     .text(`Total: S/ ${total.toFixed(2)}`, 410, startY + 5);


   // PIE DE PÁGINA
   doc.fontSize(10).fillColor('gray')
      .text("Gracias por su compra. ¡Lo esperamos pronto en Norky's!", 50, 750, {
        align: 'center',
        width: 500
      });

   doc.end();

   // === URL dinámica según entorno ===
   const baseURL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
   const boletaURL = `${baseURL}/boletas/boleta_${pedidoId}.pdf`;

   console.log("🧾 Boleta generada en:", boletaURL);



    // === RESPUESTA AL FRONTEND ===
    res.json({
      message: 'Pedido y boleta generados con éxito.',
      pedidoId,
      boletaURL
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al procesar el pedido:", error);
    res.status(500).json({ error: 'Error al procesar el pedido.' });
  } finally {
    client.release();
  }
});

// ====== INICIAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`✅ Servidor funcionando en el puerto ${PORT}`);
});
