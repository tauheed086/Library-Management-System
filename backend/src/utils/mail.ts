import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'no-reply@enterprise-lms.com';

  console.log(`[SMTP] Attempting to send OTP email to: ${email}`);

  // Fallback if not configured in environment: use Ethereal Email test account!
  if (!host || !user || !pass) {
    console.log(`[SMTP] SMTP credentials not configured. Generating temporary Ethereal test account...`);
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const mailOptions = {
        from: '"Enterprise LMS" <no-reply@enterprise-lms.com>',
        to: email,
        subject: 'Password Reset Verification Code - Enterprise LMS',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5; margin-bottom: 16px;">Enterprise LMS Password Reset</h2>
            <p>We received a request to reset your password. Use the verification code below to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 24px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #6b7280;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[SMTP] Ethereal test mail sent to ${email}`);
      console.log(`[SMTP] PREVIEW SENT EMAIL HERE: ${previewUrl}`);
      console.log(`-------------------------------------------`);
      console.log(`OTP Code: ${otp}`);
      console.log(`-------------------------------------------`);
      return true;
    } catch (err) {
      console.error(`[SMTP] Failed to generate Ethereal test account:`, err);
      return false;
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"Enterprise LMS" <${from}>`,
      to: email,
      subject: 'Password Reset Verification Code - Enterprise LMS',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">Enterprise LMS Password Reset</h2>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 24px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #6b7280;">This code is valid for 10 minutes. If you did not request this, please ignore this email or contact the administrator.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[SMTP] Error sending email:`, error);
    return false;
  }
};
