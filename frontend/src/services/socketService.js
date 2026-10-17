import { io } from 'socket.io-client';
import { FILE_BASE_URL } from './api';

let socket = null;

export const initSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  try {
    socket = io(FILE_BASE_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to real-time server:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from real-time server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.log('[Socket] Connection status:', error.message);
    });
  } catch (err) {
    console.log('[Socket] Socket init exception:', err.message);
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const joinComplaintRoom = (complaintId) => {
  const s = getSocket();
  if (s && complaintId) {
    s.emit('join_complaint', complaintId);
  }
};

export const leaveComplaintRoom = (complaintId) => {
  const s = getSocket();
  if (s && complaintId) {
    s.emit('leave_complaint', complaintId);
  }
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('join_user', userId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  joinComplaintRoom,
  leaveComplaintRoom,
  joinUserRoom,
  disconnectSocket,
};
