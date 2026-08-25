import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Ensure this matches where your socket server is running
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const useSocket = (room?: string) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
      });
    }

    const onConnect = () => {
      setIsConnected(true);
      if (room) {
        socket?.emit("join-room", room);
      }
    };

    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // If already connected, manual trigger
    if (socket.connected) {
      onConnect();
    }

    return () => {
      if (room && socket) {
        socket.emit("leave-room", room);
      }
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
    };
  }, [room]);

  return { socket, isConnected };
};
