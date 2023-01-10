import { Server } from 'socket.io';
import { GameSlugs } from ':constants/games';
import { BaseGame } from './base-game';

/**
 * Never use this class directly. Instead use the `roomManager` export
 */
export class RoomManager {
  private rooms: Record<string, BaseGame>;
  constructor() {
    this.rooms = {};
  }
  public get allRooms() {
    return Object.values(this.rooms);
  }

  public addRoom(room: BaseGame) {
    this.rooms[room.roomId] = room;
  }

  private createRoom(
    io: Server,
    roomId: string,
    gameSlug: GameSlugs
  ): BaseGame {
    // this will be replaced by a mapping of game rooms using gameSlug
    const room = new BaseGame(io, roomId, gameSlug);
    this.rooms[roomId] = room;
    return room;
  }

  private getRoom(roomId: string): BaseGame {
    const foundRoom = this.rooms[roomId];
    return foundRoom || null;
  }

  public getOrCreateRoom(
    io: Server,
    roomId: string,
    gameSlug: GameSlugs
  ): BaseGame {
    const foundRoom = this.getRoom(roomId);
    if (foundRoom) return foundRoom;
    console.log(
      `Could not find room "${gameSlug}-${roomId}", creating a new room.`
    );
    const createdRoom = this.createRoom(io, roomId, gameSlug);
    return createdRoom;
  }
}

export const roomManager = new RoomManager();
