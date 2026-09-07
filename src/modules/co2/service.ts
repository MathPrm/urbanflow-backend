import { FastifyInstance } from 'fastify';

export interface TripRecord {
  id: string;
  user_id: string;
  transport_mode: string;
  distance_km: number;
  co2_saved_kg: number;
  from_label: string;
  to_label: string;
  created_at: string;
}

export interface CO2ImpactResult {
  totalCO2: number;
  efficiencyPercentage: number;
  history: TripRecord[];
  transportDistribution: Record<string, number>;
}

export interface CreateTripDTO {
  transport_mode: string;
  distance_km: number;
  co2_saved_kg: number;
  from_label?: string;
  to_label?: string;
}

export class CO2Service {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  async getCO2Impact(userId: string): Promise<CO2ImpactResult> {
    const targetUserId = String(userId);
    const emptyResult: CO2ImpactResult = {
      totalCO2: 0,
      efficiencyPercentage: 0,
      history: [],
      transportDistribution: {
        bike: 0,
        metro: 0,
        tram: 0,
        walking: 0,
        bus: 0,
      },
    };

    if (!this.fastify.pg) {
      return emptyResult;
    }

    let client;
    try {
      client = await this.fastify.pg.connect();
    } catch {
      return emptyResult;
    }

    try {
      // Auto-création de la table si nécessaire
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_trips (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255) NOT NULL,
            transport_mode VARCHAR(50) NOT NULL,
            distance_km DECIMAL(10, 2) NOT NULL,
            co2_saved_kg DECIMAL(10, 3) NOT NULL,
            from_label VARCHAR(255) DEFAULT 'Départ',
            to_label VARCHAR(255) DEFAULT 'Arrivée',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 1. Calcul du total CO2 économisé et de la distance totale en km pour l'utilisateur
      const totalResult = await client.query(
        `SELECT COALESCE(SUM(co2_saved_kg), 0) AS total_co2, 
                COALESCE(SUM(distance_km), 0) AS total_distance 
         FROM user_trips WHERE user_id = $1`,
        [targetUserId]
      );
      const totalCO2 = parseFloat(totalResult.rows[0]?.total_co2 || '0');
      const totalDistanceKm = parseFloat(totalResult.rows[0]?.total_distance || '0');

      // 2. Historique des derniers trajets exclusifs à cet utilisateur
      const historyResult = await client.query(
        `SELECT id, user_id, transport_mode, 
                CAST(distance_km AS FLOAT) as distance_km, 
                CAST(co2_saved_kg AS FLOAT) as co2_saved_kg, 
                from_label, to_label, created_at 
         FROM user_trips 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [targetUserId]
      );
      const history: TripRecord[] = historyResult.rows || [];

      // 3. Calcul dynamique du pourcentage d'efficacité carbone (par rapport à la baseline ADEME ~0.20 kg/km voiture solo)
      let efficiencyPercentage = 0;
      if (totalDistanceKm > 0 && totalCO2 > 0) {
        const carTheoreticalEmissions = totalDistanceKm * 0.20;
        efficiencyPercentage = carTheoreticalEmissions > 0
          ? Math.min(100, Math.round((totalCO2 / carTheoreticalEmissions) * 100))
          : 85;
      }

      // 4. Répartition par mode de transport pour cet utilisateur
      const modeResult = await client.query(
        `SELECT transport_mode, COALESCE(SUM(co2_saved_kg), 0) AS mode_co2 
         FROM user_trips 
         WHERE user_id = $1 
         GROUP BY transport_mode`,
        [targetUserId]
      );

      const transportDistribution: Record<string, number> = {
        bike: 0,
        metro: 0,
        tram: 0,
        walking: 0,
        bus: 0,
      };

      if (totalCO2 > 0) {
        modeResult.rows.forEach((row: { transport_mode: string; mode_co2: string }) => {
          const modeKg = parseFloat(row.mode_co2 || '0');
          const pct = Math.round((modeKg / totalCO2) * 1000) / 10;
          transportDistribution[row.transport_mode] = pct;
        });
      }

      return {
        totalCO2: Math.round(totalCO2 * 100) / 100,
        efficiencyPercentage,
        history,
        transportDistribution,
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, "Erreur lors de la récupération de l'impact CO2");
      return emptyResult;
    } finally {
      if (client) client.release();
    }
  }

  async createTrip(userId: string, tripData: CreateTripDTO): Promise<TripRecord> {
    const targetUserId = String(userId);
    const fallbackTrip: TripRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'trip-' + Date.now(),
      user_id: targetUserId,
      transport_mode: tripData.transport_mode || 'walking',
      distance_km: Number(tripData.distance_km) || 0,
      co2_saved_kg: Number(tripData.co2_saved_kg) || 0,
      from_label: tripData.from_label || 'Hôtel de Ville',
      to_label: tripData.to_label || 'Louvre',
      created_at: new Date().toISOString(),
    };

    if (!this.fastify.pg) {
      return fallbackTrip;
    }

    let client;
    try {
      client = await this.fastify.pg.connect();

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_trips (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255) NOT NULL,
            transport_mode VARCHAR(50) NOT NULL,
            distance_km DECIMAL(10, 2) NOT NULL,
            co2_saved_kg DECIMAL(10, 3) NOT NULL,
            from_label VARCHAR(255) DEFAULT 'Départ',
            to_label VARCHAR(255) DEFAULT 'Arrivée',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const query = `
        INSERT INTO user_trips (user_id, transport_mode, distance_km, co2_saved_kg, from_label, to_label, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id, user_id, transport_mode, 
                  CAST(distance_km AS FLOAT) as distance_km, 
                  CAST(co2_saved_kg AS FLOAT) as co2_saved_kg, 
                  from_label, to_label, created_at
      `;
      const result = await client.query(query, [
        targetUserId,
        fallbackTrip.transport_mode,
        fallbackTrip.distance_km,
        fallbackTrip.co2_saved_kg,
        fallbackTrip.from_label,
        fallbackTrip.to_label,
      ]);

      if (result.rows[0]) {
        return result.rows[0];
      }
      return fallbackTrip;
    } catch (error) {
      this.fastify.log.error({ err: error }, "Erreur lors de l'insertion du trajet");
      return fallbackTrip;
    } finally {
      if (client) client.release();
    }
  }
}
