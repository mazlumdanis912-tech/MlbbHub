import { logger } from "./logger.js";

export interface Tournament {
  id: string;
  name: string;
  region: string;
  startDate: string;
  endDate: string;
  prizePool: string;
}

export class MobileLegendsApp {
  async fetchTournamentInfo(): Promise<Tournament[]> {
    try {
      // Mock tournament data - replace with actual Liquipedia API call
      const tournaments: Tournament[] = [
        {
          id: "mpl-2024",
          name: "Mobile Legends Pro League 2024",
          region: "Global",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          prizePool: "$1,000,000",
        },
      ];

      logger.info({ count: tournaments.length }, "Tournaments fetched successfully");
      return tournaments;
    } catch (error) {
      logger.error({ error }, "Failed to fetch tournaments");
      throw error;
    }
  }
}
