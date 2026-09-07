import { FastifyInstance } from 'fastify';
import { CO2Controller } from './controller';

export default async function co2Routes(fastify: FastifyInstance) {
  const controller = new CO2Controller();

  fastify.get('/api/co2-impact', (request, reply) =>
    controller.getImpact(request, reply)
  );
  fastify.get('/co2-impact', (request, reply) =>
    controller.getImpact(request, reply)
  );

  fastify.post('/api/trips', (request, reply) =>
    controller.createTrip(request, reply)
  );
  fastify.post('/api/co2-impact/trips', (request, reply) =>
    controller.createTrip(request, reply)
  );
}
