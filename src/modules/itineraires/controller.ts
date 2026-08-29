import { FastifyRequest, FastifyReply } from 'fastify';
import { ItinaryService } from './service';

interface SearchQuery {
  from: string;
  to: string;
}

export class ItinaryController {
  private service: ItinaryService;

  constructor() {
    this.service = new ItinaryService();
  }

  async search(request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) {
    const { from, to } = request.query;

    if (!from || !to) {
      return reply.status(400).send({
        statut: 'erreur',
        message: 'Les paramètres "from" et "to" sont obligatoires (ex: ?from=2.3386,48.8576&to=2.3522,48.8566).'
      });
    }

    try {
      const data = await this.service.searchItinary(from, to);
      return reply.send({
        statut: 'succès',
        data
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur interne lors du calcul d\'itinéraire';
      return reply.status(500).send({
        statut: 'erreur',
        message: errorMessage
      });
    }
  }

  async searchPlaces(request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) {
    const { q } = request.query;

    if (!q) {
      return reply.status(400).send({
        statut: 'erreur',
        message: 'Le paramètre "q" est obligatoire (ex: ?q=Chatelet).'
      });
    }

    try {
      const data = await this.service.searchPlaces(q);
      return reply.send({
        statut: 'succès',
        data
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur interne lors de la recherche de lieux';
      return reply.status(500).send({
        statut: 'erreur',
        message: errorMessage
      });
    }
  }
}