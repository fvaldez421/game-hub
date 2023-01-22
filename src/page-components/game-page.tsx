import { useState } from 'react';
import { GameSlugs } from ':constants/games';
import { CommonGameEvents, TicTacToeEvents } from ':constants/game-events';
import { GameSocketPayload, Player, RoomPlayer } from ':types/game-types';
import { getGameMetaData } from ':utils/games-utils';
import { useGameSocket } from ':hooks/use-game-socket';
import { Loader } from ':components/loader';
import { PageMeta } from ':components/page-meta';

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
  turnPlayers: RoomPlayer[]; // player
  gameMap: TicTacToeMap;
  winner: RoomPlayer | null; // player
  loser: RoomPlayer | null; // player
};

type UiHandlers = {
  [TicTacToeEvents.BlockClicked]: (block: TicTacToeBlock) => void;
};

type GameComponentProps<GameState, UiHandlers> = {
  gameState: GameState;
  uiHandlers: UiHandlers;
};

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

const ticTacToeDefaultState = {
  turnPlayers: [],
  gameMap: generateDefaultMap(),
  winner: null,
  loser: null,
};

const updateGameMap = (gameMap: TicTacToeMap, block: TicTacToeBlock) => {
  const { x, y } = block;
  gameMap[y] = [...gameMap[y]];
  gameMap[y][x] = block;
  // clone
  return JSON.parse(JSON.stringify(gameMap));
};

const TicTacToe = ({
  gameState,
  uiHandlers,
}: GameComponentProps<TicTacToeGameState, UiHandlers>) => {
  const { [TicTacToeEvents.BlockClicked]: onBlockClicked } = uiHandlers;

  return (
    <div>
      <p>Player Turn: {gameState.turnPlayers[0]?.username}</p>
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
                width: '100px',
                height: '100px',
                border: '1px solid black',
              }}
              onClick={() => onBlockClicked({ x: col.x, y: col.y })}
            >
              {col.x}, {col.y}
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

  const handleTurnPlayersChange = ({ data }: GameSocketPayload) => {
    setGameState({ ...gameState, turnPlayers: data.turnTeam.players });
  };

  const handleMapUpdate = ({ data }: GameSocketPayload) => {
    console.log('map update:', data.mapState);
    setGameState({
      ...gameState,
      gameMap: data.mapState,
    });
  };

  const socketHandlers = {
    [CommonGameEvents.RoomTurnTeamUpdate]: handleTurnPlayersChange,
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

  return {
    roomData,
    gameState,
    uiHandlers,
  };
};

export const GamePage = ({ slug }: GamePageProps) => {
  const { name, description } = getGameMetaData(slug);
  const { gameState, uiHandlers, roomData } = useTicTacToeState();
  const { connected, roomJoined, host, player, players } = roomData;
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
          <TicTacToe gameState={gameState} uiHandlers={uiHandlers} />
        </>
      ) : (
        <p>Joining room...</p>
      )}
    </div>
  );
};
