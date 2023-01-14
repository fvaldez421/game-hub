import { useState } from 'react';
import { GameSlugs } from ':constants/games';
import { CommonGameEvents } from ':constants/game-events';
import { GameSocketPayload, Player, RoomPlayer } from ':types/game-types';
import { getGameMetaData } from ':utils/games-utils';
import { useGameSocket } from ':hooks/use-game-socket';
import { Loader } from ':components/loader';
import { PageMeta } from ':components/page-meta';

export type GamePageProps = {
  slug: GameSlugs;
};

type TicTacToeGameState = {
  turnPlayers: RoomPlayer[]; // player
  gameMap: {}[];
  winner: RoomPlayer | null; // player
  loser: RoomPlayer | null; // player
};

type GameComponentProps<GameState> = {
  gameState: GameState;
  uiHandlers: Record<string, Function>;
};

const ticTacToeDefaultState = {
  turnPlayers: [],
  gameMap: [],
  winner: null,
  loser: null,
};

const TicTacToe = ({
  gameState,
  uiHandlers,
}: GameComponentProps<TicTacToeGameState>) => {
  const {} = uiHandlers;
  console.log(gameState);
  return (
    <div>
      <p>Player Turn: {gameState.turnPlayers[0]?.username}</p>
    </div>
  );
};

const useTicTacToeState = () => {
  const [gameState, setGameState] = useState<TicTacToeGameState>(
    ticTacToeDefaultState
  );

  const handleTurnPlayersChange = ({ data }: GameSocketPayload) => {
    setGameState({ ...gameState, turnPlayers: data.turnTeam.players });
  };

  const socketHandlers = {
    [CommonGameEvents.RoomTurnTeamUpdate]: handleTurnPlayersChange,
  };

  const uiHandlers = {};

  return {
    gameState,
    socketHandlers,
    uiHandlers,
  };
};

export const GamePage = ({ slug }: GamePageProps) => {
  const { name, description } = getGameMetaData(slug);
  const { gameState, socketHandlers, uiHandlers } = useTicTacToeState();
  const { connected, roomJoined, host, players } = useGameSocket(
    slug,
    socketHandlers
  );

  return (
    <div>
      <PageMeta title={`Game Hub - ${name}`} description={description} />
      <h1>This is {slug}</h1>
      {connected ? <p>Socket Connected!</p> : <Loader />}
      {/* move to common game wrapper */}
      {roomJoined ? (
        <>
          {/* move to common room detail (inside game wrapper) */}
          <p>Room host: {host?.username}</p>
          <p>Players in room ({players.length}):</p>
          {players.map((player) => (
            <p key={player.id}>
              {player.username}:{player.id}
            </p>
          ))}
          <TicTacToe gameState={gameState} uiHandlers={uiHandlers} />
        </>
      ) : (
        <p>Joining room...</p>
      )}
    </div>
  );
};
