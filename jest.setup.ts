import dotenv from "dotenv";
dotenv.config(); // Load environment variables before anything else

import "reflect-metadata";
import { DataSource } from "typeorm";
import * as fs from "fs";
import path from "path";
import http from "http";

import app from "./src/index";

// Validate required environment variables
const requiredEnvVars = ["POSGRES_HOST", "POSGRES_PORT", "POSGRES_USERNAME", "POSGRES_PASSWORD", "POSGRES_DATABASE"];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// Configure SSL only if running in production
const isProduction = process.env.NODE_ENV === "test";
const sslConfig = isProduction
  ? {
      rejectUnauthorized: false,
      ca: fs.existsSync("./ca.pem") ? fs.readFileSync("./ca.pem").toString() : "",
    }
  : false;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSGRES_HOST,
  port: parseInt(process.env.POSGRES_PORT || "5432", 10),
  username: process.env.POSGRES_USERNAME,
  password: process.env.POSGRES_PASSWORD,
  database: process.env.POSGRES_DATABASE,
  synchronize: true,
  logging: false,
  ssl: sslConfig,
  entities: [`${__dirname}/entity/*.ts`],
  migrations: [`${__dirname}/migration/*.ts`],
  subscribers: [`${__dirname}/subscriber/*.ts`],
});

// Export server and appInstance for external access
export let server0: any;
export let appInstance: any = app;

const ConnectDatabase = async (server: any, PORT: number) => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Data Source has been initialized!");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error("❌ Error during Data Source initialization:", error);
    process.exit(1); // Exit if DB connection fails
  }
};

const disconnectDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      console.log("🔌 Data Source has been disconnected!");
    } catch (error) {
      console.error("❌ Error during Data Source disconnect:", error);
    }
  }
};

// Jest setup
beforeAll(async () => {
  jest.setTimeout(40000) //40 seconds
  server0 = http.createServer(app);
  await ConnectDatabase(server0, 3000);
});

afterAll(async () => {
  await disconnectDatabase();
  if (server0) {
    server0.close(() => {
      console.log("🛑 Server closed after tests.");
    });
  }
});
