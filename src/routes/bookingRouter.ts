import express from 'express';
import { BookingController } from '../controller/bookingController';
import TokenVerification from '../middlewares/TokenVerification';

const bookingRouter = express.Router();
const bookingController = new BookingController();

/**
 * @openapi
 * /api/booking/create:
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_id:
 *                 type: string
 *               ticket_count:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Bad Request
 */
bookingRouter.post("/api/booking/create", TokenVerification, bookingController.CreateBooking);

/**
 * @openapi
 * /api/booking/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags:
 *       - Booking
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking found
 *       404:
 *         description: Booking not found
 */
bookingRouter.get("/api/booking/:id", TokenVerification, bookingController.GetBooking);

/**
 * @openapi
 * /api/booking:
 *   get:
 *     summary: Get all bookings
 *     tags:
 *       - Booking
 *     responses:
 *       200:
 *         description: Bookings found
 */
bookingRouter.get("/api/booking", TokenVerification, bookingController.GetAllBookings);

/**
 * @openapi
 * /api/booking/delete/{id}:
 *   delete:
 *     summary: Delete a booking by ID
 *     tags:
 *       - Booking
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 */
bookingRouter.delete("/api/booking/delete/:id", TokenVerification, bookingController.DeleteBooking);

/**
 * @openapi
 * /api/booking/delete-all/{event_id}:
 *   delete:
 *     summary: Delete all bookings for a specific event
 *     tags:
 *       - Booking
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All bookings for the event deleted successfully
 *       404:
 *         description: Event not found
 */
bookingRouter.delete("/api/booking/delete-all/:event_id", TokenVerification, bookingController.DeleteAllBookings);

export default bookingRouter;
