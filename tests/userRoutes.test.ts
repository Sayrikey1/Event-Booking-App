// tests/userRoutes.ts

import request from "supertest";
import { appInstance as app } from "../jest.setup";  

describe("User Routes Integration Tests", () => {
  let server: any;

  beforeAll(async () => {
    jest.setTimeout(30000); // Set timeout to 30 seconds
    server = app.listen(3000, () => {
      console.log("Test server started on ephemeral port");
    });
  });

  afterAll(async () => {
    server.close(() => {
      console.log("Test server closed and database disconnected");
    });
  });

  describe('POST /api/login', () => {
    it('should return 200 with valid credentials', async () => {
      // Arrange: Use valid credentials that are known to exist in your test data.
      const loginData = { email: 'test@example.com', password: 'password' };

      // Act: Call the endpoint.
      const response = await request(app)
        .post('/api/login')
        .send(loginData);

      // Assert: Check that the response is 200 and that the returned JSON contains the expected values.
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('message');
      // Optionally, check for a token or user id if your implementation returns those.
    });

    it('should handle invalid credentials', async () => {
      // Arrange: Use credentials that are not valid.
      const loginData = { email: 'nonexistent@example.com', password: 'wrongPassword' };

      // Act:
      const response = await request(app)
        .post('/api/login')
        .send(loginData);

      // Assert: Expect a 404 (or your implementation’s error code for user not found)
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('POST /api/create', () => {
    it('should create a user successfully', async () => {
      // Arrange: Provide a new user’s data.
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password',
        user_type: 'Basic'
      };

      // Act:
      const response = await request(app)
        .post('/api/create')
        .send(userData);

      // Assert: Check for a 201 Created status and the expected response body.
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created successfully');
      // You may also check for additional properties in the response, if any.
    });
  });

  // Optionally add tests for other endpoints (e.g., GET /api/user, DELETE /api/delete/:id, etc.)
});