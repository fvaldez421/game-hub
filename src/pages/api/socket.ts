import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';
import { CommonGameEvents } from ':constants/game-events';
import { roomManager } from ':lib/room-manager';

const routeHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(400).json({ message: 'Method not allowed' });
  }
  // @ts-ignore
  if (!res.socket?.server?.io) {
    // @ts-ignore
    const io = new Server(res.socket?.server);
    // @ts-ignore
    res.socket.server.io = io;

    io.sockets.on('connection', (socket) => {
      socket.on(
        CommonGameEvents.CreateRoom,
        function handleSocketCreateOrJoinRoom({
          data: { roomId, gameSlug, player },
        }) {
          const room = roomManager.getOrCreateRoom(io, roomId, gameSlug);
          room.addSocketAndPlayerToRoom(socket, player);
        }
      );
    });
  }
  res.end();
};

export default routeHandler;
