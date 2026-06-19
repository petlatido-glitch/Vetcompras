const http = require('http');
const fs = require('fs');

const url = 'http://localhost:3000/productos';

const req = http.get(url, (res) => {
  console.log('STATUS', res.statusCode);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    fs.writeFileSync('response_productos.html', body, 'utf8');
    process.exit(res.statusCode === 200 ? 0 : 2);
  });
});

req.on('error', (err) => {
  console.error('ERROR', err.message);
  process.exit(1);
});
