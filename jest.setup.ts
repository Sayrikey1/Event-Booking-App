import 'ts-node/register';
import dotenv from "dotenv";
dotenv.config(); // Load environment variables before anything else

import "reflect-metadata"; // Must be at the very top!
import { DataSource } from "typeorm";
import * as fs from "fs";
import http from "http";
import path from "path";
import glob from "glob";


import app from "./src/index";
import { User } from "./src/entity/User";
import { Event } from "./src/entity/Event";
import { Message } from "./src/entity/Message";
import { Otp } from "./src/entity/Otp";
import { Payment } from "./src/entity/Payment";
import { Ticket } from "./src/entity/Ticket";
import { WaitingList } from "./src/entity/WaitingList";

const entityPattern = path.resolve(__dirname, "src", "entity", "*.ts");
const entityFiles = glob.sync(entityPattern);
console.log("Entity files loaded:", entityFiles);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSGRES_HOST,
  port: parseInt(process.env.POSGRES_PORT || "5432", 10),
  username: process.env.POSGRES_USERNAME,
  password: process.env.POSGRES_PASSWORD,
  database: process.env.POSGRES_DATABASE,
  synchronize: true,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.existsSync("./ca.pem") ? fs.readFileSync("./ca.pem").toString() : "",
  },
  entities: [User, Event, Message, Otp, Payment, Ticket, WaitingList],
  migrations: [path.resolve(__dirname, "src", "migration", "*.ts")],
  subscribers: [path.resolve(__dirname, "src", "subscriber", "*.ts")],
});

jest.setTimeout(60000);

const requiredEnvVars = [
  "POSGRES_HOST", "POSGRES_PORT", "POSGRES_USERNAME", "POSGRES_PASSWORD", "POSGRES_DATABASE"
];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});


export const ConnectDatabase = async (server: any, PORT: number) => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Data Source initialized!");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error("❌ Data Source initialization error:", error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      console.log("🔌 Data Source disconnected!");
    } catch (error) {
      console.error("❌ Error disconnecting Data Source:", error);
    }
  }
};



