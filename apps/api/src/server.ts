import { buildApp } from './app.js';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';

const app = buildApp();
if (process.env['NODE_ENV'] === 'production') {
  const webRoot = fileURLToPath(new URL('../../web/dist', import.meta.url));
  await app.register(fastifyStatic, { root: webRoot, wildcard: false });
}

await app.listen({
  port: Number(process.env['PORT'] ?? 3001),
  host: process.env['HOST'] ?? (process.env['NODE_ENV'] === 'production' ? '0.0.0.0' : '127.0.0.1')
});
