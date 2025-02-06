// jest.setup.ts

import { Server } from "socket.io";
import { createServer } from "http";
import app from "./src/index"; 
import { disconnectDatabase } from "./src/config/Database";
import ConnectDatabse from  "./src/config/Database"
import { clearNotificationJob } from "./src/service/MessagingService/notifications";


let server: any;
let io: Server;

beforeAll(async () => {
  jest.setTimeout(30000); // Set timeout to 30 seconds
  console.log("🔄 Setting up test environment...");

  // Start test server on a random port
  server = createServer(app);
  io = new Server(server);

  await ConnectDatabse(server, io);

  server.listen(1759, () => {
    console.log("Test server started on ephemeral port");
  });
});

afterAll(async () => {
  console.log("🛑 Closing test environment...");
  clearNotificationJob();
  server.close(async () => {
    await disconnectDatabase();
    console.log("Test server closed and database disconnected");
  });
});