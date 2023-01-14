import { TicTacToeEvents } from ':constants/game-events';
import { GameSlugs } from ':constants/games';
import { GameSocketPayload } from ':types/game-types';
import { Server } from 'socket.io';
import { BaseGame } from './base-game';

export class TicTacToeSession extends BaseGame {
  private mapState: string[][];

  constructor(io: Server, roomId: string) {
    super(io, roomId, GameSlugs.TicTacToe);
    this.socketHandlers = {
      [TicTacToeEvents.OnBlockClicked]: this.onBlockSelected,
    };
    this.mapState = [[], [], []];
  }

  emitMapStateUpdate() {
    this.emitGameEvent(TicTacToeEvents.OnMapStateUpdate, {
      mapState: this.mapState,
    });
  }

  onBlockSelected({ data }: GameSocketPayload) {
    const { playerId, block } = data;
    const { x, y } = block;

    this.mapState[y][x] = playerId;
    this.emitGameStateUpdate();
  }
}
