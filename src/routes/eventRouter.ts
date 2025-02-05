import express from 'express';
import { EventController } from '../controller/eventController';
import TokenVerification from '../middlewares/TokenVerification';
import IsOwner from '../middlewares/IsOwner';

const eventRouter = express.Router();
const eventController = new EventController();

/**
 * @openapi
 * /api/event/create:
 *   post:
 *     summary: Create a new event
 *     tags:
 *       - Event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the event.
 *                 example: "Annual Concert"
 *               description:
 *                 type: string
 *                 description: A detailed description of the event.
 *                 example: "A live performance event featuring multiple artists."
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time of the event.
 *                 example: "2025-12-31T20:00:00Z"
 *               location:
 *                 type: string
 *                 description: The location where the event will take place.
 *                 example: "Tafawa Balewa Square, Lagos, Nigeria"
 *               totalTickets:
 *                 type: number
 *                 description: The total number of tickets available for the event.
 *                 example: 500
 *               ticket_price:
 *                 type: number
 *                 description: The price for each ticket.
 *                 example: 99.99
 *               duration:
 *                 type: number
 *                 description: The duration of the event in hours.
 *                 example: 3
 *             required:
 *               - name
 *               - description
 *               - date
 *               - location
 *               - totalTickets
 *               - ticket_price
 *               - duration
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Event created successfully"
 *       400:
 *         description: Bad Request
 */
eventRouter.post("/api/event/create", TokenVerification, eventController.CreateEvent);



/**
 * @openapi
 * /api/event/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags:
 *       - Event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event found
 *       404:
 *         description: Event not found
 */
eventRouter.get("/api/event/:id", TokenVerification, eventController.GetEvent);

/**
 * @openapi
 * /api/event:
 *   get:
 *     summary: Get all events
 *     tags:
 *       - Event
 *     responses:
 *       200:
 *         description: Events found
 */
eventRouter.get("/api/event", TokenVerification, eventController.GetAllEvents);

/**
 * @openapi
 * /api/event/update:
 *   patch:
 *     summary: Update an event
 *     tags:
 *       - Event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The unique identifier of the event to update
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: The new date of the event
 *               totalTickets:
 *                 type: integer
 *                 description: The updated total number of tickets available
 *               ticket_price:
 *                 type: number
 *                 description: The new price per ticket
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Bad Request
 */
eventRouter.patch("/api/event/update", TokenVerification, IsOwner, eventController.UpdateEvent);

/**
 * @openapi
 * /api/event/delete/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     tags:
 *       - Event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 */
eventRouter.delete("/api/event/delete/:id", TokenVerification, IsOwner, eventController.DeleteEvent);

export default eventRouter;