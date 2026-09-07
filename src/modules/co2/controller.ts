import { FastifyRequest, FastifyReply } from 'fastify';
import { CO2Service } from './service';

export class CO2Controller {
  async getImpact(request: FastifyRequest, reply: FastifyReply) {
    let userId: string;

    try {
      await request.jwtVerify();
      const user = request.user as { id?: string | number } | undefined;
      if (!user || user.id === undefined || user.id === null) {
        return reply.status(401).send({
          statut: 'erreur',
          message: 'Token d\'authentification invalide',
        });
      }
      userId = String(user.id);
    } catch {
      return reply.status(401).send({
        statut: 'erreur',
        message: 'Token d\'authentification requis',
      });
    }

    try {
      const service = new CO2Service(request.server);
      const data = await service.getCO2Impact(userId);
      return reply.send({
        statut: 'succès',
        data,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération de l'impact CO2";
      return reply.status(500).send({
        statut: 'erreur',
        message,
      });
    }
  }

  async createTrip(request: FastifyRequest, reply: FastifyReply) {
    let userId: string;

    try {
      await request.jwtVerify();
      const user = request.user as { id?: string | number } | undefined;
      if (!user || user.id === undefined || user.id === null) {
        return reply.status(401).send({
          statut: 'erreur',
          message: 'Token d\'authentification invalide',
        });
      }
      userId = String(user.id);
    } catch {
      return reply.status(401).send({
        statut: 'erreur',
        message: 'Token d\'authentification requis',
      });
    }

    try {
      const tripData = request.body as {
        transport_mode: string;
        distance_km: number;
        co2_saved_kg: number;
        from_label?: string;
        to_label?: string;
      };

      if (!tripData || !tripData.transport_mode) {
        return reply.status(400).send({
          statut: 'erreur',
          message: 'Données de trajet manquantes (transport_mode requis)',
        });
      }

      const service = new CO2Service(request.server);
      const newTrip = await service.createTrip(userId, tripData);

      return reply.status(201).send({
        statut: 'succès',
        message: 'Trajet enregistré avec succès',
        data: newTrip,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement du trajet";
      return reply.status(500).send({
        statut: 'erreur',
        message,
      });
    }
  }
}
