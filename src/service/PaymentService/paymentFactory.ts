import { IPaymentService } from "src/types";
import { StripePaymentService } from "./stripePaymentService";
import { PaystackPaymentService } from "./paystackPaymentService";

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYSTACK = 'paystack',
}

export class PaymentServiceFactory {
  /**
   * Returns an instance of a payment service based on the provider.
   * @param provider Payment provider key
   */
  static getPaymentService(provider: PaymentProvider): IPaymentService {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return new StripePaymentService();
      case PaymentProvider.PAYSTACK:
        return new PaystackPaymentService();
      default:
        // Default to stripe or throw an error object.
        return new StripePaymentService();
    }
  }
}
