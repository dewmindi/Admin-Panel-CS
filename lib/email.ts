import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // If no SMTP configuration, fallback to console log
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log("[Email Stub]", {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 100),
    })
    return true
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

export function otpEmailTemplate(otp: string): string {
  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #0a0a0f; border-radius: 12px; padding: 40px; color: #fafafa;">
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #fafafa;">CS Graphic Meta</h2>
        <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 14px;">Admin Login Verification</p>
        <div style="background: #18181b; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 13px;">Your verification code</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #fafafa; font-family: monospace;">${otp}</p>
        </div>
        <p style="margin: 0; color: #71717a; font-size: 12px;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
      </div>
    </div>
  `
}

export function orderStatusEmailTemplate(
  customerName: string,
  orderId: string,
  status: string,
  message?: string
): string {
  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    "in-progress": "#3b82f6",
    completed: "#22c55e",
    cancelled: "#ef4444",
  }
  const color = statusColors[status] || "#a1a1aa"

  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #0a0a0f; border-radius: 12px; padding: 40px; color: #fafafa;">
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #fafafa;">CS Graphic Meta</h2>
        <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 14px;">Order Status Update</p>
        <p style="margin: 0 0 16px; color: #d4d4d8;">Hi ${customerName},</p>
        <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 13px;">Order #${orderId}</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600;">
            Status: <span style="color: ${color}; text-transform: capitalize;">${status.replace("-", " ")}</span>
          </p>
        </div>
        ${message ? `<p style="margin: 0 0 20px; color: #d4d4d8; font-size: 14px;">${message}</p>` : ""}
        <p style="margin: 0; color: #71717a; font-size: 12px;">Thank you for choosing CS Graphic Meta.</p>
      </div>
    </div>
  `
}

export function hostingRenewalEmailTemplate(
  customerName: string,
  domain: string,
  renewalDate: string,
  plan: string
): string {
  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #0a0a0f; border-radius: 12px; padding: 40px; color: #fafafa;">
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #fafafa;">CS Graphic Meta</h2>
        <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 14px;">Hosting Renewal Reminder</p>
        <p style="margin: 0 0 16px; color: #d4d4d8;">Hi ${customerName},</p>
        <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 14px;">Your hosting plan is due for renewal soon.</p>
        <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Domain</td>
              <td style="padding: 8px 0; color: #fafafa; font-size: 13px; text-align: right;">${domain}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Plan</td>
              <td style="padding: 8px 0; color: #fafafa; font-size: 13px; text-align: right;">${plan}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px;">Renewal Date</td>
              <td style="padding: 8px 0; color: #f59e0b; font-size: 13px; font-weight: 600; text-align: right;">${renewalDate}</td>
            </tr>
          </table>
        </div>
        <p style="margin: 0; color: #71717a; font-size: 12px;">Please contact us if you have any questions about your renewal.</p>
      </div>
    </div>
  `
}

export function invoiceEmailTemplate(
  customerName: string,
  invoiceNumber: string,
  items: Array<{ description: string; amount: number }>,
  total: number
): string {
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; color: #d4d4d8; font-size: 13px; border-bottom: 1px solid #27272a;">${item.description}</td>
      <td style="padding: 12px 0; color: #fafafa; font-size: 13px; text-align: right; border-bottom: 1px solid #27272a;">$${item.amount.toFixed(2)}</td>
    </tr>
  `
    )
    .join("")

  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #0a0a0f; border-radius: 12px; padding: 40px; color: #fafafa;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #fafafa;">CS Graphic Meta</h2>
          <span style="color: #a1a1aa; font-size: 14px;">Invoice #${invoiceNumber}</span>
        </div>
        <p style="margin: 0 0 24px; color: #d4d4d8;">Hi ${customerName},</p>
        <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; text-align: left; border-bottom: 1px solid #27272a;">Description</th>
              <th style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; text-align: right; border-bottom: 1px solid #27272a;">Amount</th>
            </tr>
            ${itemRows}
            <tr>
              <td style="padding: 16px 0 0; color: #fafafa; font-size: 14px; font-weight: 600;">Total</td>
              <td style="padding: 16px 0 0; color: #fafafa; font-size: 16px; font-weight: 700; text-align: right;">$${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        <p style="margin: 0; color: #71717a; font-size: 12px;">Thank you for your business.</p>
      </div>
    </div>
  `
}
