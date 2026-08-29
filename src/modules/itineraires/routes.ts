import { FastifyInstance } from 'fastify';
import { ItinaryController } from './controller';

export default async function itinerairesRoutes(fastify: FastifyInstance) {
  const controller = new ItinaryController();

  fastify.get('/api/itineraires/search', (request: any, reply: any) => controller.search(request, reply));
  fastify.get('/api/places/search', (request: any, reply: any) => controller.searchPlaces(request, reply));
}