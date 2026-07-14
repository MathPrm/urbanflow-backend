import Fastify from 'fastify';
import cors from '@fastify/cors';

const server = Fastify({
  logger: true,
});

// Autoriser les appels depuis le frontend Next.js (localhost:3000)
server.register(cors, {
  origin: 'http://localhost:3000',
});

// Route de santé
server.get('/api/health', async () => {
  return {
    status: 'ok',
    service: 'UrbanFlow Backend',
    timestamp: new Date().toISOString(),
  };
});

const start = async () => {
  try {
    await server.listen({ port: 8000, host: '0.0.0.0' });
    console.log('🚀 Serveur backend démarré sur http://localhost:8000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();