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

let organizerToken = "";
let bookingToken = "";
let organizerUserId = "";
let bookingUserId = "";
let testEventId = "";
let createdBookingIds: string[] = [];
const bookingTicketCount = 2;

let server: http.Server;

jest.setTimeout(90000);

beforeAll(async () => {
    // (Global setup should already have started DB and HTTP server; however, if not, you may initialize here.)
    try {
        // If not already initialized, initialize the DataSource.
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

    // Start an HTTP server for testing on port 3001 if not already started.
    // (If you use global setup/teardown, you may not need this code.)
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
});
