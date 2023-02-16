import { useState } from 'react';
import { GameSlugs } from ':constants/games';
import { CommonGameEvents, TicTacToeEvents } from ':constants/game-events';
import { GameSocketPayload, Player, RoomPlayer } from ':types/game-types';
import { getGameMetaData } from ':utils/games-utils';
import { useGameSocket } from ':hooks/use-game-socket';
import { Loader } from ':components/loader';
import { PageMeta } from ':components/page-meta';
import { GlobalGameState } from ':lib/base-game';

export type GamePageProps = {
  slug: GameSlugs;
};

type TicTacToeBlock = {
  x: number;
  y: number;
  playerId?: string;
};

type TicTacToeMap = TicTacToeBlock[][];

type TicTacToeGameState = {
  turnPlayer: Player | null; // player
  opposingPlayer: Player | null;
  gameMap: TicTacToeMap;
  winner: RoomPlayer | null; // player
  loser: RoomPlayer | null; // player
};

type UiHandlers = {
  [TicTacToeEvents.BlockClicked]: (block: TicTacToeBlock) => void;
};

type GameComponentProps<GameState, UiHandlers> = {
  roomData: ReturnType<typeof useTicTacToeState>['roomData'];
  gameState: GameState;
  uiHandlers: UiHandlers;
};

const generateDefaultMap = () => {
  const makeBlock = (x: number, y: number) => ({ x, y });
  const map: TicTacToeMap = [[], [], []];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      map[y][x] = makeBlock(x, y);
    }
  }
  return map;
};

const ticTacToeDefaultState: TicTacToeGameState = {
  turnPlayer: null,
  opposingPlayer: null,
  gameMap: generateDefaultMap(),
  winner: null,
  loser: null,
};

const TicTacToe = ({
  roomData,
  gameState,
  uiHandlers,
}: GameComponentProps<TicTacToeGameState, UiHandlers>) => {
  const { [TicTacToeEvents.BlockClicked]: onBlockClicked } = uiHandlers;
  const { turnPlayer, opposingPlayer } = gameState;

  const handleBlockClicked = (block: TicTacToeBlock) => {
    if (roomData.globalGameStatus !== GlobalGameState.InProgress) {
      console.log(roomData.globalGameStatus);
      return;
    }
    onBlockClicked({ x: block.x, y: block.y });
  };

  return (
    <div>
      <p>Player Turn: {turnPlayer?.username}</p>
      <div id="map-container"></div>
      {gameState.gameMap.map((row, i) => (
        <div
          key={`row-${i}`}
          id={`row-${i}`}
          style={{ display: 'flex', flexDirection: 'row' }}
        >
          {row.map((col, i) => (
            <div
              key={`col-${i}`}
              id={`col-${i}`}
              style={{
                width: '200px',
                height: '200px',
                border: '1px solid black',
              }}
              onClick={() => handleBlockClicked(col)}
            >
              {col.x}, {col.y}
              {col.playerId === roomData.player?.id &&
                roomData.playerTeam?.name}
              {col.playerId === (opposingPlayer?.id || 'not found') &&
                roomData.opposingTeams?.[0]?.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const useTicTacToeState = () => {
  const [gameState, setGameState] = useState<TicTacToeGameState>(
    ticTacToeDefaultState
  );

  const handleMapUpdate = ({ data }: GameSocketPayload) => {
    setGameState({
      ...gameState,
      gameMap: data.mapState,
    });
  };

  const socketHandlers = {
    [TicTacToeEvents.OnMapStateUpdate]: handleMapUpdate,
  };

  const { socket, emitGameEvent, ...roomData } = useGameSocket(
    GameSlugs.TicTacToe,
    socketHandlers
  );

  const handleUiBlockClicked = (block: TicTacToeBlock) => {
    emitGameEvent(TicTacToeEvents.BlockClicked, block);
  };

  const uiHandlers: UiHandlers = {
    [TicTacToeEvents.BlockClicked]: handleUiBlockClicked,
  };

  console.log({ opposingTeams: roomData.opposingTeams });
  return {
    roomData,
    gameState: {
      ...gameState,
      turnPlayer: roomData.turnPlayers[0],
      opposingPlayer: roomData.opposingTeams[0]?.players?.[0] || null,
    },
    uiHandlers,
  };
};

export const GamePage = ({ slug }: GamePageProps) => {
  const { name, description } = getGameMetaData(slug);
  const { gameState, uiHandlers, roomData } = useTicTacToeState();
  const { connected, roomJoined, host, player, playerTeam, players } = roomData;
  return (
    <div>
      <PageMeta title={`Game Hub - ${name}`} description={description} />
      <h1>This is {slug}</h1>
      {connected ? <p>Socket Connected!</p> : <Loader />}
      {/* move to common game wrapper */}
      {roomJoined ? (
        <>
          {/* move to common room detail (inside game wrapper) */}
          <p>Room Host: {host?.username}</p>
          <p>Current Player: {player?.username}</p>
          <p>Players in room ({players.length}):</p>
          {players.map((player) => (
            <p key={player.id}>
              {player.username}:{player.id}
            </p>
          ))}
          <TicTacToe
            roomData={roomData}
            gameState={gameState}
            uiHandlers={uiHandlers}
          />
        </>
      ) : (
        <p>Joining room...</p>
      )}
    </div>
  );
};
