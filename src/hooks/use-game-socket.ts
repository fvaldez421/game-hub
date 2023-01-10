import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameSocketPayload, Player } from ':types/game-types';
import { GameSlugs } from ':constants/games';
import { CommonGameEvents } from ':constants/game-events';
import { combineSocketHandlers, makeSocketPayload } from ':utils/socket-utils';
import { useQueryRoomId } from './use-query-room-id';
import { SocketEventHandlers, useSocket } from './use-socket';

export type GameSocket = {
  socket: Socket | undefined;
  connected: boolean;
  roomJoined: boolean;
  host: Player | null;
  players: Player[];
};

export const useGameSocket = (
  gameSlug: GameSlugs,
  handlers: SocketEventHandlers,
  player: Player
): GameSocket => {
  const roomId = useQueryRoomId();
  const [roomJoined, setRoomJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [host, setHost] = useState<Player | null>(null);

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

  const gameEventsConfig = {
    ...handlers,
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
  };

  const { socket, connected } = useSocket(gameEventsConfig);

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
    host,
    players,
  };
};
