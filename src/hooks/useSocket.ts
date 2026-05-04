import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../stores/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9100';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, setConnected, mergeProjectState, updateProjectStatus } = useStore();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // 创建连接
    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket 已连接');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket 已断开');
      setConnected(false);
    });

    socket.on('project:updated', (data: { projectId: string; updates: any }) => {
      console.log('项目更新:', data);
      mergeProjectState(data.projectId, data.updates);
    });

    socket.on('project:lost', (projectId: string) => {
      console.log('项目丢失:', projectId);
      updateProjectStatus(projectId, 'lost');
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const subscribeProject = (projectId: string) => {
    socketRef.current?.emit('subscribe:project', projectId);
  };

  const unsubscribeProject = (projectId: string) => {
    socketRef.current?.emit('unsubscribe:project', projectId);
  };

  return {
    socket: socketRef.current,
    subscribeProject,
    unsubscribeProject,
  };
}
