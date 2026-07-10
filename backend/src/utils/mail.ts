import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const mailjetApiKey = process.env.MAILJET_API_KEY;
  const mailjetSecretKey = process.env.MAILJET_SECRET_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  
  const htmlTemplate = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-bottom: 16px;">Enterprise LMS Password Reset</h2>
      <p>We received a request to reset your password. Use the verification code below to proceed:</p>
      <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 24px 0;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #6b7280;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  // 1. Try Brevo API (Allows sending to anyone using a single verified sender email, free)
  if (brevoApiKey) {
    console.log(`[Email] Attempting to send OTP email via Brevo API to: ${email}`);
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@enterprise-lms.com';
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Enterprise LMS', email: senderEmail },
          to: [{ email }],
          subject: 'Password Reset Verification Code - Enterprise LMS',
          htmlContent: htmlTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      console.log(`[Email] Email sent successfully via Brevo API.`);
      return true;
    } catch (error) {
      console.error(`[Email] Error sending email via Brevo:`, error);
    }
  }

  // 2. Try Mailjet API (Allows sending to anyone using a single verified sender email, free)
  if (mailjetApiKey && mailjetSecretKey) {
    console.log(`[Email] Attempting to send OTP email via Mailjet API to: ${email}`);
    try {
      const senderEmail = process.env.MAILJET_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@enterprise-lms.com';
      const authHeader = 'Basic ' + Buffer.from(`${mailjetApiKey}:${mailjetSecretKey}`).toString('base64');
      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Messages: [
            {
              From: { Email: senderEmail, Name: 'Enterprise LMS' },
              To: [{ Email: email }],
              Subject: 'Password Reset Verification Code - Enterprise LMS',
              HTMLPart: htmlTemplate,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData.ErrorMessage || `HTTP ${response.status}`);
      }

      console.log(`[Email] Email sent successfully via Mailjet API.`);
      return true;
    } catch (error) {
      console.error(`[Email] Error sending email via Mailjet:`, error);
    }
  }

  // 3. Try SendGrid API (Allows sending to anyone using a single verified sender email, free)
  if (sendgridApiKey) {
    console.log(`[Email] Attempting to send OTP email via SendGrid API to: ${email}`);
    try {
      const senderEmail = process.env.SENDGRID_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@enterprise-lms.com';
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: senderEmail, name: 'Enterprise LMS' },
          subject: 'Password Reset Verification Code - Enterprise LMS',
          content: [{ type: 'text/html', value: htmlTemplate }],
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      console.log(`[Email] Email sent successfully via SendGrid API.`);
      return true;
    } catch (error) {
      console.error(`[Email] Error sending email via SendGrid:`, error);
    }
  }

  // 4. Try Resend API (Bypasses SMTP port blocks, free sandbox but restricted to registered domain/email)
  if (resendApiKey) {
    console.log(`[Email] Attempting to send OTP email via Resend API to: ${email}`);
    try {
      const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Enterprise LMS <${from}>`,
          to: email,
          subject: 'Password Reset Verification Code - Enterprise LMS',
          html: htmlTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const resData = (await response.json()) as any;
      console.log(`[Email] Email sent successfully via Resend. ID: ${resData.id}`);
      return true;
    } catch (error) {
      console.error(`[Email] Error sending email via Resend:`, error);
    }
  }

  // 5. Try Standard SMTP Flow (Falls back to Ethereal Mail if SMTP details not found)
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
        html: htmlTemplate,
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
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"Enterprise LMS" <${from}>`,
      to: email,
      subject: 'Password Reset Verification Code - Enterprise LMS',
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[SMTP] Error sending email:`, error);
    return false;
  }
};
