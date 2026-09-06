import { FastifyInstance } from 'fastify';
import { AuthController } from './controller';

export default async function authRoutes(fastify: FastifyInstance) {
  const controller = new AuthController();

  fastify.post('/api/auth/register', (req, reply) => controller.register(req, reply));
  fastify.post('/api/auth/login', (req, reply) => controller.login(req, reply));
  fastify.put('/api/auth/profile', (req, reply) => controller.updateProfile(req, reply));
  fastify.put('/api/auth/password', (req, reply) => controller.changePassword(req, reply));
}