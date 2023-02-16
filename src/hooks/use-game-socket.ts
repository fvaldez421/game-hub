import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameSocketPayload, Player } from ':types/game-types';
import { GameSlugs } from ':constants/games';
import { CommonGameEvents } from ':constants/game-events';
import { combineSocketHandlers, makeSocketPayload } from ':utils/socket-utils';
import { useQueryRoomId } from './use-query-room-id';
import { SocketEventHandlers, useSocket } from './use-socket';
import { getCachedPlayer } from ':utils/player-utils';
import { PlayerTeam } from ':lib/player-team';
import { GlobalGameState } from ':lib/base-game';

export type GameSocket = {
  socket: Socket | undefined;
  connected: boolean;
  roomJoined: boolean;
  globalGameStatus: GlobalGameState;
  host: Player | null;
  player: Player | null;
  players: Player[];
  playerTeam: PlayerTeam | null;
  opposingTeams: PlayerTeam[];
  playerTeams: PlayerTeam[];
  turnTeam: PlayerTeam | null;
  nonTurnTeams: PlayerTeam[];
  turnPlayers: Player[];
  emitGameEvent: (event: string, data: any) => void;
};

export const useGameSocket = (
  gameSlug: GameSlugs,
  handlers: SocketEventHandlers
): GameSocket => {
  const player = getCachedPlayer();
  const roomId = useQueryRoomId();
  const [roomJoined, setRoomJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerTeam, setPlayerTeam] = useState<PlayerTeam | null>(null);
  const [playerTeams, setPlayerTeams] = useState<PlayerTeam[]>([]);
  const [opposingTeams, setOpposingTeams] = useState<PlayerTeam[]>([]);
  const [turnTeam, setTurnTeam] = useState<PlayerTeam | null>(null);
  const [nonTurnTeams, setNonTurnTeams] = useState<PlayerTeam[]>([]);
  const [host, setHost] = useState<Player | null>(null);
  const [globalGameStatus, setGlobalGameStatus] = useState<GlobalGameState>(
    GlobalGameState.Default
  );

  const onRoomPlayerJoined = ({ data }: GameSocketPayload) => {
    setPlayers(data.players);
  };

  const onRoomHostAssigned = ({ data }: GameSocketPayload) => {
    setHost(data.host);
  };

  const onRoomMetadataUpdate = ({ data }: GameSocketPayload) => {
    setHost(data.host);
    setPlayers(data.players);
  };

  const onRoomTeamsUpdate = ({ data }: GameSocketPayload) => {
    const allteams: PlayerTeam[] = data.teams || [];

    const playerOpposingTeams: PlayerTeam[] = allteams.filter((team) => {
      const hasCurrentPlayer = Boolean(team.playersMap[player?.id as string]);
      if (hasCurrentPlayer) {
        setPlayerTeam(team);
      }
      return !hasCurrentPlayer;
    });
    console.log({ allteams, playerOpposingTeams });

    setOpposingTeams(playerOpposingTeams);

    setPlayerTeams(data.teams);
  };

  const onRoomTurnTeamsUpdate = ({ data }: GameSocketPayload) => {
    setTurnTeam(data.turnTeam);
    setNonTurnTeams(data.nonTurnTeams);
  };

  const onGameStateUpdate = ({ data }: GameSocketPayload) => {
    setGlobalGameStatus(data.gameState);
  };

  const gameEventsConfig = {
    ...handlers,
    [CommonGameEvents.RoomGameStateUpdate]: combineSocketHandlers(
      onGameStateUpdate,
      handlers[CommonGameEvents.RoomGameStateUpdate]
    ),
    [CommonGameEvents.RoomMetadataUpdate]: combineSocketHandlers(
      onRoomMetadataUpdate,
      handlers[CommonGameEvents.RoomMetadataUpdate]
    ),
    [CommonGameEvents.RoomHostAssigned]: combineSocketHandlers(
      onRoomHostAssigned,
      handlers[CommonGameEvents.RoomHostAssigned]
    ),
    [CommonGameEvents.RoomPlayerJoined]: combineSocketHandlers(
      onRoomPlayerJoined,
      handlers[CommonGameEvents.RoomPlayerJoined]
    ),
    [CommonGameEvents.RoomTeamsUpdated]: combineSocketHandlers(
      onRoomTeamsUpdate,
      handlers[CommonGameEvents.RoomTeamsUpdated]
    ),
    [CommonGameEvents.RoomTurnTeamUpdate]: combineSocketHandlers(
      onRoomTurnTeamsUpdate,
      handlers[CommonGameEvents.RoomTurnTeamUpdate]
    ),
  };

  const { socket, connected } = useSocket(gameEventsConfig);

  const emitGameEvent = (event: string, data: any) => {
    if (!socket) return;
    const gameSocketPayload: GameSocketPayload = makeSocketPayload(data, {
      playerId: player?.id,
    });
    socket.emit(event, gameSocketPayload);
  };

  useEffect(() => {
    if (socket && connected && !roomJoined) {
      const payload: GameSocketPayload = makeSocketPayload({
        roomId,
        gameSlug,
        player,
      });
      socket.emit(CommonGameEvents.CreateRoom, payload);
      setRoomJoined(true);
    }
    // eslint-disable-next-line
  }, [socket, connected, roomJoined, roomId]);

  return {
    socket,
    connected,
    roomJoined,
    globalGameStatus,
    host,
    player,
    players,
    playerTeam,
    opposingTeams,
    playerTeams,
    turnTeam,
    nonTurnTeams,
    turnPlayers: turnTeam?.players || [],
    emitGameEvent,
  };
};
