import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  // password: process.env.REDIS_PASSWORD, // Use only if Redis is password-protected
});

// Handle Redis connection events
redisClient.on("connect", () => console.log("Connected to Redis!"));
redisClient.on("error", (err:any) => console.error("Redis error:", err));



export default redisClient;




