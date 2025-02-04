import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

interface SMSOptions {
  body: string;
  from?: string;
  to: string;
}

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

/**
 * Send an SMS using Twilio
 * @param options - Object containing SMS details (body, to, and optional from)
 * @returns Promise resolving to Twilio message response
 */
export const send_sms = async (options: SMSOptions): Promise<any> => {
  try {
    if (!options.to || !options.body) {
      throw new Error("Recipient number and message body are required.");
    }

    const message = await twilioClient.messages.create({
      body: options.body,
      from: options.from || process.env.TWILIO_PHONE_NUMBER, // Use default sender if not provided
      to: options.to,
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error: any) {
    console.error("❌ SMS Sending Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
