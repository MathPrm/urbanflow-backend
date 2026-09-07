export class ItinaryService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.IDF_MOBILITES_API_KEY || '';
    this.baseUrl = process.env.IDF_MOBILITES_BASE_URL || 'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia';
  }

  /**
   * Appelle l'API PRIM pour calculer un itinéraire entre deux points.
   * @param from Coordonnées de départ (ex: "2.3386,48.8576" pour le Louvre)
   * @param to Coordonnées d'arrivée
   */
  async searchItinary(from: string, to: string) {
    if (!this.apiKey || this.apiKey === 'ta_cle_api_secrete_ici') {
      throw new Error("Clé API IDF Mobilités manquante ou invalide");
    }

    const formattedFrom = from.replace(',', ';');
    const formattedTo = to.replace(',', ';');

    const url = new URL(`${this.baseUrl}/journeys`);
    url.searchParams.append('from', formattedFrom);
    url.searchParams.append('to', formattedTo);
    url.searchParams.append('apikey', this.apiKey);

    const finalUrl = url.toString();

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Erreur API externe: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Appelle l'API PRIM pour chercher un lieu (gare, adresse, point d'intérêt).
   * @param query Le texte tapé par l'utilisateur (ex: "Châtelet")
   */
  async searchPlaces(query: string) {
    if (!this.apiKey || this.apiKey === 'ta_cle_api_secrete_ici') {
      throw new Error("Clé API IDF Mobilités manquante ou invalide");
    }

    const url = new URL(`${this.baseUrl}/places`);
    url.searchParams.append('q', query);
    url.searchParams.append('apikey', this.apiKey);

    const finalUrl = url.toString();

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Erreur API externe: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      throw error;
    }
  }
}