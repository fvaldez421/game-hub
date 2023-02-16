import { v4 as uuidV4 } from 'uuid';
import { RoomPlayer } from ':types/game-types';

export class PlayerTeam {
  public id: string;

  private capacity: number;

  public name: string;

  public playersMap: Record<string, RoomPlayer>;

  constructor(capacity: number, existingTeamsCount: number, name?: string) {
    this.id = uuidV4();
    this.capacity = capacity;
    this.name = name || PlayerTeam.getFallbackTeamName(existingTeamsCount);
    this.playersMap = {};
  }

  static getFallbackTeamName(existingTeamsCount: number) {
    const teamNumber = existingTeamsCount + 1;
    return `Unnamed team ${teamNumber} `;
  }

  get players() {
    return Object.values(this.playersMap);
  }

  get totalPlayers() {
    return Object.keys(this.playersMap).length;
  }

  get isFull() {
    return this.players.length === this.capacity;
  }

  addPlayer(player: RoomPlayer) {
    if (this.isFull) return false;

    this.playersMap[player.id] = player;
    return true;
  }

  toJSON() {
    return {
      ...this,
      players: this.players,
    };
  }
}
