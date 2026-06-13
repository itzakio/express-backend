import nodemailer from 'nodemailer';
import 'dotenv'

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error('EMAIL_USER and EMAIL_PASS must be defined in .env');
}

// Use explicit SMTP settings for Gmail (or any provider)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"Auth System" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the OTP below:</p>
        <div style="font-size: 32px; font-weight: bold; background: #f4f4f4; padding: 16px; text-align: center; letter-spacing: 4px;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
        <hr />
        <small>Authentication API</small>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(` OTP email sent to ${to}`);
  } catch (error) {
    console.error(' Error sending email:', error);
    throw new Error('Could not send OTP email');
  }
};