import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

export const ENV = {
  POSTGRES_TYPE: process.env.POSTGRES_TYPE || "postgres",
  POSTGRES_HOST: process.env.POSTGRES_HOST || "",
  POSTGRES_PORT: process.env.POSTGRES_PORT || "5432",
  POSTGRES_USERNAME: process.env.POSTGRES_USERNAME || "",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "",
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || "",
};

// Ensure all required environment variables are set
const requiredEnvVars = [
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USERNAME",
  "POSTGRES_PASSWORD",
  "POSTGRES_DATABASE",
];

requiredEnvVars.forEach((key) => {
  if (!ENV[key as keyof typeof ENV]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});

