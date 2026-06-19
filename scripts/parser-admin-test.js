const parser = require('../lib/cotizacion-parser.js');

const tests = [
  { text: 'SUTURA NO ABSORBIBLE NYLON MONOFILAMENTO... $56.000', expect: 'accept' },
  { text: 'AMPICILINA 1GR + SULBACTAM 0.5GR... $45.000', expect: 'accept' },
  { text: 'CEFTRIAXONA SODICA 1 GR... $60.000', expect: 'accept' },
  { text: 'OMEPRAZOL SODICO 40MG... $50.000', expect: 'accept' },
  { text: 'METRONIDAZOL 500MG/100ML... $9.000', expect: 'accept' },
  { text: 'NIT 900123456-7', expect: 'reject' },
  { text: 'Subtotal 123.000', expect: 'reject' },
  { text: 'IVA 19%', expect: 'reject' },
  { text: 'Teléfono: 312 555 1212', expect: 'reject' },
  { text: 'Dirección: Calle 123', expect: 'reject' }
];

for (const t of tests) {
  const debug = parser.parseDetectedItemsWithDebug(t.text);
  const parsed = debug.items;
  const rejected = debug.parsedLines.length > 0 && debug.parsedLines.every(p => !p.item);
  const priceFound = typeof parser.extractPrecioSeguro === 'function' ? parser.extractPrecioSeguro(t.text) : undefined;
  console.log('---');
  console.log('line:', t.text);
  console.log('expected:', t.expect);
  console.log('priceFound:', priceFound);
  console.log('parsed items count:', parsed.length);
  console.log('rejected reason(s):', debug.parsedLines.map(p => p.rejectedReason).filter(Boolean));
}

console.log('--- Minimal price checks ---');
console.log('$50.000 ->', parser.extractPrecioSeguro('$50.000'));
console.log('$9.000 ->', parser.extractPrecioSeguro('$9.000'));
