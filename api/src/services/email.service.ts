import { fillTemplate, sendEmail } from "@/utils/email.js";
import getRequestMeta from "@/utils/requestMeta.js";
import type { Request } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesPath = [__dirname, "..", "templates"];

export async function sendWelcomeEmail(email: string, fullname: string) {
  try {
    const templatePath = path.join(...templatesPath, "welcome-email.html");
    const template = fs.readFileSync(templatePath, "utf8");

    const html = fillTemplate(template, { USER_NAME: fullname, GET_STARTED_URL: process.env.CLIENT_URL });

    await sendEmail({
      to: email,
      subject: "Welcome to BuzzVib",
      text: `Hi ${fullname}, welcome to BuzzVib!`,
      html,
    });
  } catch (error) {
    logApiError("Failed to send welcome email:", error);
  }
}

export async function sendPasswordResetEmail(email: string, resetSecret: string) {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?secret=${resetSecret}`;
    const templatePath = path.join(...templatesPath, "reset-password.html");
    const template = fs.readFileSync(templatePath, "utf8");

    const html = fillTemplate(template, { RESET_URL: resetUrl });

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: `Reset your password using this link: ${resetUrl}`,
      html,
    });
  } catch (error) {
    logApiError("Failed to send password reset email:", error);
  }
}

export async function sendAccountNotFoundEmail(email: string) {
  try {
    const templatePath = path.join(...templatesPath, "account-not-found.html");
    const template = fs.readFileSync(templatePath, "utf8");

    const html = fillTemplate(template);

    await sendEmail({
      to: email,
      subject: "No account found",
      text: "We couldn't find an account with this email. Please check and try again.",
      html,
    });
  } catch (error) {
    logApiError("Failed to send account not found email:", error);
  }
}

export async function sendEmailVerificationEmail(email: string, otp: string) {
  const templatePath = path.join(...templatesPath, "verify-email-otp.html");
  const template = fs.readFileSync(templatePath, "utf8");

  const html = fillTemplate(template, { OTP_CODE: otp });

  try {
    await sendEmail({
      to: email,
      subject: "Your Verification Code",
      text: `Your OTP is: ${otp}. It will expire in 15 minutes.`,
      html,
    });
  } catch (error) {
    logApiError("Failed to send email verification email:", error);
  }
}

export async function sendLoginAlertEmail(email: string, req: Request) {
  const { ip, location, device } = await getRequestMeta(req);

  const loginTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    dateStyle: "medium",
    timeStyle: "short",
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password`;
  const templatePath = path.join(...templatesPath, "login-alert.html");
  const template = fs.readFileSync(templatePath, "utf8");

  const html = fillTemplate(template, {
    IP_ADDRESS: ip ?? "unknown",
    LOCATION: location ?? "unknown",
    DEVICE: device ?? "unknown",
    LOGIN_TIME: loginTime,
    RESET_URL: resetUrl,
  });

  await sendEmail({
    to: email,
    subject: "New Login Detected on Your BuzzVib Account",
    text: `A new login was detected from ${device} in ${location} at ${loginTime}. If this wasn't you, reset your password here: ${resetUrl}`,
    html,
  });
}

export async function sendPasswordChangeAlertEmail(email: string, req: Request) {
  const { ip, location, device } = await getRequestMeta(req);

  const changeTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    dateStyle: "medium",
    timeStyle: "short",
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password`;
  const templatePath = path.join(...templatesPath, "password-change-alert.html");
  const template = fs.readFileSync(templatePath, "utf8");

  const html = fillTemplate(template, {
    IP_ADDRESS: ip ?? "unknown",
    LOCATION: location ?? "unknown",
    DEVICE: device ?? "unknown",
    CHANGE_TIME: changeTime,
    RESET_URL: resetUrl,
  });

  await sendEmail({
    to: email,
    subject: "Your BuzzVib Password Was Changed",
    text: `Your password was changed from ${device} in ${location} at ${changeTime}. If this wasn't you, reset your password immediately here: ${resetUrl}`,
    html,
  });
}

export async function sendAccountDeletionEmail(email: string, fullname: string) {
  try {
    const templatePath = path.join(...templatesPath, "account-deleted.html");
    const template = fs.readFileSync(templatePath, "utf8");

    const html = fillTemplate(template, { USER_NAME: fullname, SIGNUP_URL: `${process.env.CLIENT_URL}/auth` });

    await sendEmail({
      to: email,
      subject: "We're Sad to See You Go - Account Deleted",
      text: `Hi ${fullname}, your BuzzVib account has been successfully deleted. We're sad to see you go, but you're always welcome back anytime!`,
      html,
    });
  } catch (error) {
    logApiError("Failed to send account deletion email:", error);
  }
}
