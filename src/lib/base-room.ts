import { Server, Socket } from 'socket.io';
import { GameSocketPayload, Player, RoomPlayer } from ':types/game-types';
import { CommonGameEvents } from ':constants/game-events';
import { makeSocketPayload } from ':utils/socket-utils';
import { getTimeStamp } from ':utils/time-utils';

export class BaseRoom {
  private id: string;

  private io: Server;

  protected capacity: number;

  private host: Player | null;

  protected playersMap: Record<string, RoomPlayer>;

  private sockets: Record<string, Socket>;

  protected _socketHandlers: Record<string, (...args: any[]) => void>;

  constructor(io: Server, roomId: string) {
    this.io = io;
    this.id = roomId;
    this.host = null;
    this.capacity = 8;
    this.playersMap = {};
    this.sockets = {};
    this._socketHandlers = {};
  }

  public get roomId() {
    return this.id;
  }

  public get players() {
    return Object.values(this.playersMap);
  }

  public get isEmpty() {
    return this.players.length === 0;
  }

  public get isFull() {
    return this.players.length === this.capacity;
  }

  protected get evalShouldAddPlayer() {
    let result = true;
    let reason = '';

    // max cap reached validation
    if (this.players.length >= this.capacity) {
      result = false;
      reason = 'Room capacity reached.';
    }

    return {
      result,
      reason,
    };
  }

  private makeRoomPlayer(player: Player, socketId: string): RoomPlayer {
    return {
      ...player,
      joinedTS: getTimeStamp(),
      socketId,
    };
  }

  protected emitRoomEvent(
    gameEvent: string,
    data: any,
    metadata?: Record<string, any>
  ) {
    const payload: GameSocketPayload = makeSocketPayload(data, metadata);
    this.io.sockets.in(this.roomId).emit(gameEvent, payload);
  }

  private emitPlayerJoined(player: RoomPlayer) {
    const data = {
      player,
      players: this.players,
    };
    this.emitRoomEvent(CommonGameEvents.RoomPlayerJoined, data);
  }

  private emitHostAssigned(host: RoomPlayer) {
    const data = { host };
    this.emitRoomEvent(CommonGameEvents.RoomHostAssigned, data);
  }

  private emitPlayerLeft(player: RoomPlayer) {
    const data = { player };
    this.emitRoomEvent(CommonGameEvents.RoomPlayerLeft, data);
  }

  private handlePlayerLeft(player: RoomPlayer) {
    delete this.playersMap[player.id];
    this.emitPlayerLeft(player);
  }

  private removeSocket(socketId: string) {
    delete this.sockets[socketId];
  }

  private findPlayerBySocketId(socketId: string): RoomPlayer | null {
    return this.players.find((player) => player.socketId === socketId) || null;
  }

  private handleSocketDisconnected(socketId: string) {
    console.log(`Socket ${socketId} disconnnected.`);

    const socketPlayer = this.findPlayerBySocketId(socketId);

    if (!socketPlayer) {
      console.log('could not find socket player to remove');
      return;
    }

    console.log(
      `Player: "${socketPlayer.username}" disconnected. Removing player from room ${this.id}`
    );

    this.handlePlayerLeft(socketPlayer);
    this.removeSocket(socketId);
  }

  private addSocketHandlers(socket: Socket) {
    // subscribes socket to room events
    socket.join(this.roomId);

    // list common room events here
    socket.on('disconnect', () => this.handleSocketDisconnected(socket.id));
    // this allows us to set handlers from child classes
    Object.entries(this._socketHandlers).forEach(([eventKey, handler]) => {
      socket.on(eventKey, handler);
    });
  }

  private handleHostAssigned(player: RoomPlayer) {
    this.host = player;
    this.emitHostAssigned(player);
  }

  private addPlayerToRoom(player: Player, socketId: string) {
    console.log(`Adding player: "${player.username}" to room: "${this.id}".`);
    const roomPlayer = this.makeRoomPlayer(player, socketId);
    const wasEmpty = this.isEmpty;

    // add player to players - will make this.isEmpty false
    this.playersMap[player.id] = roomPlayer;
    this.onPlayerJoined(roomPlayer);
    this.emitPlayerJoined(roomPlayer);

    // if room was empty prior to current player joining
    if (wasEmpty) {
      this.handleHostAssigned(roomPlayer);
    }
  }

  private addSocketToRoom(socket: Socket) {
    this.addSocketHandlers(socket);
    this.sockets[socket.id] = socket;
  }

  private emitRoomMetaToUser(socket: Socket) {
    const payload: GameSocketPayload = makeSocketPayload({
      host: this.host,
      players: this.players,
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
      this.addSocketToRoom(socket);
      this.addPlayerToRoom(player, socket.id);
      this.emitRoomMetaToUser(socket);
      return;
    }
    this.emitFailedToJoinRoomToUser(socket, shouldAllowPlayerToJoin.reason);
  }
  // utilities for child classes
  protected onPlayerJoined(player: RoomPlayer) {}
}
