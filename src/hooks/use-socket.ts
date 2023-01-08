import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

type EventHandler = (...payload: any[]) => any;

export type SocketEventHandlers = {
  [key: string]: EventHandler;
};

const fallbackOnConnect = () => {
  console.log('socket.io connected');
};

const setOnConnectHandler = (
  eventsConfig: SocketEventHandlers,
  onConnectCb: () => void
) => {
  // assign a fallback on "connect" handler
  if (!eventsConfig.connect) {
    eventsConfig.connect = fallbackOnConnect;
  }

  // stash configured on-connect
  const stashedOnConnect = eventsConfig.connect;

  eventsConfig.connect = () => {
    // call on configured on-connect
    stashedOnConnect();
    // call on-connect cb
    onConnectCb();
  };
};

const bootstrapSocket = (
  socket: Socket,
  eventsConfig: SocketEventHandlers,
  onConnectCb: () => void
) => {
  setOnConnectHandler(eventsConfig, onConnectCb);

  // assign any socket event handlers
  Object.keys(eventsConfig).forEach((eventName) =>
    socket.on(eventName, eventsConfig[eventName])
  );
};

const initSocket = async (
  socketRef: MutableRefObject<undefined | Socket>,
  eventsConfig: SocketEventHandlers,
  onConnectCb: () => void
) => {
  // inits socket env
  await fetch('/api/socket');
  // inits socket
  const socket = io();
  bootstrapSocket(socket, eventsConfig, onConnectCb);
  socketRef.current = socket;
};

export const useSocket = (eventsConfig: SocketEventHandlers) => {
  const socketRef = useRef<Socket>();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socketRef.current) {
      initSocket(socketRef, eventsConfig, () => setConnected(true));
    }
    // eslint-disable-next-line
  }, []);

  return {
    connected,
    socket: socketRef.current,
  };
};
