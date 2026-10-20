import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const portArg = process.argv.findIndex(arg => arg === '--port');
const port = Number(portArg >= 0 ? process.argv[portArg+1] : process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server = createServer(async (request, response) => {
  try {
    if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return;}
    const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const local = relative(root,target);
    if (local.startsWith('..') || isAbsolute(local)) {response.writeHead(403);response.end();return;}
    const info = await stat(target);
    if (!info.isFile()) {response.writeHead(404);response.end('Not found');return;}
    response.writeHead(200, {'Content-Type':types[extname(target)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(request.method === 'HEAD' ? undefined : await readFile(target));
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 400, {'Content-Type':'text/plain; charset=utf-8'});
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Bad request');
  }
});
server.listen(port,host,()=>console.log(`Offclock local preview: http://${host}:${port}`));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
