// ====== IMPORTACIONES ======
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcrypt');

// ====== CONFIGURACIÓN ======
const app = express();
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== SERVIR FRONTEND ======
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// ====== CONFIGURAR CARPETA DE BOLETAS ======
const boletasDir = path.join(__dirname, 'boletas');
if (!fs.existsSync(boletasDir)) fs.mkdirSync(boletasDir);
app.use('/boletas', express.static(boletasDir));

// ====== RUTAS HTML ======
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/index.html')));
app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '../frontend/pages', `${page}.html`);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).send('<h1>404 - Página no encontrada</h1>');
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


// === REGISTRO DE USUARIO CON VALIDACIONES COMPLETAS ===
app.post('/api/register', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, password } = req.body;

    // 1️⃣ Validaciones básicas
    if (!nombre || !email || !telefono || !password) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse' });
    }

    // 2️⃣ Validaciones de formato
    const nombreRegex = /^[A-Za-z0-9]{5,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefonoRegex = /^\d{9}$/;

    if (!nombreRegex.test(nombre)) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 5 caracteres y solo letras o números.' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Correo electrónico no válido.' });
    }
    if (!telefonoRegex.test(telefono)) {
      return res.status(400).json({ error: 'Número de teléfono inválido (solo números,de 9 dígitos).' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // 3️⃣ Verificar si el nombre ya está registrado
    const existName = await pool.query('SELECT 1 FROM usuarios WHERE nombre = $1', [nombre]);
    if (existName.rows.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso, elige otro.' });
    }

    // 4️⃣ Verificar si el email ya está registrado
    const existEmail = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (existEmail.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // 5️⃣ Verificar si el teléfono ya está registrado
    const existPhone = await pool.query('SELECT 1 FROM usuarios WHERE telefono = $1', [telefono]);
    if (existPhone.rows.length > 0) {
      return res.status(400).json({ error: 'El número de teléfono ya está registrado.' });
    }

    // 6️⃣ Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7️⃣ Insertar usuario
    await pool.query(
      `INSERT INTO usuarios (nombre, email, telefono, direccion, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [nombre, email, telefono, direccion || null, hashedPassword]
    );

    // 8️⃣ Éxito
    res.status(201).json({ message: 'Usuario registrado exitosamente' });

  } catch (error) {
    console.error('❌ Error en el registro:', error);
    res.status(500).json({ error: 'Error interno del servidor. Intenta nuevamente más tarde.' });
  }
});




// Login de usuario
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });

    const result = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email]);

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    const user = result.rows[0];

    // Comparar password con hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    res.json({
      message: 'Login exitoso.',
      user: { id: user.id, nombre: user.nombre, email: user.email, telefono: user.telefono, direccion: user.direccion }
    });

  } catch (error) {
    console.error('❌ Error al hacer login:', error);
    res.status(500).json({ error: 'Error en el login.' });
  }
});

// Crear pedido
app.post('/api/pedidos', async (req, res) => {
  const client = await pool.connect();
  try {
    let { cliente, productos, total } = req.body;
    let { id: usuarioId, nombre, telefono, email, direccion, metodoEntrega, sucursal, notas } = cliente;

    // Datos de usuario logueado
    if (usuarioId) {
      const userRes = await client.query(
        'SELECT nombre, telefono, email, direccion FROM usuarios WHERE id=$1',
        [usuarioId]
      );
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        nombre = nombre || user.nombre;
        telefono = telefono || user.telefono;
        email = email || user.email;
        if (metodoEntrega === 'delivery') direccion = direccion || user.direccion;
      }
    }

    // Validación
    if (!nombre || !telefono || (metodoEntrega === 'delivery' && !direccion) || (metodoEntrega === 'recojo' && !sucursal)) {
      return res.status(400).json({ error: 'Faltan datos obligatorios según el método de entrega.' });
    }

    const direccionEntrega = metodoEntrega === 'delivery' ? direccion.trim() : '';
    const sucursalFinal = metodoEntrega === 'recojo' ? sucursal.trim() : null;

    await client.query('BEGIN');

    // Insertar usuario si no existe
    if (!usuarioId) {
      const clienteRes = await client.query(
        `INSERT INTO usuarios (nombre, email, telefono, direccion)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [nombre, email || null, telefono, direccion || null]
      );
      usuarioId = clienteRes.rows[0].id;
    }

    // Insertar pedido
    const pedidoRes = await client.query(
      `INSERT INTO pedidos
        (usuario_id, fecha, metodo_entrega, direccion_entrega, sucursal_recojo, notas, total, estado)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, 'Pendiente') RETURNING id`,
      [usuarioId, metodoEntrega, direccionEntrega || null, sucursalFinal, notas || null, total]
    );
    const pedidoId = pedidoRes.rows[0].id;

    // Insertar detalle productos
    for (const p of productos) {
      if (!p.id_producto || !p.cantidad || !p.precio) continue;
      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, p.id_producto, p.cantidad, p.precio]
      );
    }

    await client.query('COMMIT');

    // ====== Generar boleta PDF ======
    const pdfPath = path.join(boletasDir, `boleta_${pedidoId}.pdf`);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(fs.createWriteStream(pdfPath));

    const primaryColor = '#2e7d32';
    const secondaryColor = '#fdd835';
    const textColor = '#333';
    const logoPath = path.resolve(__dirname, '../frontend/images/pollo_v1.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 40, { width: 80 });

    doc.fillColor(primaryColor).fontSize(24).text("Norky's Pollería", 150, 50);
    doc.fillColor(textColor).fontSize(10)
       .text("Av. Principal 123 - Lima", 150, 80)
       .text("Teléfono: 987-654-321", 150, 95);
    doc.moveTo(50, 130).lineTo(550, 130).strokeColor(primaryColor).stroke();

    doc.fontSize(14).fillColor(primaryColor).text(`Boleta N° ${pedidoId}`, { align: 'center' });
    doc.moveDown();
    doc.fillColor(textColor).fontSize(12)
       .text(`Cliente: ${nombre}`)
       .text(`Teléfono: ${telefono}`)
       .text(`Método: ${metodoEntrega === 'recojo' ? 'Recojo en tienda' : 'Delivery'}`)
       .text(`Dirección de entrega: ${direccionEntrega || sucursalFinal}`)
       .text(`Fecha: ${new Date().toLocaleString()}`);
    doc.moveDown(1.5);

    let startY = doc.y;
    doc.fontSize(12).fillColor(primaryColor).text("Detalle del Pedido:", 50, startY, { underline: true });
    startY += 25;
    doc.rect(50, startY - 5, 500, 25).fill(secondaryColor).stroke();
    doc.fillColor(primaryColor).font('Helvetica-Bold')
       .text("Producto", 60, startY)
       .text("Cant.", 320, startY)
       .text("Precio", 400, startY)
       .text("Subtotal", 480, startY);
    startY += 30;
    doc.font('Helvetica').fillColor(textColor);

    productos.forEach(p => {
      const subtotal = (p.precio * p.cantidad).toFixed(2);
      doc.text(p.name, 60, startY)
         .text(p.cantidad.toString(), 320, startY)
         .text(`S/ ${p.precio.toFixed(2)}`, 400, startY)
         .text(`S/ ${subtotal}`, 480, startY);
      startY += 20;
    });

    doc.moveTo(50, startY).lineTo(550, startY).strokeColor(primaryColor).stroke();
    startY += 10;
    doc.rect(400, startY, 150, 25).fill(primaryColor);
    doc.fillColor('#fff').fontSize(14).text(`Total: S/ ${total.toFixed(2)}`, 410, startY + 5);

    doc.fontSize(10).fillColor('gray').text(
      "Gracias por su compra. ¡Lo esperamos pronto en Norky's!",
      50, 750, { align: 'center', width: 500 }
    );
    doc.end();

    const baseURL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const boletaURL = `${baseURL}/boletas/boleta_${pedidoId}.pdf`;

    res.json({ message: 'Pedido y boleta generados con éxito.', pedidoId, boletaURL });

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
