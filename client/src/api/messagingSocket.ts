import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectMessagingSocket = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io('/', {
    transports: ['websocket'],
    auth: {
      token,
    },
  });

  return socket;
};

export const getMessagingSocket = () => socket;

export const disconnectMessagingSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
