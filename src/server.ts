import Fastify from 'fastify';
import cors from '@fastify/cors';
import postgres from '@fastify/postgres';
import fastifyRedis from '@fastify/redis';
import itinerairesRoutes from './modules/itineraires/routes';
import fastifyJwt from '@fastify/jwt';
import authRoutes from './modules/auth/routes';
import co2Routes from './modules/co2/routes';

const server = Fastify({ logger: true });

server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
});

server.register(postgres, {
  connectionString: process.env.DATABASE_URL,
});

server.register(fastifyRedis, {
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  lazyConnect: true,
  retryStrategy: (times) => (times > 3 ? null : Math.min(times * 50, 500)),
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super_secret_jwt_key_a_changer_en_prod_2026',
});

server.register(authRoutes);
server.register(co2Routes);

server.get('/api/health', async () => {
  return {
    status: 'ok',
    service: 'UrbanFlow Backend',
    timestamp: new Date().toISOString(),
  };
});

server.get('/api/health/db', async () => {
  const client = await server.pg.connect();
  try {
    const { rows } = await client.query('SELECT NOW()');
    return { status: 'ok', db_time: rows[0].now };
  } finally {
    client.release();
  }
});

server.get('/api/health/redis', async () => {
  try {
    const pong = await server.redis.ping();
    return { status: 'ok', redis: pong };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'error', redis: message };
  }
});

server.register(itinerairesRoutes);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8000;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`🚀 Serveur backend démarré sur http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();