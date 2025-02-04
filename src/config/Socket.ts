import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { Message } from "../entity/Message";
import ChatHandler from "../service/MessagingService/messaging";

let io: Server | null = null; // Declare io as nullable

export const IO = (server: HttpServer): Server => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT"],
      },
    });

    // SOCKET CONNECTION
    io.on("connection", (socket) => {
      socket.on("join_room", (data: Message) => {
        // console.log(data)
        socket.join(data.room_id);
        console.log(`User ${socket.id} joined room ${data.room_id}...`);
      });

      socket.on("send_message", async (data: Message) => {
        await ChatHandler(io!, data);
        console.log(
          `User ${data.sender_user_id} sent a message to ${data.room_id}... on ${socket.id}`
        );
      });

      socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
      });
    });

    console.log("Socket.io server initialized");
  }

  return io;
};
