import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({ from: `${process.env.SMTP_FROM || process.env.SMTP_USER}`, to, subject, text, html });
}

export function fillTemplate(template: string, variables?: Record<string, string>): string {
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Object.entries(variables ?? {}).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{${escapeRegExp(key)}}}`, "g"), value),
    template
  );
}
