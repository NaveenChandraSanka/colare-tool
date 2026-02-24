import { Resend } from "resend";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface ConfirmationData {
  attendeeName: string;
  attendeeEmail: string;
  eventName: string;
  eventDate: string;
  companyName: string;
  personalizedSubject?: string;
}

export async function sendConfirmation(
  data: ConfirmationData
): Promise<string | null> {
  const subject =
    data.personalizedSubject ||
    `Registration confirmed: ${data.eventName}`;

  if (!resend || !env.RESEND_FROM_EMAIL) {
    logger.info("Resend not configured, skipping confirmation email");
    return null;
  }

  const { data: result, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: data.attendeeEmail,
    subject,
    html: buildConfirmationHtml(data),
  });

  if (error) {
    logger.error({ err: error, to: data.attendeeEmail }, "Resend send failed");
    throw new Error(`Resend error: ${error.message}`);
  }

  logger.info(
    { emailId: result?.id, to: data.attendeeEmail },
    "Confirmation email sent"
  );
  return result?.id ?? null;
}

function buildConfirmationHtml(data: ConfirmationData): string {
  const formattedDate = new Date(data.eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">You're Registered!</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi ${data.attendeeName},</p>
    <p>Thank you for registering for <strong>${data.eventName}</strong>. We're excited to have you!</p>
    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666; font-weight: bold;">Event</td>
        <td style="padding: 8px 0;">${data.eventName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666; font-weight: bold;">Date</td>
        <td style="padding: 8px 0;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666; font-weight: bold;">Hosted by</td>
        <td style="padding: 8px 0;">${data.companyName}</td>
      </tr>
    </table>
    <p>We'll send you more details as the event approaches. Stay tuned!</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center;">
      This email was sent by ${data.companyName}.<br/>
      If you did not register for this event, please disregard this message.
    </p>
  </div>
</body>
</html>`;
}
