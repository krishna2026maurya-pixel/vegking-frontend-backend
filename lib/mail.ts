import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"VegKing Support" <info@vegking.com>';

  if (!host || !user || !pass) {
    console.log('====== MOCK EMAIL SENT ======');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    if (html) {
      console.log(`HTML: ${html}`);
    }
    console.log('=============================');
    return { success: true, message: 'SMTP not configured. Email logged to console.' };
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

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

export async function sendVendorWelcomeEmail(vendor: {
  full_name: string;
  shop_name: string;
  email: string;
}) {
  const subject = `Welcome to VegKing, ${vendor.full_name}!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #fcfdfc;">
      <div style="text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="color: #1e3b2b; margin: 0;">VegKing Partner Network</h2>
        <p style="color: #16a34a; font-size: 14px; margin: 5px 0 0 0;">Freshness Delivered Daily</p>
      </div>
      
      <p style="font-size: 16px; color: #1f2937;">Dear <strong>${vendor.full_name}</strong>,</p>
      
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
        Welcome to VegKing! We are absolutely thrilled to partner with <strong>${vendor.shop_name}</strong> to bring fresh, premium quality produce to our growing customer network.
      </p>
      
      <div style="background-color: #f4fbf7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #1e3b2b;">Registration Summary:</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-weight: bold; width: 120px;">Shop Name:</td>
            <td style="padding: 4px 0; color: #1f2937;">${vendor.shop_name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-weight: bold;">Registrant:</td>
            <td style="padding: 4px 0; color: #1f2937;">${vendor.full_name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-weight: bold;">Login Email:</td>
            <td style="padding: 4px 0; color: #1f2937;">${vendor.email}</td>
          </tr>
        </table>
      </div>

      <h4 style="color: #1e3b2b; margin-top: 25px;">What's Next?</h4>
      <ol style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li><strong>Admin Review</strong>: Our admin team is currently reviewing the documents you uploaded (GST, PAN, Aadhar). Your account will be activated once verified.</li>
        <li><strong>Explore your Dashboard</strong>: You can log into your vendor profile at <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vendor/login" style="color: #16a34a; text-decoration: none; font-weight: bold;">Vendor Login</a>.</li>
        <li><strong>Upload Products</strong>: Once verified, start listing your products and set prices/stock to receive orders.</li>
      </ol>

      <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 25px;">
        If you have any questions or need assistance setting up your store profile, please reach out to our dedicated support team at <a href="mailto:info@vegking.com" style="color: #16a34a; text-decoration: none;">info@vegking.com</a>.
      </p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 13px; color: #9ca3af; text-align: center;">
        <p style="margin: 0;">VegKing Inc. &bull; Fresh & Healthy Partners</p>
        <p style="margin: 5px 0 0 0;">This is an automated welcome email. Please do not reply directly to this message.</p>
      </div>
    </div>
  `;

  const text = `Dear ${vendor.full_name},\n\nWelcome to VegKing! We are thrilled to partner with ${vendor.shop_name} to bring premium quality produce to our network.\n\nYour login email is: ${vendor.email}\n\nOur admin team is currently reviewing your documents. Once verified, you will be able to log in at ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vendor/login and manage your store.\n\nWarm regards,\nVegKing Partner Network Team`;

  return sendMail({
    to: vendor.email,
    subject,
    text,
    html,
  });
}

export async function sendWelcomeEmail(vendorName: string, email: string) {
  // Validate email address before attempting to send
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.error(`[Email Error] Failed validation. Invalid vendor email address: "${email}"`);
    throw new Error(`Invalid email address: ${email}`);
  }

  const subject = "Welcome to VegKing – Vendor Registration Successful";

  const text = `Hello ${vendorName},

Welcome to VegKing! 🎉

Your vendor account has been successfully created.

You can now log in to your vendor dashboard and:
• Add and manage your products
• Manage customer orders
• Update order status
• View your sales and account information

Thank you for joining VegKing. We look forward to growing together!

Best Regards,
VegKing Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #fcfdfc;">
      <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="color: #065f46; margin: 0;">VegKing Partner Network</h2>
        <p style="color: #10b981; font-size: 14px; margin: 5px 0 0 0;">Freshness Delivered Daily</p>
      </div>
      
      <p style="font-size: 16px; color: #1f2937;">Hello <strong>${vendorName}</strong>,</p>
      
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
        Welcome to VegKing! 🎉
      </p>
      
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
        Your vendor account has been successfully created.
      </p>
      
      <div style="background-color: #f4fbf7; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #065f46; font-weight: bold; font-size: 14px;">You can now log in to your vendor dashboard and:</p>
        <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Add and manage your products</li>
          <li>Manage customer orders</li>
          <li>Update order status</li>
          <li>View your sales and account information</li>
        </ul>
      </div>

      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
        Thank you for joining Vegimart. We look forward to growing together!
      </p>
      
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-top: 25px; margin-bottom: 0;">
        Best Regards,<br>
        <strong>VegKing Team</strong>
      </p>
    </div>
  `;

  try {
    const result = await sendMail({
      to: email,
      subject,
      text,
      html,
    });
    console.log(`[Email Success] Welcome email successfully sent to ${email} (Status/ID: ${result.messageId || result.message})`);
    return result;
  } catch (error: any) {
    console.error(`[Email Failure] Failed to send welcome email to ${email}. Error:`, error);
    throw error;
  }
}

export async function sendUserWelcomeEmail(user: { name: string; email: string }) {
  const subject = `Welcome to Organic Vatika, ${user.name}!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #fcfdfc;">
      <div style="text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="color: #1e3b2b; margin: 0;">Organic Vatika</h2>
        <p style="color: #16a34a; font-size: 14px; margin: 5px 0 0 0;">Fresh & Healthy Produce Delivered Daily</p>
      </div>
      
      <p style="font-size: 16px; color: #1f2937;">Dear <strong>${user.name}</strong>,</p>
      
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
        Welcome to Organic Vatika! We are thrilled to have you join our community. Our mission is to deliver fresh, premium quality vegetables and fruits straight from the farm to your kitchen.
      </p>
      
      <div style="background-color: #f4fbf7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #1e3b2b;">Your Account Details:</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-weight: bold; width: 120px;">Name:</td>
            <td style="padding: 4px 0; color: #1f2937;">${user.name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-weight: bold;">Registered Email:</td>
            <td style="padding: 4px 0; color: #1f2937;">${user.email}</td>
          </tr>
        </table>
      </div>

      <h4 style="color: #1e3b2b; margin-top: 25px;">Ready to shop? Here is what you can do next:</h4>
      <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li><strong>Browse Products</strong>: Explore our wide range of fresh vegetables, exotic greens, and organic fruits.</li>
        <li><strong>Easy Ordering</strong>: Add items to your cart and checkout quickly.</li>
        <li><strong>Fast Delivery</strong>: Get your groceries delivered straight to your door.</li>
      </ul>

      <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 25px;">
        If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:info@vegking.com" style="color: #16a34a; text-decoration: none;">info@vegking.com</a>.
      </p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 13px; color: #9ca3af; text-align: center;">
        <p style="margin: 0;">Organic Vatika &bull; Freshness you can trust</p>
        <p style="margin: 5px 0 0 0;">This is an automated welcome email. Please do not reply directly to this message.</p>
      </div>
    </div>
  `;

  const text = `Dear ${user.name},\n\nWelcome to VegKing!\n\nYour account has been successfully created with the email: ${user.email}.\n\nStart shopping for fresh and healthy produce today at VegKing.\n\nWarm regards,\nVegKing Team`;

  return sendMail({
    to: user.email,
    subject,
    text,
    html,
  });
}

