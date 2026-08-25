import { io } from "socket.io-client";

// This file is strictly for the backend (Next.js API) to emit events to the standalone socket server.
const socketUrl = process.env.SOCKET_URL || "http://localhost:3001";

// Create a single shared instance for the Next.js API
let backendSocket: any = null;

export const getBackendSocket = () => {
  if (!backendSocket) {
    backendSocket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
    });
  }
  return backendSocket;
};

// Helper function to emit rider status changes from the API
export const emitRiderStatusChanged = (riderData: any) => {
  try {
    const socket = getBackendSocket();
    socket.emit("emit-rider-status", riderData);
  } catch (error) {
    console.error("Failed to emit rider status:", error);
  }
};

// Helper function to emit order status changes from the API
export const emitOrderStatusChanged = (orderData: any) => {
  try {
    const socket = getBackendSocket();
    socket.emit("emit-order-status", orderData);
  } catch (error) {
    console.error("Failed to emit order status:", error);
  }
};
