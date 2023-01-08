import Head from 'next/head';
import { GameSlugs } from ':constants/games';
import { getGameMeta } from ':utils/games-utils';
import { Loader } from ':components/loader';
import { useGameSocket } from ':hooks/use-game-socket';
import { Player } from ':types/game-types';

export type GamePageProps = {
  slug: GameSlugs;
};

const player: Player = {
  id: 'abcd',
  username: 'FrankyFrank',
};

export const GamePage = ({ slug }: GamePageProps) => {
  const { name, description } = getGameMeta(slug);
  const { connected, roomJoined, host, players } = useGameSocket(
    slug,
    {},
    player
  );

  return (
    <div>
      <Head>
        <title>Game Hub - {name}</title>
        <meta name="description" content={description} />
      </Head>
      <h1>This is {slug}</h1>
      {connected ? <p>Socket Connected!</p> : <Loader />}
      {roomJoined ? (
        <>
          <p>Room host: {host?.username}</p>
          <p>Players in room: {players.length}</p>
        </>
      ) : (
        <p>Joining room...</p>
      )}
    </div>
  );
};
