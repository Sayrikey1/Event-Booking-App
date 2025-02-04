// StripePaymentService.ts
import Stripe from 'stripe';
import { IPayment, IPaymentService } from 'src/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });

export class StripePaymentService implements IPaymentService {
  public async ProcessPayment(load: IPayment): Promise<any> {
    try {
      const { amount, currency, source } = load;

      const charge = await stripe.charges.create({
        amount,
        currency,
        source,
        description: 'Payment charge via Stripe',
      });

      return {
        success: true,
        provider: 'stripe',
        data: charge,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'stripe',
        status: error?.statusCode || 500,
        message: error?.message || 'Stripe payment failed',
        errorDetails: error || null,
      };
    }
  }
}
