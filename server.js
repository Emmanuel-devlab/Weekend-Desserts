const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

http.createServer((req, res) => {
  const requestPath = decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]);
  const file = path.resolve(root, '.' + requestPath);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const extension = path.extname(file).toLowerCase();
    const isPhoto = ['.png', '.jpg', '.jpeg', '.webp'].includes(extension);
    const isCompressible = ['.html', '.css', '.js', '.json', '.svg'].includes(extension);
    const cacheControl = isPhoto ? 'public, max-age=604800, immutable' : extension === '.html' ? 'no-cache' : 'public, max-age=3600';
    const headers = { 'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': cacheControl, 'Vary': 'Accept-Encoding' };
    if (isCompressible && /br/.test(req.headers['accept-encoding'] || '')) {
      return zlib.brotliCompress(data, (compressionError, compressed) => {
        if (compressionError) { res.writeHead(200, headers); return res.end(data); }
        res.writeHead(200, { ...headers, 'Content-Encoding': 'br' }); res.end(compressed);
      });
    }
    if (isCompressible && /gzip/.test(req.headers['accept-encoding'] || '')) {
      return zlib.gzip(data, (compressionError, compressed) => {
        if (compressionError) { res.writeHead(200, headers); return res.end(data); }
        res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' }); res.end(compressed);
      });
    }
    res.writeHead(200, headers); res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log('Weekend Desserts menu: http://localhost:' + (process.env.PORT || 3000)));
