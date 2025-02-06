import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

describe("Rate Limiting", () => {
    it("should fail if too many requests are made", async () => {
        const limiter = rateLimit({
          windowMs: 10 * 60 * 1000,
          max: 5,
          message: "Too many booking attempts, try again later.",
          standardHeaders: true,
          legacyHeaders: false,
          validate: { trustProxy: false }, // Add this option
        });
    
        // Enhanced mock request
        const createMockRequest = (): Request => ({
          ip: "127.0.0.1",
          headers: {},
          socket: { remoteAddress: "127.0.0.1" }, // Add socket info
          app: { get: (key: string) => false }, // Mock Express app settings
          get: function (header: string) {
            return "";
          },
        } as unknown as Request);

    // Create a simple mock response with status() and send() spies.
    const createMockResponse = (): Response => {
      const res = {} as Response;
      res.status = jest.fn().mockReturnThis();
      res.send = jest.fn();
      return res;
    };

    const next: NextFunction = jest.fn();

    // Make 5 valid requests
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest();
      const res = createMockResponse();
      // Wrap in a promise so we can await the middleware
      await new Promise<void>((resolve) => {
        limiter(req, res, () => {
          resolve();
        });
      });
    }

    // 6th request should trigger rate limiting
    const req = createMockRequest();
    const res = createMockResponse();
    await new Promise<void>((resolve) => {
      limiter(req, res, () => {
        resolve();
      });
    });

    // Check that the response was given a 429 status with the correct message
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.send).toHaveBeenCalledWith("Too many booking attempts, try again later.");
  });
});
