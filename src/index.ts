// src/index.ts
import "reflect-metadata";

// Core modules
import fs from "fs";
import http from "http";
import https from "https";

// Third-party modules
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

// Configurations
import swaggerconfig from "./config/SwaggerUiDocs";
import ConnectDatabse from "./config/Database";
import upload from "./config/Multer";
import { IO } from "./config/Socket";

// Middleware
import { encryptionMiddleware } from "./middlewares/Encryption";

// Services
import NotificationJob from "./service/MessagingService/Index";
import encryptionRouter from "./routes/encryptionRouter";

// Routes
import userRouter from "./routes/userRouter";
import eventRouter from "./routes/eventRouter";
import bookingRouter from "./routes/bookingRouter";
import rateLimit from "express-rate-limit";
import paymentRouter from "./routes/paymentRouter";



//---------------------CONFIGURE SERVER WITH NO CERTIFICATE FOR HTTP AND CERTIFICATE FOR HTTPS
const sslOptions = {
  pfx: fs.readFileSync("test_cert.pfx"),
  passphrase: "sample",
};
const app = express();
const server = http.createServer(app);
const httpsserver = https.createServer(sslOptions, app);

//-------------------- SET UP THE MIDDLEWARE PLUS INITIALIZE SOCKET IO

const io = IO(server);
const allowedDomains = ["*", "http://localhost", "https://localhost", "https://greenbarter-backend.onrender.com"];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedDomains.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: "GET,POST,PUT,DELETE,OPTIONS",
//   credentials: true, // If using cookies or authorization headers
// }));
app.use(cors())
app.use(express.json());
app.use(upload.any());



//------------------ SET UP ROUTES
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerconfig);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerconfig));

// Routes that should bypass encryptionMiddleware
app.use("/", encryptionRouter);

// Apply encryptionMiddleware for all other routes, excluding the encryptionRouter
app.use((req: Request, res: Response, next: NextFunction) => {
  const excludedRoutes = ["/api/encrypt", "/api/decrypt"]; // Add routes handled by encryptionRouter
  if (excludedRoutes.some((route) => req.path.startsWith(route))) {
    return next(); // Skip encryptionMiddleware for excluded routes
  }
  encryptionMiddleware(req, res, next); // Apply encryptionMiddleware to other routes
});

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, 
  message: "Too many booking attempts, try again later."
});

// Remaining routes
app.use("/", userRouter);
app.use("/", eventRouter);
app.use("/", bookingRouter, limiter);
app.use("/", paymentRouter);


// -------------- SETUP DATABASE CONNECTION AND MAKE SERVER LISTEN
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HTTPS_PORT: number = process.env.HTTPS_PORT
  ? parseInt(process.env.HTTPS_PORT, 10)
  : 5100;

const uri: string = process.env.DB_URI ? process.env.DB_URI : "";

// if (process.env.NODE_ENV !== 'test'){
//   ConnectDatabse(server, httpsserver, PORT, HTTPS_PORT, uri);
//   NotificationJob(io);
// }


ConnectDatabse(server, httpsserver, PORT, HTTPS_PORT, uri);
NotificationJob(io);


export default app