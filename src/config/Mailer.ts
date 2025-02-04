import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface MailerOptions {
  mail: string;
  subject: string;
  text: string;
}

export const mailer = async ({ mail, subject, text }: MailerOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USERMAIL,
      pass: process.env.MAILPASS,
    },
  });

  const mailOptions = {
    from: `GreenBarter <${process.env.USERMAIL}>`,
    to: mail,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully");
  } catch (error) {
    console.error("Failed to send mail:", error);
  }
};

export default mailer;