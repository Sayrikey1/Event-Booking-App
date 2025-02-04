import { Request, Response } from "express";
import stripe from "stripe";
import { Payment } from "src/entity/Payment";
import AppDataSource from "src/data-source";
import crypto from "crypto";
import axios from "axios";

const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia",
});

/**
 * Stripe Webhook Controller
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("✅ Stripe Payment Succeeded:", paymentIntent.id);

      // Store payment info in DB
      const payment = new Payment();
      payment.transactionId = paymentIntent.id;
      payment.provider = "stripe";
      payment.amount = paymentIntent.amount;
      payment.currency = paymentIntent.currency;
      payment.status = "succeeded";

      await AppDataSource.manager.save(payment);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Stripe Webhook Error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
};

/**
 * Paystack Webhook Controller
 */
export const paystackWebhook = async (req: Request, res: Response) => {
  const secret = process.env.PAYSTACK_SECRET_KEY as string;

  // Verify Paystack webhook signature
  const hash = req.headers["x-paystack-signature"];
  const computedHash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== computedHash) {
    return res.status(401).json({ error: "Unauthorized request" });
  }

  const event = req.body;
  if (event.event === "charge.success") {
    const { reference, amount, currency, status } = event.data;

    console.log("✅ Paystack Payment Succeeded:", reference);

    // Store payment info in DB
    const payment = new Payment();
    payment.transactionId = reference;
    payment.provider = "paystack";
    payment.amount = amount;
    payment.currency = currency;
    payment.status = status;

    await AppDataSource.manager.save(payment);
  }

  return res.status(200).json({ received: true });
};
