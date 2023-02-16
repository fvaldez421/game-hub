import { TicTacToeEvents } from ':constants/game-events';
import { GameSlugs } from ':constants/games';
import { GameSocketPayload } from ':types/game-types';
import { Server } from 'socket.io';
import { BaseGame } from './base-game';

// this is redundant, already exists in game-page
type TicTacToeBlock = {
  x: number;
  y: number;
  playerId?: string;
};

type TicTacToeMap = TicTacToeBlock[][];

const generateDefaultMap = () => {
  const makeBlock = (x: number, y: number) => ({ x, y });
  const map: TicTacToeMap = [[], [], []];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      map[row][col] = makeBlock(col, row);
    }
  }
  return map;
};
// end redundant code

export class TicTacToeSession extends BaseGame {
  private mapState: TicTacToeMap;

  constructor(io: Server, roomId: string) {
    super(io, roomId, GameSlugs.TicTacToe);

    // we have to bind handlers here...
    this.onBlockSelected = this.onBlockSelected.bind(this);

    this.mapState = generateDefaultMap();
    this.socketHandlers = {
      [TicTacToeEvents.BlockClicked]: this.onBlockSelected,
    };
  }

  protected makeNewTeamName(): string {
    return this.playerTeams.length === 0 ? 'X' : 'O';
  }

  emitMapStateUpdate() {
    this.emitGameEvent(TicTacToeEvents.OnMapStateUpdate, {
      mapState: this.mapState,
    });
  }

  onBlockSelected({ data, playerId }: GameSocketPayload) {
    const { x, y } = data;

    this.mapState[y][x] = { ...data, playerId };
    this.emitGameStateUpdate();
    this.emitMapStateUpdate();
    // this.setNextTurnTeam();
  }
}
