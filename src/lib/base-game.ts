import { Server } from 'socket.io';
import { GameSlugs } from ':constants/games';
import { BaseRoom } from './base-room';
import { GamePlayer, RoomPlayer } from ':types/game-types';
import { getGameMetaData } from ':utils/games-utils';
import { CommonGameEvents } from ':constants/game-events';
import { PlayerTeam } from './player-team';

export enum GlobalGameState {
  Default = 'default',
  Ready = 'ready',
  InProgress = 'in-progress',
  Paused = 'paused',
  Complete = 'complete',
}

export class BaseGame extends BaseRoom {
  protected gameSlug: string;

  protected capacity: number;

  private maxTeams: number;

  private maxTeamPlayers: number;

  protected playerTeams: PlayerTeam[];

  protected teamsTurnOrder: string[];

  protected turnTeamIndex: number;

  private turnTeam: PlayerTeam;

  private showTeamNames: boolean = false;

  protected globalGameState: GlobalGameState;

  protected shouldAutoStartOnFull: boolean;

  constructor(io: Server, roomId: string, gameSlug: GameSlugs) {
    super(io, roomId);
    const gameConfig = getGameMetaData(gameSlug);
    this.gameSlug = gameSlug;
    this.maxTeamPlayers = gameConfig.maxTeamPlayers;
    this.maxTeams = gameConfig.maxPlayerTeams;
    this.capacity = gameConfig.maxTotalPlayers;
    this.showTeamNames = gameConfig.showTeamNames;
    this.shouldAutoStartOnFull = gameConfig.shouldAutoStartOnFull;

    // we have to init with default teams. There's ALWAYS at least one team...
    this.playerTeams = [];
    this.playerTeams = [];
    this.createInitialTeams(gameConfig.initialTeamsCount);
    this.turnTeam = this.playerTeams[0];
    this.teamsTurnOrder = this.playerTeams.map((team) => team.id);
    this.turnTeamIndex = 0;
    this.globalGameState = GlobalGameState.Default;
    this.emitGameStateUpdate();
    this.emitTeamsUpdate();
    this.emitTurnTeamUpdate();
  }

  get currentTurnTeam() {
    return this.turnTeam;
  }

  get nonTurnTeams() {
    return this.playerTeams.filter(
      (team) => team.id !== this.currentTurnTeam.id
    );
  }

  get currentTeamPlayers() {
    return this.turnTeam.players;
  }

  get maxTeamsCreated() {
    return this.playerTeams.length === this.maxTeams;
  }

  get isReady() {
    return this.isGameInGivenState(GlobalGameState.Ready);
  }
  get isInProgress() {
    return this.isGameInGivenState(GlobalGameState.InProgress);
  }
  get isPaused() {
    return this.isGameInGivenState(GlobalGameState.Paused);
  }
  get isComplete() {
    return this.isGameInGivenState(GlobalGameState.Complete);
  }
  get isDefaultState() {
    return this.isGameInGivenState(GlobalGameState.Default);
  }

  private isGameInGivenState(state: GlobalGameState) {
    return this.globalGameState === state;
  }

  protected set socketHandlers(
    handlers: Record<string, (...args: any[]) => void>
  ) {
    this._socketHandlers = {
      ...this._socketHandlers,
      ...handlers,
    };
  }

  protected resetGame() {
    if (this.isDefaultState) {
      return;
    }
    this.globalGameState = GlobalGameState.Default;
    this.emitGameStateUpdate();
    this.onGameReset();
  }

  protected readyGame() {
    if (this.isReady) {
      return;
    }
    this.globalGameState = GlobalGameState.Ready;
    this.emitGameStateUpdate();
    this.onGameReady();
  }

  protected startGame() {
    if (this.isInProgress) {
      return;
    }
    this.globalGameState = GlobalGameState.InProgress;
    this.emitGameStateUpdate();
    this.onGameStart();
  }

  protected pauseGame() {
    if (this.isPaused) {
      return;
    }
    this.globalGameState = GlobalGameState.Paused;
    this.emitGameStateUpdate();
    this.onGamePause();
  }

  protected endGame() {
    if (this.isComplete) {
      return;
    }
    this.globalGameState = GlobalGameState.Complete;
    this.emitGameStateUpdate();
    this.onGameComplete();
  }

  protected addNewPlayerTeam(teamName?: string) {
    const team = this.createNewPlayerTeam(teamName);
    this.playerTeams.push(team);
    this.teamsTurnOrder.push(team.id);
    return team;
  }

  protected createNewPlayerTeam(defaultTeamName?: string) {
    const teamName = this.makeNewTeamName(defaultTeamName);

    const team = new PlayerTeam(
      this.maxTeamPlayers,
      this.playerTeams.length,
      teamName
    );

    this.onTeamCreated(team);

    return team;
  }

  protected createInitialTeams(initialTeamsCount: number) {
    while (initialTeamsCount) {
      this.playerTeams.push(this.createNewPlayerTeam());
      initialTeamsCount--;
    }
  }

  protected getSmallestTeam(): PlayerTeam {
    let smallestTeam = this.playerTeams[0];

    this.playerTeams.forEach((team) => {
      if (team.totalPlayers < smallestTeam.totalPlayers) {
        smallestTeam = team;
      }
    });

    if (!smallestTeam.isFull) {
      return smallestTeam;
    }

    if (this.maxTeamsCreated) {
      console.error(`Failed to create new team.`);
      return smallestTeam;
    }

    return this.addNewPlayerTeam();
  }

  protected emitGameEvent(gameEvent: string, data: any) {
    return this.emitRoomEvent(gameEvent, data, { gameSlug: this.gameSlug });
  }

  private emitTeamsUpdate() {
    this.emitGameEvent(CommonGameEvents.RoomTeamsUpdated, {
      teams: this.playerTeams.map((team) => team.toJSON()),
      showTeamNames: this.showTeamNames,
    });
  }

  private emitTurnTeamUpdate() {
    this.emitGameEvent(CommonGameEvents.RoomTurnTeamUpdate, {
      // we have to use this.turnTeam.players bc its a getter...
      turnTeam: this.turnTeam.toJSON(),
      nonTurnTeams: this.nonTurnTeams.map((team) => team.toJSON()),
    });
  }

  protected emitGameStateUpdate() {
    this.emitGameEvent(CommonGameEvents.RoomGameStateUpdate, {
      gameState: this.globalGameState,
    });
  }

  protected onPlayerJoined(player: GamePlayer): void {
    const smallestTeam = this.getSmallestTeam();

    player.teamId = smallestTeam.id;
    player.teamName = smallestTeam.name;

    smallestTeam.addPlayer(player);

    this.emitTeamsUpdate();
    this.emitTurnTeamUpdate();

    if (this.isFull) {
      this.onGameFull();
    }

    if (this.isFull && this.shouldAutoStartOnFull) {
      console.log(`Game room is full, starting game.`);
      this.startGame();
    }

    this.onGamePlayerJoined(player);
  }

  private getNextTurnTeamIndex() {
    const maxIndex = this.teamsTurnOrder.length - 1;
    if (this.turnTeamIndex === maxIndex) {
      return 0;
    }
    return this.turnTeamIndex + 1;
  }

  private getTurnTeamByIndex(index: number) {
    const nextTeamId = this.teamsTurnOrder[index];
    return this.playerTeams.find(
      (team) => team.id === nextTeamId
    ) as PlayerTeam;
  }

  protected setNextTurnTeam() {
    const nextTeamIndex = this.getNextTurnTeamIndex();
    const nextTeam = this.getTurnTeamByIndex(nextTeamIndex);
    const prevTeam = this.currentTurnTeam;

    // we want to set all the new values in the same fn, this prevents inconsistent state
    this.turnTeamIndex = nextTeamIndex;
    this.turnTeam = nextTeam;
    this.emitTeamsUpdate();
    this.onTeamTurnsUpdated(prevTeam, nextTeam);
  }

  // util for child classes
  protected onTeamTurnsUpdated(prevTeam: PlayerTeam, nextTeam: PlayerTeam) {}
  protected onTeamCreated(playerTeam: PlayerTeam) {}
  /** This method should be used to set team names if necessary */
  protected makeNewTeamName(defaultTeamName: string = ''): string {
    return defaultTeamName;
  }
  protected onGamePlayerJoined(player: RoomPlayer) {}
  protected onGameReady() {}
  protected onGameStart() {}
  protected onGamePause() {}
  protected onGameComplete() {}
  protected onGameReset() {}
  protected onGameFull() {}
}
