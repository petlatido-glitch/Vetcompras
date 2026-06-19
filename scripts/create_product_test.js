(async () => {
  try {
    const form = new FormData();
    form.append('nombre', 'Prueba Producto API');
    form.append('categoria', 'MEDICAMENTOS');
    form.append('unidad', 'unidad');
    form.append('stockActual', '10');
    form.append('stockMinimo', '1');

    const res = await fetch('http://localhost:3000/api/productos/upsert', { method: 'POST', body: form });
    console.log('status', res.status);
    const body = await res.text();
    console.log('body', body);
  } catch (err) {
    console.error('error', err);
  }
})();
