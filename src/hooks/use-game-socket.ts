import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameSocketPayload, Player } from ':types/game-types';
import { GameSlugs } from ':constants/games';
import { CommonGameEvents } from ':constants/game-events';
import { makeSocketPayload } from ':utils/socket-utils';
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
  eventsConfig: SocketEventHandlers,
  player: Player
): GameSocket => {
  const roomId = useQueryRoomId();
  const [roomJoined, setRoomJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [host, setHost] = useState<Player | null>(null);

  const onRoomPlayerJoined = ({ data }: GameSocketPayload) => {
    setPlayers(data.players);
    console.log(`Room player joined: ${data.player?.username}`);
  };

  const onRoomHostAssigned = ({ data }: GameSocketPayload) => {
    setHost(data.host);
    console.log(`Room host assigned: ${data.player?.username}`);
  };

  const onRoomMetadataUpdate = ({ data }: GameSocketPayload) => {
    setHost(data.host);
    setPlayers(data.players);
    console.log(`Room metadata update:`, data);
  };

  const gameEventsConfig = {
    ...eventsConfig,
    [CommonGameEvents.RoomMetadataUpdate]: onRoomMetadataUpdate,
    [CommonGameEvents.RoomHostAssigned]: onRoomHostAssigned,
    [CommonGameEvents.RoomPlayerJoined]: onRoomPlayerJoined,
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
