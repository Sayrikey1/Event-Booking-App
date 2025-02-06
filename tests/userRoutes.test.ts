import request from "supertest";
import http from "http";
import { ConnectDatabase, disconnectDatabase } from "../jest.setup";
import app from "../src/index";

let server: http.Server;

jest.setTimeout(60000);

beforeAll(async () => {
  await ConnectDatabase();
  server = http.createServer(app);
  server.listen(3000, "0.0.0.0", () => {
    console.log("🚀 Server running at http://localhost:3000/");
  });
});

afterAll(async () => {
  await disconnectDatabase();
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log("🛑 Server closed after tests.");
        resolve();
      });
    });
  }
});

describe("User Routes Integration Tests", () => {
  describe("POST /api/login", () => {
    it("should return 200 with valid credentials", async () => {
      const response = await request(app)
        .post("/api/login")
        .send({ email: "essenapp1@gmail.com", password: "SecurePass123!" });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should return 401 for invalid credentials", async () => {
      const response = await request(app)
        .post("/api/login")
        .send({ email: "wrongemail@gmail.com", password: "WrongPass123!" });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });
  });

  describe("POST /api/create", () => {
    it("should create a new user and return 201", async () => {
      const newUser = {
        first_name: "Neymar",
        last_name: "Da Silva",
        username: "NEY-Jr",
        email: "neymar@gmail.com",
        password: "SecurePass123!",
        user_type: "Basic"
      };

      const response = await request(app)
        .post("/api/create")
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email", newUser.email);
    });
  });
});

