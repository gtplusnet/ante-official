import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Admin email (alex.geersolutions@gmail.com)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'alex.geersolutions@gmail.com';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  industry: string;
  phone?: string;
  jobTitle: string;
  message?: string;
}

// Create transporter with SMTP configuration
function createTransporter() {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Warning: SMTP not configured. Form submission will be logged only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ContactFormData = await request.json();

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'companyName', 'industry', 'jobTitle'];
    for (const field of requiredFields) {
      if (!body[field as keyof ContactFormData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get current timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    // Get IP address (for security tracking)
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'Unknown';

    // Create HTML email template for admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a8a; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; color: #000; }
            .message-box { background: white; padding: 15px; border-left: 4px solid #1e3a8a; margin-top: 20px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Contact Form Submission</h2>
              <p style="margin: 5px 0;">From ${body.companyName}</p>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">Name:</span>
                <span class="value">${body.firstName} ${body.lastName}</span>
              </div>
              <div class="field">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${body.email}">${body.email}</a></span>
              </div>
              <div class="field">
                <span class="label">Company:</span>
                <span class="value">${body.companyName}</span>
              </div>
              <div class="field">
                <span class="label">Industry:</span>
                <span class="value">${body.industry}</span>
              </div>
              <div class="field">
                <span class="label">Job Title:</span>
                <span class="value">${body.jobTitle}</span>
              </div>
              ${body.phone ? `
              <div class="field">
                <span class="label">Phone:</span>
                <span class="value">${body.phone}</span>
              </div>
              ` : ''}
              ${body.message ? `
              <div class="message-box">
                <div class="label">Message:</div>
                <p>${body.message}</p>
              </div>
              ` : ''}
              <div class="footer">
                <p><strong>Submission Details:</strong></p>
                <p>Time: ${timestamp}</p>
                <p>IP Address: ${ip}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create plain text version for admin
    const adminEmailText = `
New Contact Form Submission
===========================

Name: ${body.firstName} ${body.lastName}
Email: ${body.email}
Company: ${body.companyName}
Industry: ${body.industry}
Job Title: ${body.jobTitle}
${body.phone ? `Phone: ${body.phone}` : ''}

${body.message ? `Message:\n${body.message}\n` : ''}

---
Submitted: ${timestamp}
IP Address: ${ip}
    `;

    // Create auto-response HTML for user
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Thank you for contacting Multibook</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .button { display: inline-block; padding: 12px 30px; background: #f1f06c; color: #1e3a8a; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Thank You for Contacting Multibook</h1>
            </div>
            <div class="content">
              <p>Hi ${body.firstName},</p>
              <p>Thank you for your interest in Multibook. We have received your inquiry and our team will review it shortly.</p>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our specialist will review your requirements</li>
                <li>We'll contact you within 24 business hours</li>
                <li>We'll schedule a consultation to discuss your needs</li>
              </ul>
              <p>If you have any urgent questions, please don't hesitate to reach out directly.</p>
              <div style="text-align: center;">
                <a href="https://multibook.geertest.com" class="button">Visit Our Website</a>
              </div>
              <div class="footer">
                <p>This is an automated response. Please do not reply to this email.</p>
                <p>&copy; 2025 Multibook. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create plain text version for user
    const userEmailText = `
Hi ${body.firstName},

Thank you for contacting Multibook!

We have received your inquiry and our team will review it shortly.

What happens next?
- Our specialist will review your requirements
- We'll contact you within 24 business hours
- We'll schedule a consultation to discuss your needs

If you have any urgent questions, please don't hesitate to reach out directly.

Best regards,
The Multibook Team

---
This is an automated response. Please do not reply to this email.
© 2025 Multibook. All rights reserved.
    `;

    // Initialize email results
    let adminEmailSent = false;
    let userEmailSent = false;
    let emailError = null;

    // Try to send emails via SMTP
    const transporter = createTransporter();

    if (transporter) {
      try {
        // Verify SMTP connection
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        // Prepare sender email
        const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

        // Send email to admin
        const adminEmailInfo = await transporter.sendMail({
          from: `"Multibook Contact Form" <${senderEmail}>`,
          to: ADMIN_EMAIL,
          replyTo: body.email,
          subject: `New Inquiry from ${body.companyName} - ${body.industry}`,
          html: adminEmailHtml,
          text: adminEmailText,
          headers: {
            'X-Priority': '3',
            'X-Mailer': 'Multibook Contact Form',
            'Message-ID': `<${Date.now()}-${Math.random().toString(36).substring(7)}@multibook.com>`,
          }
        });
        adminEmailSent = true;
        console.log('Admin email sent:', adminEmailInfo.messageId);

        // Send auto-response to user
        const userEmailInfo = await transporter.sendMail({
          from: `"Multibook" <${senderEmail}>`,
          to: body.email,
          subject: 'Thank you for contacting Multibook',
          html: userEmailHtml,
          text: userEmailText,
          headers: {
            'X-Priority': '3',
            'X-Mailer': 'Multibook Auto-Response',
            'Message-ID': `<${Date.now()}-${Math.random().toString(36).substring(7)}@multibook.com>`,
            'List-Unsubscribe': '<mailto:unsubscribe@multibook.com>',
          }
        });
        userEmailSent = true;
        console.log('User email sent:', userEmailInfo.messageId);

      } catch (smtpError) {
        emailError = smtpError instanceof Error ? smtpError.message : 'SMTP error occurred';
        console.error('SMTP Error:', smtpError);
      }
    } else {
      // Log the form submission when SMTP is not configured
      console.log('Form submission received (email not sent - SMTP not configured):', {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        company: body.companyName,
        industry: body.industry,
        jobTitle: body.jobTitle,
        phone: body.phone,
        message: body.message,
        timestamp,
      });
    }

    // Return response
    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      emailStatus: {
        adminEmailSent,
        userEmailSent,
        error: emailError,
        smtpConfigured: !!transporter
      }
    });

  } catch (error) {
    console.error('Error processing contact form:', error);

    return NextResponse.json(
      {
        error: 'Failed to process form submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
