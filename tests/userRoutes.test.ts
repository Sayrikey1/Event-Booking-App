// tests/userRoutes.test.ts

// Import reflect-metadata first so decorators work correctly.
import "reflect-metadata";

// Force NODE_ENV to 'test' before any other imports.
process.env.NODE_ENV = "test";

import dotenv from "dotenv";
dotenv.config();

import { v4 as uuidv4 } from "uuid";
import request from "supertest";
import http from "http";
import { AppDataSource } from "../src/data-source"; // Uses the new config (loads test settings if NODE_ENV === 'test').
import app from "../src/index"; // Ensure this exports only your Express app (without auto-starting a server).

// Helper function to generate random user details.
function generateRandomUser() {
  // Generate a short unique suffix from a UUID.
  const randomSuffix = uuidv4().split("-")[0];
  return {
    first_name: "Test",
    last_name: "User",
    username: `testuser_${randomSuffix}`,
    email: `testuser_${randomSuffix}@example.com`,
    password: "TestPassword123!",
    user_type: "Basic",
  };
}

// Global variable to hold our random user details.
let randomUser = generateRandomUser();

let server: http.Server;

jest.setTimeout(90000);

beforeAll(async () => {
  try {
    // Initialize the DataSource using test configuration.
    await AppDataSource.initialize();
    console.log("Test database connected.");

    // (Optional) Query and print all table names in the public schema.
    const tables = await AppDataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log("Tables in the test database:", tables);
  } catch (error) {
    console.error("Error connecting to the test database:", error);
    throw error;
  }

  // Start an HTTP server for testing on a nonconflicting port (3001).
  server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(3001, "0.0.0.0", (err?: Error) => {
      if (err) return reject(err);
      console.log("🚀 Test server running at http://localhost:3001/");
      resolve();
    });
  });
});

afterAll(async () => {
  // Close the HTTP server.
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    console.log("Test server closed.");
  }

  // Destroy the DataSource (disconnect from the database).
  try {
    await AppDataSource.destroy();
    console.log("Test database disconnected.");
  } catch (error) {
    console.error("Error disconnecting the test database:", error);
  }
});

describe("User Routes Integration Tests", () => {
  // First, test the user creation endpoint.
  describe("POST /api/create", () => {
    it("should create a new user and return 201", async () => {
      const response = await request(app)
        .post("/api/create")
        .send(randomUser);
      
      // Adjust expectations based on your service response.
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "User created successfully");
    });
  });

  // Then, test the login endpoint using the same random user details.
  describe("POST /api/login", () => {
    it("should return 200 with valid credentials", async () => {
      const response = await request(app)
        .post("/api/login")
        .send({ email: randomUser.email, password: randomUser.password });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should return 401 with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/login")
        .send({ email: randomUser.email, password: "WrongPassword" });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid password");
    });
  });
});
