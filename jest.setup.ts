import 'ts-node/register';
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

import "reflect-metadata"; // Must be at the very top!
import { DataSource } from "typeorm";
import fs from "fs";
import { ENV } from './env';

export const AppDataSource = new DataSource({
  type: "postgres",
  host: ENV.POSTGRES_HOST,
  port: parseInt(ENV.POSTGRES_PORT, 10),
  username: ENV.POSTGRES_USERNAME,
  password: ENV.POSTGRES_PASSWORD,
  database: ENV.POSTGRES_DATABASE,
  synchronize: true,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.existsSync("./ca.pem") ? fs.readFileSync("./ca.pem").toString() : "",
  },
  entities: [__dirname + "/src/entity/**/*.ts"],
  migrations: [__dirname + "/src/migration/**/*.ts"],
  subscribers: [__dirname + "/src/subscriber/**/*.ts"],
});


export const ConnectDatabase = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("✅ Data Source initialized!");
    console.log("Loaded entities:", AppDataSource.entityMetadatas.map(e => e.name));
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