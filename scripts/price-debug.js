const parser = require('../lib/cotizacion-parser.js');
const lines = [
  'OMEPRAZOL SODICO 40MG... $50.000',
  'METRONIDAZOL 500MG/100ML... $9.000'
];
for (const l of lines) {
  console.log('line:', l);
  console.log('extractPrecioSeguro:', parser.extractPrecioSeguro ? parser.extractPrecioSeguro(l) : undefined);
  console.log('explicit dollar match:', l.match(/\$\s*[0-9\.,]+/));
  console.log('extractPriceInfo:', typeof parser.extractPrecioSeguro === 'function' ? 'available' : 'not');
  const PRICE_REGEX_SOURCE = "(?:\\$\\s*)?(?:\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d{4,}(?:[.,]\\d{1,2})?|\\d+(?:,\\d{2}))";
  const PRICE_GLOBAL_REGEX = new RegExp(PRICE_REGEX_SOURCE, 'g');
  console.log('local regex matches:', Array.from(l.matchAll(PRICE_GLOBAL_REGEX)).map(m=>m[0]));
  console.log('---');
}
