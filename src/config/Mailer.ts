import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";

dotenv.config();

// Fix for __dirname in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

interface Attachment {
  filename: string;
  path?: string;
  content?: string | Buffer;
  cid?: string;
}

interface MailerOptions {
  mail: string;
  subject: string;
  text?: string; // Optional plain text fallback
  template?: string; // Name of the template file (without .html)
  templateData?: Record<string, any>; // Dynamic values for template placeholders
  attachments?: Attachment[];
}

export const mailer = async ({
  mail,
  subject,
  text,
  template,
  templateData = {},
  attachments,
}: MailerOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USERMAIL,
      pass: process.env.MAILPASS,
    },
  });

  let htmlTemplate: string | undefined;

  // Load and compile template if provided
  if (template) {
    // const templatePath = path.join(__dirname, "src", "templates", `${template}.html`);
    const templatePath = path.join(__dirname, "..", "templates", `${template}.html`);
    console.log(`Decoded path for mailer templates:`, templatePath);

    if (fs.existsSync(templatePath)) {
      const templateSource = fs.readFileSync(templatePath, "utf8");
      // Compile using Handlebars to process loops and conditionals
      const compiledTemplate = Handlebars.compile(templateSource);
      htmlTemplate = compiledTemplate(templateData);
    } else {
      console.warn(`Email template "${template}" not found. Falling back to plain text.`);
    }
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: `Event-Booking-App <${process.env.USERMAIL}>`,
    to: mail,
    subject: subject,
    text: text || "No content provided", // Fallback text if no template is found
    html: htmlTemplate || undefined, // Use HTML only if a valid template exists
    attachments: attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully");
  } catch (error) {
    console.error("Failed to send mail:", error);
  }
};

export default mailer;
