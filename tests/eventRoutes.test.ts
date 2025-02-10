// tests/eventRoutes.test.ts
import "reflect-metadata";
process.env.NODE_ENV = "test";
import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import http from "http";
import app from "../src/index";
import { generateRandomEvent, generateRandomUser } from "./helpers";
import AppDataSource from "../src/data-source";


let testUser = generateRandomUser();
let userToken = "";
let testUserId = ""; // Will store the test user's id from login
let createdEventId = "";

let server: http.Server;

jest.setTimeout(90000);

beforeAll(async () => {
  try {
    // Initialize the DataSource.
    await AppDataSource.initialize();
    console.log("Test database connected.");

    // (Optional) Print table names.
    const tables = await AppDataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log("Tables in the test database:", tables);
  } catch (error) {
    console.error("Error connecting to the test database:", error);
    throw error;
  }

  // Start an HTTP server for testing on port 3001.
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
  // Destroy the DataSource connection.
  try {
    await AppDataSource.destroy();
    console.log("Test database disconnected.");
  } catch (error) {
    console.error("Error disconnecting the test database:", error);
  }
});

describe("Event Routes Integration Tests", () => {
    beforeAll(async () => {
      // Create a test user via the /api/create endpoint.
      const createUserResponse = await request(app)
        .post("/api/create")
        .send(testUser);
      expect(createUserResponse.status).toBe(201);
  
      // Log in with the test user via the /api/login endpoint to obtain a JWT token and user id.
      const loginResponse = await request(app)
        .post("/api/login")
        .send({ email: testUser.email, password: testUser.password });
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty("token");
      userToken = loginResponse.body.token;
      testUserId = loginResponse.body.id;
    });
  
    // 1. Create a new event.
    describe("POST /api/event/create", () => {
      it("should create a new event", async () => {
        const eventData = generateRandomEvent();
        const response = await request(app)
          .post("/api/event/create")
          .set("Authorization", `Bearer ${userToken}`)
          .send(eventData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("message", "Event created successfully");
        expect(response.body).toHaveProperty("id");
        createdEventId = response.body.id;
      });
    });
  
    // 2. Retrieve a single event.
    describe("GET /api/event/:id", () => {
      it("should retrieve the created event with the correct owner", async () => {
        const response = await request(app)
          .get(`/api/event/${createdEventId}`)
          .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        // Expect an "event" object in the response.
        expect(response.body).toHaveProperty("event");
        expect(response.body.event).toHaveProperty("id", createdEventId);
        // Verify that the event's owner matches the test user.
        expect(response.body.event.user).toHaveProperty("id", testUserId);
        expect(response.body.event.user).toHaveProperty("email", testUser.email);
      });
    });
  
    // 3. Retrieve all events.
    describe("GET /api/event", () => {
      it("should retrieve all events and include the created event", async () => {
        const response = await request(app)
          .get("/api/event")
          .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("events");
        const events = response.body.events;
        expect(Array.isArray(events)).toBe(true);
        const found = events.find((e: any) => e.id === createdEventId);
        expect(found).toBeDefined();
      });
    });
  
    // 4. Update the event.
    describe("PATCH /api/event/update", () => {
      it("should update the event details", async () => {
        const updatedData = {
          id: createdEventId,
          date: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days in the future
          totalTickets: 15,
          ticket_price: 60.0,
        };
        const response = await request(app)
          .patch("/api/event/update")
          .set("Authorization", `Bearer ${userToken}`)
          .send(updatedData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "Event updated successfully");
      });
    });
  
    // 5. Delete the event.
    describe("DELETE /api/event/delete/:id", () => {
      it("should delete the event", async () => {
        const response = await request(app)
          .delete(`/api/event/delete/${createdEventId}`)
          .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "Event deleted successfully");
      });
  
      it("should return 404 when retrieving the deleted event", async () => {
        const response = await request(app)
          .get(`/api/event/${createdEventId}`)
          .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message", "Event not found");
      });
    });
  });