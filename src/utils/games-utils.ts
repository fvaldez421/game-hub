import { GameSlugs, GAMES_META_MAP } from ':constants/games';

export const getGameMetaData = (gameSlug: GameSlugs) => {
  return GAMES_META_MAP[gameSlug];
};
