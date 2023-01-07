export enum GameSlugs {
  TicTacToe = 'tic-tac-toe',
}

export type GameMeta = {
  name: string;
  description: string;
};

export const GAMES_META_MAP: { [key in GameSlugs]: GameMeta } = {
  [GameSlugs.TicTacToe]: {
    name: 'Tic Tac Toe',
    description: 'A simple game of tic tac toe.',
  },
};

export const GAMES_KEYS_LIST: GameSlugs[] = Object.values(GameSlugs);
