export enum GameSlugs {
  TicTacToe = 'tic-tac-toe',
}

export type CommonGameMeta = {
  name: string;
  description: string;
  initialTeamsCount: number;
  maxTeamPlayers: number;
  maxTotalPlayers: number;
  maxPlayerTeams: number;
  showTeamNames: boolean;
};

export const GAMES_META_MAP: { [key in GameSlugs]: CommonGameMeta } = {
  [GameSlugs.TicTacToe]: {
    name: 'Tic Tac Toe',
    description: 'A simple game of tic tac toe.',
    initialTeamsCount: 2,
    maxTeamPlayers: 1,
    maxTotalPlayers: 2,
    maxPlayerTeams: 2,
    showTeamNames: false,
  },
};

export const GAMES_KEYS_LIST: GameSlugs[] = Object.values(GameSlugs);
