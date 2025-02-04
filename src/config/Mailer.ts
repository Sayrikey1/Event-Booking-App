import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface Attachment {
  filename: string;
  // You can use either a path or content:
  path?: string;      // Path to the file on disk
  content?: string | Buffer; // Direct content of the file
}

interface MailerOptions {
  mail: string;
  subject: string;
  text: string;
  attachments?: Attachment[];
}

export const mailer = async ({
  mail,
  subject,
  text,
  attachments,
}: MailerOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USERMAIL,
      pass: process.env.MAILPASS,
    },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: `GreenBarter <${process.env.USERMAIL}>`,
    to: mail,
    subject: subject,
    text: text,
    attachments: attachments, // Include attachments if provided
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully");
  } catch (error) {
    console.error("Failed to send mail:", error);
  }
};

export default mailer;
