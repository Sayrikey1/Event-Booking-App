import { Server } from "socket.io";

let intervalId: NodeJS.Timeout;

export const Notification = (io: Server) => {
  console.log("Notifications job is initialized");

  intervalId = setInterval(() => {
    io.emit("open_notification", "Heyyyyyyoooo world!");
  }, 60000);

  io.on("connection", (socket) => {
    console.log("Socket.io server initialized");

    socket.on("disconnect", () => {
      console.log("Socket.io closed");
    });
  });
};

export const clearNotificationJob = () => {
  clearInterval(intervalId);
};