import Head from 'next/head';
import { GameSlugs } from ':constants/games';
import { useRouter } from 'next/router';
import { getGameMeta } from ':utils/games-utils';

export type GamePageProps = {
  slug: GameSlugs;
};

export const GamePage = ({ slug }: GamePageProps) => {
  const { name, description } = getGameMeta(slug);
  const router = useRouter();
  const roomId: string = router.query.roomId as string;

  return (
    <>
      <Head>
        <title>Game Hub - {name}</title>
        <meta name="description" content={description} />
      </Head>
      <main>
        <h1>This is {slug}</h1>
        <h4>Room Id: {roomId}</h4>
      </main>
    </>
  );
};
