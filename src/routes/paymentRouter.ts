import express from "express";
import { stripeWebhook, paystackWebhook } from "../controllers/paymentController";

const router = express.Router();

/**
 * @openapi
 * '/api/webhook/stripe':
 *  post:
 *     tags:
 *     - Webhooks
 *     summary: Stripe webhook to handle payment events
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              event:
 *                type: string
 *                description: Stripe event type
 *              data:
 *                type: object
 *                description: Event payload
 *     responses:
 *      200:
 *        description: Webhook received successfully
 *      400:
 *        description: Invalid request
 */
router.post("/api/webhook/stripe", express.raw({ type: "application/json" }), stripeWebhook);

/**
 * @openapi
 * '/api/webhook/paystack':
 *  post:
 *     tags:
 *     - Webhooks
 *     summary: Paystack webhook to handle payment events
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              event:
 *                type: string
 *                description: Paystack event type
 *              data:
 *                type: object
 *                description: Event payload
 *     responses:
 *      200:
 *        description: Webhook received successfully
 *      400:
 *        description: Invalid request
 */
router.post("/api/webhook/paystack", express.json(), paystackWebhook);

export default router;
