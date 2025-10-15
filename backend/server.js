// ====== IMPORTACIONES ======
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // tu configuración de PostgreSQL
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// ====== CONFIGURACIÓN ======
const app = express();
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== SERVIR FRONTEND ======
// Sirve todos los archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Sirve específicamente las imágenes del frontend
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// ====== CONFIGURAR CARPETA DE BOLETAS ======
const boletasDir = path.join(__dirname, 'boletas');
if (!fs.existsSync(boletasDir)) fs.mkdirSync(boletasDir);
app.use('/boletas', express.static(boletasDir));

// ====== RUTAS HTML ======

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// ✅ Sirve cualquier página de /frontend/pages automáticamente
app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '../frontend/pages', `${page}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('<h1>404 - Página no encontrada</h1>');
  }
});

// ====== API ======

// Obtener usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Crear un nuevo pedido y generar PDF
app.post('/api/pedidos', async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente, productos, total } = req.body;
    if (!cliente || !productos || productos.length === 0) {
      return res.status(400).json({ error: 'Faltan datos del pedido o productos.' });
    }

    await client.query('BEGIN');

    // Insertar cliente
    const clienteResult = await client.query(
      `INSERT INTO usuarios (nombre, email, telefono, direccion)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [cliente.nombre, cliente.email || null, cliente.telefono, cliente.direccion]
    );
    const usuarioId = clienteResult.rows[0].id;

    // Insertar pedido
    const metodoEntrega = cliente.metodoEntrega || 'delivery';
    const sucursal = cliente.sucursal || 'Sucursal Central';
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (usuario_id, fecha, metodo_entrega, direccion_entrega, sucursal_recojo, total, estado)
       VALUES ($1, NOW(), $2, $3, $4, $5, 'Pendiente') RETURNING id`,
      [usuarioId, metodoEntrega, cliente.direccion, sucursal, total]
    );
    const pedidoId = pedidoResult.rows[0].id;

    // Insertar productos del pedido
    for (const p of productos) {
      if (!p.id_producto || !p.cantidad || !p.precio) continue;
      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, p.id_producto, p.cantidad, p.precio]
      );
    }

    // Obtener nombres de productos
    const ids = productos.map(p => p.id_producto);
    const { rows: productosDB } = await client.query(
      `SELECT id, nombre FROM productos WHERE id = ANY($1::int[])`,
      [ids]
    );
    const mapaNombres = Object.fromEntries(productosDB.map(p => [p.id, p.nombre]));
    productos.forEach(p => {
      p.nombre = mapaNombres[p.id_producto] || `Producto #${p.id_producto}`;
    });

    await client.query('COMMIT');

    // ====== GENERAR PDF ======
    const pdfPath = path.join(boletasDir, `boleta_${pedidoId}.pdf`);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(fs.createWriteStream(pdfPath));

    const primaryColor = '#2e7d32';
    const secondaryColor = '#fdd835';
    const textColor = '#333';

    // Ruta absoluta al logo
    const logoPath = path.resolve(__dirname, '../frontend/images/pollo_v1.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 80, height: 80 });
    } else {
      console.warn('⚠️ Logo no encontrado en:', logoPath);
    }

    // Encabezado
    doc.fillColor(primaryColor).fontSize(24).text("Norky's Pollería", 150, 50);
    doc.fillColor(textColor).fontSize(10)
      .text("Av. Principal 123 - Lima", 150, 80)
      .text("Teléfono: 987-654-321", 150, 95);
    doc.moveTo(50, 130).lineTo(550, 130).strokeColor(primaryColor).stroke();

    // Datos del cliente
    doc.fontSize(14).fillColor(primaryColor).text(`Boleta de Venta N°: ${pedidoId}`, { align: 'center' });
    doc.moveDown(1);
    doc.fillColor(textColor).fontSize(12)
      .text(`Cliente: ${cliente.nombre}`)
      .text(`Teléfono: ${cliente.telefono}`)
      .text(`Dirección: ${cliente.direccion}`)
      .text(`Fecha: ${new Date().toLocaleString()}`);
    doc.moveDown(1.5);

    // Tabla de productos
    let startY = doc.y;
    doc.fontSize(12).fillColor(primaryColor).text("Detalle del Pedido:", 50, startY, { underline: true });
    startY += 25;
    doc.rect(50, startY - 5, 500, 25).fill(secondaryColor).stroke();
    doc.fillColor(primaryColor).font('Helvetica-Bold')
      .text("ID", 55, startY)
      .text("Producto", 100, startY)
      .text("Cant.", 320, startY)
      .text("Precio", 400, startY)
      .text("Subtotal", 480, startY);
    startY += 30;
    doc.font('Helvetica').fillColor(textColor);
    productos.forEach(p => {
      const subtotal = (p.precio * p.cantidad).toFixed(2);
      doc.text(p.id_producto.toString(), 55, startY)
         .text(p.nombre, 100, startY)
         .text(p.cantidad.toString(), 320, startY)
         .text(`S/ ${p.precio.toFixed(2)}`, 400, startY)
         .text(`S/ ${subtotal}`, 480, startY);
      startY += 20;
    });

    doc.moveTo(50, startY).lineTo(550, startY).strokeColor(primaryColor).stroke();
    startY += 10;
    doc.rect(400, startY, 150, 25).fill(primaryColor);
    doc.fillColor('#fff').fontSize(14).text(`Total: S/ ${total.toFixed(2)}`, 410, startY + 5);

    // Pie
    doc.fontSize(10).fillColor('gray').text(
      "Gracias por su compra. ¡Lo esperamos pronto en Norky's!",
      50, 750, { align: 'center', width: 500 }
    );
    doc.end();

    const baseURL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const boletaURL = `${baseURL}/boletas/boleta_${pedidoId}.pdf`;

    res.json({
      message: 'Pedido y boleta generados con éxito.',
      pedidoId,
      boletaURL
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al procesar el pedido:', error);
    res.status(500).json({ error: 'Error al procesar el pedido.' });
  } finally {
    client.release();
  }
});

// ====== INICIAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
