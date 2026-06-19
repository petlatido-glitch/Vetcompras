(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/productos/upsert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Producto prueba desde API',
        categoria: 'MEDICAMENTOS',
        unidad: 'unidad',
        stockActual: 12,
        stockMinimo: 2
      })
    });

    console.log('status', res.status);
    const body = await res.text();
    console.log(body);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

