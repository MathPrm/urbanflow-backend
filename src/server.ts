import Fastify from 'fastify';
import cors from '@fastify/cors';
import postgres from '@fastify/postgres';
import fastifyRedis from '@fastify/redis';

const server = Fastify({ logger: true });

server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
});

server.register(postgres, {
  connectionString: process.env.DATABASE_URL,
});

server.register(fastifyRedis, {
  url: process.env.REDIS_URL,
});

server.get('/api/health', async () => {
  return {
    status: 'ok',
    service: 'UrbanFlow Backend',
    timestamp: new Date().toISOString(),
  };
});

// Route de test pour vérifier la connexion DB
server.get('/api/health/db', async () => {
  const client = await server.pg.connect();
  try {
    const { rows } = await client.query('SELECT NOW()');
    return { status: 'ok', db_time: rows[0].now };
  } finally {
    client.release();
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Serveur backend démarré sur http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();