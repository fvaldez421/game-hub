import { Games, GAMES_KEYS_LIST } from ':constants/games';
import { GamePageProps } from ':page-components/game-page';
import {
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from 'next';

export { GamePage as default } from ':page-components/game-page';

const staticGamePaths = GAMES_KEYS_LIST.map((slug) => ({
  params: { slug },
}));

export function getStaticPaths(): GetStaticPathsResult {
  return {
    paths: staticGamePaths,
    fallback: true,
  };
}

export function getStaticProps(
  context: GetStaticPropsContext
): GetStaticPropsResult<GamePageProps> {
  const { slug } = context.params || {};
  const gameSlug: Games = slug as Games;

  return {
    props: {
      slug: gameSlug,
    },
  };
}
