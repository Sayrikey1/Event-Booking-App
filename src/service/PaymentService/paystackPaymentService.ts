// PaystackPaymentService.ts
import axios from 'axios';
import { IPayment, IPaymentService } from 'src/types';

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY as string;
const paystackBaseUrl = 'https://api.paystack.co';


export class PaystackPaymentService implements IPaymentService {
    async ProcessPayment(load:IPayment): Promise<any> {
        try {
      // Extract amount, source, and currency from load
      const { amount, source, currency } = load;

      // Paystack requires amount to be in kobo (if currency is NGN) so adjust as needed.
      // Here we assume that the amount is passed in the smallest unit.
      const response = await axios.post(
        `${paystackBaseUrl}/transaction/initialize`,
        {
          amount,
          email: source, // For Paystack, the "source" might be a customer email or token.
          currency,
          reference: `ps_${Date.now()}`, // Unique reference for this transaction.
        },
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return {
        success: true,
        provider: 'paystack',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'paystack',
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Paystack payment failed',
      };
    }
  }
}
