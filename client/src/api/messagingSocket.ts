import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './index';

let socket: Socket | null = null;

export const connectMessagingSocket = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
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
