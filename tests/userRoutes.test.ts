// tests/userRoutes.test.ts

// Ensure reflect-metadata is imported first.
import "reflect-metadata";

// Force NODE_ENV to 'test' before any other imports.
process.env.NODE_ENV = "test";

import dotenv from "dotenv";
dotenv.config();

import { v4 as uuidv4 } from "uuid";
import request from "supertest";
import http from "http";
import { AppDataSource } from "../src/data-source"; // This will load test DB settings when NODE_ENV==='test'
import app from "../src/index"; // This file should export only your Express app (without auto-starting a server)

// For OTP retrieval, import Otp and OtpType
import { Otp, OtpType } from "../src/entity/Otp";
// For retrieving reset token, import User
import { User } from "../src/entity/User";

// Helper function to generate random user details.
function generateRandomUser() {
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

// Global variables to hold generated details and credentials.
let randomUser = generateRandomUser();
let createdUserId: string = "";
let authToken: string = "";
let otpCode: string = "";
let resetToken: string = "";
const newPassword = "NewTestPassword123!";

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

describe("User Routes Integration Tests", () => {
  // 1. Create a new user.
  describe("POST /api/create", () => {
    it("should create a new user and return 201", async () => {
      const response = await request(app)
        .post("/api/create")
        .send(randomUser);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "User created successfully");
    });
  });

  // 2. Login with valid credentials and with an invalid password.
  describe("POST /api/login", () => {
    it("should return 200 with valid credentials and provide a token", async () => {
      const response = await request(app)
        .post("/api/login")
        .send({ email: randomUser.email, password: randomUser.password });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      createdUserId = response.body.id;
      authToken = response.body.token;
    });

    it("should return 401 with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/login")
        .send({ email: randomUser.email, password: "WrongPassword" });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid password");
    });
  });

  // 3. OTP functionality.
  describe("OTP Functionality", () => {
    it("should resend OTP for the user", async () => {
      const response = await request(app)
        .post("/api/resend-otp")
        .send({ email: randomUser.email });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "OTP resent successfully");
    });

    it("should retrieve the OTP from the database", async () => {
      const otpRepo = AppDataSource.getRepository(Otp);
      const otpRecord = await otpRepo.findOne({
        where: {
          user: { email: randomUser.email },
          otp_type: OtpType.UserVerification, // using the enum value
          is_used: false,
        },
      });
      expect(otpRecord).toBeDefined();
      otpCode = otpRecord!.otp_code;
      expect(otpCode).toBeDefined();
    });

    it("should verify the OTP for the user", async () => {
      const response = await request(app)
        .post("/api/verify-otp")
        .send({ email: randomUser.email, otp: otpCode });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "OTP verified successfully");
    });
  });

  // 4. Get current authorized user.
  describe("GET /api/user", () => {
    it("should return the current user details with is_verified true", async () => {
      const response = await request(app)
        .get("/api/user")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      // Assuming the controller returns user details under a property (e.g., 'user' or 'message').
      const userData = response.body.message || response.body.user;
      expect(userData).toHaveProperty("email", randomUser.email);
      expect(userData).toHaveProperty("is_verified", true);
    });
  });

  // 5. Get all users.
  describe("GET /api/users", () => {
    it("should retrieve all users and include the created user", async () => {
      const response = await request(app)
        .get("/api/users");
      expect(response.status).toBe(200);
      const users = response.body.message;
      expect(Array.isArray(users)).toBe(true);
      const found = users.find((u: any) => u.email === randomUser.email);
      expect(found).toBeDefined();
    });
  });

  // 6. Update the user.
  describe("PATCH /api/update", () => {
    it("should update user details", async () => {
      const updatedData = {
        id: createdUserId,
        username: "UpdatedUser",
      };
      const response = await request(app)
        .patch("/api/update")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updatedData);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "User updated successfully");
    });

    it("should reflect the updated details when retrieving the current user", async () => {
      const response = await request(app)
        .get("/api/user")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      const userData = response.body.message || response.body.user;
      expect(userData).toHaveProperty("username", "UpdatedUser");
    });
  });

  // 7. Password reset.
  describe("Password Reset Flow", () => {
    it("should send a password reset email", async () => {
      const response = await request(app)
        .post("/api/forget-password")
        .send({ email: randomUser.email });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Password reset email sent successfully");
    });

    it("should retrieve the password reset token from the database", async () => {
      const userRepo = AppDataSource.getRepository(User);
      const userRecord = await userRepo.findOne({ where: { email: randomUser.email } });
      expect(userRecord).toBeDefined();
      resetToken = userRecord!.resetToken as string;
      expect(resetToken).toBeDefined();
    });

    it("should reset the user's password", async () => {
      const response = await request(app)
        .post("/api/reset-password")
        .send({ token: resetToken, password: newPassword });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Password reset successfully");
    });

    it("should allow login with the new password", async () => {
      const response = await request(app)
        .post("/api/login")
        .send({ email: randomUser.email, password: newPassword });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      // Optionally update authToken if needed.
      authToken = response.body.token;
    });
  });

  // 8. Delete the user.
  describe("DELETE /api/delete/:id", () => {
    it("should delete the user", async () => {
      const response = await request(app)
        .delete(`/api/delete/${createdUserId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "User deleted successfully");
    });

    it("should return 404 when retrieving the deleted user", async () => {
      const response = await request(app)
        .get("/api/user")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "User not found");
    });
  });
});
