import "reflect-metadata";
process.env.NODE_ENV = "test";
import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import http from "http";
import app from "../src/index";
import { generateRandomUser, generateRandomEvent } from "./helpers";
import { AppDataSource } from "../src/data-source";

//
// Global variables for test users, event, and booking details
//
let organizerUser = generateRandomUser();
let bookingUser = generateRandomUser();
let waitlisterUser = generateRandomUser();

let organizerToken = "";
let bookingToken = "";
let waitlisterToken = "";
let organizerUserId = "";
let bookingUserId = "";
let waitlisterUserId = "";
let testEventId = "";
let createdBookingIds: string[] = [];
const bookingTicketCount = 2;

let server: http.Server;

jest.setTimeout(90000);

beforeAll(async () => {
  // Initialize the database if needed.
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Test database connected.");
      const tables = await AppDataSource.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      console.log("Tables in the test database:", tables);
    }
  } catch (error) {
    console.error("Error initializing test database:", error);
    throw error;
  }

  // Start the HTTP server for testing.
  server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(3001, "0.0.0.0", (err?: Error) => {
      if (err) return reject(err);
      console.log("🚀 Test server running at http://localhost:3001/");
      resolve();
    });
  });

  // --- Create event organizer user ---
  const orgCreateResp = await request(app)
    .post("/api/create")
    .send(organizerUser);
  expect(orgCreateResp.status).toBe(201);

  const orgLoginResp = await request(app)
    .post("/api/login")
    .send({ email: organizerUser.email, password: organizerUser.password });
  expect(orgLoginResp.status).toBe(200);
  expect(orgLoginResp.body).toHaveProperty("token");
  organizerToken = orgLoginResp.body.token;
  organizerUserId = orgLoginResp.body.id;

  // --- Create an event with the organizer ---
  const eventData = generateRandomEvent();
  const eventCreateResp = await request(app)
    .post("/api/event/create")
    .set("Authorization", `Bearer ${organizerToken}`)
    .send(eventData);
  expect(eventCreateResp.status).toBe(201);
  expect(eventCreateResp.body).toHaveProperty("message", "Event created successfully");
  expect(eventCreateResp.body).toHaveProperty("id");
  testEventId = eventCreateResp.body.id;

  // --- Create booking user ---
  const bookCreateResp = await request(app)
    .post("/api/create")
    .send(bookingUser);
  expect(bookCreateResp.status).toBe(201);

  const bookLoginResp = await request(app)
    .post("/api/login")
    .send({ email: bookingUser.email, password: bookingUser.password });
  expect(bookLoginResp.status).toBe(200);
  expect(bookLoginResp.body).toHaveProperty("token");
  bookingToken = bookLoginResp.body.token;
  bookingUserId = bookLoginResp.body.id;

  // --- Create waitlister user ---
  const waitlistCreateResp = await request(app)
    .post("/api/create")
    .send(waitlisterUser);
  expect(waitlistCreateResp.status).toBe(201);

  const waitlistLoginResp = await request(app)
    .post("/api/login")
    .send({ email: waitlisterUser.email, password: waitlisterUser.password });
  expect(waitlistLoginResp.status).toBe(200);
  expect(waitlistLoginResp.body).toHaveProperty("token");
  waitlisterToken = waitlistLoginResp.body.token;
  waitlisterUserId = waitlistLoginResp.body.id;
});

afterAll(async () => {
  // Close the HTTP server.
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    console.log("Test server closed.");
  }
  // Disconnect the database.
  try {
    await AppDataSource.destroy();
    console.log("Test database disconnected.");
  } catch (error) {
    console.error("Error disconnecting the test database:", error);
  }
});

describe("Booking Routes Integration Tests", () => {
  // 1. Create a booking.
  describe("POST /api/booking/create", () => {
    it("should create a booking for the test event", async () => {
      const bookingData = {
        event_id: testEventId,
        ticket_count: bookingTicketCount,
      };
      const response = await request(app)
        .post("/api/booking/create")
        .set("Authorization", `Bearer ${bookingToken}`)
        .send(bookingData);
      // Expect a 201 status if full assignment occurs.
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Booking created successfully");
      expect(response.body).toHaveProperty("id");
      // Assume booking creation returns an array of ticket IDs.
      createdBookingIds = response.body.id;
      expect(Array.isArray(createdBookingIds)).toBe(true);
      expect(createdBookingIds.length).toBe(bookingTicketCount);
    });
  });

  // 2. Retrieve a single booking.
  describe("GET /api/booking/:id", () => {
    it("should retrieve the created booking (ticket) by ID", async () => {
      const ticketId = createdBookingIds[0];
      const response = await request(app)
        .get(`/api/booking/${ticketId}`)
        .set("Authorization", `Bearer ${bookingToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Ticket found");
      expect(response.body).toHaveProperty("id", ticketId);
    });
  });

  // 3. Get a user bookings.
  describe("GET /api/booking", () => {
    it("should retreive all of a users bookings", async () => {
      const response = await request(app)
        .get(`/api/booking`)
        .set("Authorization", `Bearer ${bookingToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Tickets found");
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });
  });
});

describe("Waiting List and Reassignment Tests", () => {
  let waitingTestEventId: string;
  let confirmedTicketId: string; // bookingUser's confirmed ticket for the limited event

  it("should create a new event with limited tickets for waiting list testing", async () => {
    // Override totalTickets to 1 to force a waiting list scenario.
    const eventData = {
      ...generateRandomEvent(),
      totalTickets: 1,
    };
    const response = await request(app)
      .post("/api/event/create")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(eventData);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    waitingTestEventId = response.body.id;
  });

  it("should allow bookingUser to book the only available ticket", async () => {
    const bookingData = {
      event_id: waitingTestEventId,
      ticket_count: 1,
    };
    const response = await request(app)
      .post("/api/booking/create")
      .set("Authorization", `Bearer ${bookingToken}`)
      .send(bookingData);
    // Since one ticket is available, a full assignment occurs.
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Booking created successfully");
    expect(response.body).toHaveProperty("id");
    const ticketIds: string[] = response.body.id;
    expect(Array.isArray(ticketIds)).toBe(true);
    expect(ticketIds.length).toBe(1);
    confirmedTicketId = ticketIds[0];
  });

  it("should add waitlisterUser to the waiting list when no tickets are available", async () => {
    const bookingData = {
      event_id: waitingTestEventId,
      ticket_count: 1,
    };
    const response = await request(app)
      .post("/api/booking/create")
      .set("Authorization", `Bearer ${waitlisterToken}`)
      .send(bookingData);
    // With zero available tickets, the waitlister is added to the waiting list.
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Tickets are not available. You have been added to the waiting list"
    );
  });

  it("should reassign a freed ticket to waitlisterUser when bookingUser cancels their booking", async () => {
    // Delete the confirmed ticket booked by bookingUser.
    const deleteResponse = await request(app)
      .delete(`/api/booking/delete/${confirmedTicketId}`)
      .set("Authorization", `Bearer ${bookingToken}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toHaveProperty(
      "message",
      "Ticket deleted successfully and waiting list users notified"
    );

    // After deletion, waitlisterUser should receive a confirmed ticket from the waiting list.
    const getResponse = await request(app)
      .get("/api/booking")
      .set("Authorization", `Bearer ${waitlisterToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("message", "Tickets found");
    // Verify that one of the tickets belongs to the waitingTestEventId.
    const tickets = getResponse.body.bookings;
    expect(Array.isArray(tickets)).toBe(true);
    const assignedTicket = tickets.find(
      (ticket: any) => ticket.event && ticket.event.id === waitingTestEventId
    );
    expect(assignedTicket).toBeDefined();
  });
});
