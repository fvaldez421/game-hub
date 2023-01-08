import { Server, Socket } from 'socket.io';
import { GameSocketPayload, Player, RoomPlayer } from ':types/game-types';
import { CommonGameEvents } from ':constants/game-events';
import { makeSocketPayload } from ':utils/socket-utils';
import { getTimeStamp } from ':utils/time-utils';
import { GameSlugs } from ':constants/games';

export class BaseRoom {
  private id: string;

  private io: Server;

  private capacity: number;

  private gameSlug: GameSlugs;

  private host: Player | null;

  private players: Record<string, RoomPlayer>;

  private sockets: Socket[];

  constructor(io: Server, roomId: string, gameSlug: GameSlugs) {
    this.io = io;
    this.id = roomId;
    this.gameSlug = gameSlug;
    this.host = null;
    this.capacity = 2;
    this.players = {};
    this.sockets = [];
  }

  public get roomId() {
    return this.id;
  }

  public get allPlayers() {
    return Object.values(this.players);
  }

  public get isEmpty() {
    return this.allPlayers.length === 0;
  }

  public get evalShouldAddPlayer() {
    let result = true;
    let reason = '';

    // max cap reached validation
    if (this.allPlayers.length >= this.capacity) {
      result = false;
      reason = 'Room capacity reached.';
    }
    // add other validations here

    return {
      result,
      reason,
    };
  }

  private emitRoomEvent(gameEvent: string, data: any) {
    const payload: GameSocketPayload = makeSocketPayload(data);
    this.io.sockets.in(this.roomId).emit(gameEvent, payload);
  }

  private emitPlayerJoined(player: RoomPlayer) {
    const data = {
      player,
      players: this.allPlayers,
    };
    this.emitRoomEvent(CommonGameEvents.RoomPlayerJoined, data);
  }

  private emitHostAssigned(host: RoomPlayer) {
    const data = { host };
    this.emitRoomEvent(CommonGameEvents.RoomHostAssigned, data);
  }

  private addSocketHandlers(socket: Socket) {
    // subscribes socket to room events
    socket.join(this.roomId);

    // list common room events here
    socket.on('disconnect', () => {
      console.log('socket disconnected');
    });
  }

  private handleHostAssigned(player: RoomPlayer) {
    this.host = player;
    this.emitHostAssigned(player);
  }

  private addPlayerToRoom(player: Player) {
    const roomPlayer = { ...player, joinedTS: getTimeStamp() };
    const wasEmpty = this.isEmpty;

    this.players[player.id] = roomPlayer;
    this.emitPlayerJoined(roomPlayer);
    // if room was empty prior to current player joining
    if (wasEmpty) {
      this.handleHostAssigned(roomPlayer);
    }
  }

  private addSocketToRoom(socket: Socket) {
    this.addSocketHandlers(socket);
    this.sockets.push(socket);
  }

  private emitRoomMetaToUser(socket: Socket) {
    const payload: GameSocketPayload = makeSocketPayload({
      host: this.host,
      players: this.allPlayers,
      gameSlug: this.gameSlug,
    });
    socket.emit(CommonGameEvents.RoomMetadataUpdate, payload);
  }

  private emitFailedToJoinRoomToUser(socket: Socket, reason: string) {
    const payload: GameSocketPayload = makeSocketPayload({
      reason,
    });
    socket.emit(CommonGameEvents.RoomFailedToJoin, payload);
  }

  public addSocketAndPlayerToRoom(socket: Socket, player: Player) {
    const shouldAllowPlayerToJoin = this.evalShouldAddPlayer;
    // if room can add player, add them and subscribe their socket
    if (shouldAllowPlayerToJoin.result) {
      this.addPlayerToRoom(player);
      this.addSocketToRoom(socket);
      this.emitRoomMetaToUser(socket);
      return;
    }
    this.emitFailedToJoinRoomToUser(socket, shouldAllowPlayerToJoin.reason);
  }
}
