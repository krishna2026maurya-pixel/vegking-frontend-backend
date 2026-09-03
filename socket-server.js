const { Server } = require("socket.io");
const http = require("http");

// Create a standalone HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.io Server is running.");
});

// Initialize Socket.IO on top of the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend URL
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("⚡ Client connected to Socket.IO:", socket.id);

  // Allow clients to join specific rooms to listen for targeted events
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("leave-room", (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
  });

  // --- INTERNAL API EVENT FORWARDING ---
  socket.on("emit-new-order", (data) => {
    io.emit("new-order", data);
    if (data.vendor_id) {
      io.to(`vendor_${data.vendor_id}`).emit("new-order", data);
    }
    console.log("📢 Broadcasted new order event:", data?.order_number || data?._id);
  });

  socket.on("emit-rider-status", (data) => {
    io.to("admin").emit("rider-status-changed", data);
    console.log("Broadcasted rider status change:", data);
  });

  socket.on("emit-order-status", (data) => {
    if (data.order_id) {
      io.to(`order_${data.order_id}`).emit("order-status-changed", data);
    }
    io.to("admin").emit("order-status-changed", data);
    console.log("Broadcasted order status change:", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO standalone server running on http://localhost:${PORT}`);
});
