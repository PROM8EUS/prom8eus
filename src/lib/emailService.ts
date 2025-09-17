// Email service for sending implementation request notifications
// For MVP, we'll use a simple email service that can be easily replaced

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailServiceConfig {
  service: 'smtp' | 'sendgrid' | 'resend' | 'mock';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  resend?: {
    apiKey: string;
  };
}

export class EmailService {
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
  }

  /**
   * Send an email using the configured service
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      switch (this.config.service) {
        case 'smtp':
          return await this.sendViaSMTP(emailData);
        case 'sendgrid':
          return await this.sendViaSendGrid(emailData);
        case 'resend':
          return await this.sendViaResend(emailData);
        case 'mock':
          return await this.sendViaMock(emailData);
        default:
          throw new Error(`Unsupported email service: ${this.config.service}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send email via SMTP (using nodemailer)
   */
  private async sendViaSMTP(emailData: EmailData): Promise<boolean> {
    try {
      // For MVP, we'll use a simple fetch-based approach
      // In production, you would use nodemailer or similar
      console.log('SMTP Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        htmlLength: emailData.html.length,
        textLength: emailData.text.length
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch (error) {
      console.error('SMTP email error:', error);
      return false;
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.config.sendgrid?.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.sendgrid.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: emailData.to }],
              subject: emailData.subject,
            },
          ],
          from: { email: 'noreply@prom8.eus', name: 'Prom8eus' },
          content: [
            {
              type: 'text/html',
              value: emailData.html,
            },
            {
              type: 'text/plain',
              value: emailData.text,
            },
          ],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Send email via Resend
   */
  private async sendViaResend(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.config.resend?.apiKey) {
        throw new Error('Resend API key not configured');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Prom8eus <noreply@prom8.eus>',
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Resend email error:', error);
      return false;
    }
  }

  /**
   * Mock email sending for development/testing
   */
  private async sendViaMock(emailData: EmailData): Promise<boolean> {
    console.log('📧 Mock Email Sent:');
    console.log('==================');
    console.log(`To: ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`HTML Length: ${emailData.html.length} characters`);
    console.log(`Text Length: ${emailData.text.length} characters`);
    console.log('HTML Preview:', emailData.html.substring(0, 200) + '...');
    console.log('==================');

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  /**
   * Create email service from environment variables
   */
  static fromEnvironment(): EmailService {
    const emailService = process.env.EMAIL_SERVICE || 'mock';
    
    const config: EmailServiceConfig = {
      service: emailService as any,
    };

    switch (emailService) {
      case 'smtp':
        config.smtp = {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        };
        break;
      case 'sendgrid':
        config.sendgrid = {
          apiKey: process.env.SENDGRID_API_KEY || '',
        };
        break;
      case 'resend':
        config.resend = {
          apiKey: process.env.RESEND_API_KEY || '',
        };
        break;
      case 'mock':
        // No additional config needed for mock
        break;
      default:
        console.warn(`Unknown email service: ${emailService}, falling back to mock`);
        config.service = 'mock';
    }

    return new EmailService(config);
  }
}

// Email template generators
export class EmailTemplates {
  /**
   * Generate service email for implementation request
   */
  static generateServiceEmail(data: any, requestId: string): EmailData {
    const subject = `New Implementation Request: ${data.user_name} - ${data.company || 'No Company'}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Implementation Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-left: 10px; }
          .task-context { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .tools { display: flex; flex-wrap: wrap; gap: 5px; }
          .tool-tag { background: #e1f5fe; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Implementation Request</h1>
            <p><strong>Request ID:</strong> ${requestId}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>👤 Contact Information</h2>
            <p><span class="label">Name:</span><span class="value">${data.user_name}</span></p>
            <p><span class="label">Email:</span><span class="value">${data.user_email}</span></p>
            ${data.company ? `<p><span class="label">Company:</span><span class="value">${data.company}</span></p>` : ''}
          </div>

          <div class="section">
            <h2>📋 Project Details</h2>
            <p><span class="label">Timeline:</span><span class="value">${data.timeline}</span></p>
            <p><span class="label">Budget Range:</span><span class="value">${data.budget_range}</span></p>
            ${data.preferred_tools && data.preferred_tools.length > 0 ? `
              <p><span class="label">Preferred Tools:</span></p>
              <div class="tools">
                ${data.preferred_tools.map((tool: string) => `<span class="tool-tag">${tool}</span>`).join('')}
              </div>
            ` : ''}
          </div>

          ${data.task_context ? `
            <div class="section">
              <h2>🎯 Task Context</h2>
              <div class="task-context">
                ${data.task_context.task_description ? `
                  <p><span class="label">Task Description:</span></p>
                  <p>${data.task_context.task_description}</p>
                ` : ''}
                
                ${data.task_context.subtasks && data.task_context.subtasks.length > 0 ? `
                  <p><span class="label">Subtasks:</span></p>
                  <ul>
                    ${data.task_context.subtasks.map((subtask: string) => `<li>${subtask}</li>`).join('')}
                  </ul>
                ` : ''}
                
                ${data.task_context.automation_score ? `
                  <p><span class="label">Automation Score:</span><span class="value">${data.task_context.automation_score}/100</span></p>
                ` : ''}
                
                ${data.task_context.selected_workflow_ids && data.task_context.selected_workflow_ids.length > 0 ? `
                  <p><span class="label">Selected Workflows:</span><span class="value">${data.task_context.selected_workflow_ids.length} workflows</span></p>
                ` : ''}
                
                ${data.task_context.selected_agent_ids && data.task_context.selected_agent_ids.length > 0 ? `
                  <p><span class="label">Selected Agents:</span><span class="value">${data.task_context.selected_agent_ids.length} agents</span></p>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${data.additional_requirements ? `
            <div class="section">
              <h2>📝 Additional Requirements</h2>
              <p>${data.additional_requirements}</p>
            </div>
          ` : ''}

          <div class="section">
            <h2>🔍 Technical Details</h2>
            <p><span class="label">User Agent:</span><span class="value">${data.user_agent || 'Not provided'}</span></p>
            <p><span class="label">Referrer:</span><span class="value">${data.referrer_url || 'Direct'}</span></p>
            <p><span class="label">Session ID:</span><span class="value">${data.session_id || 'Not provided'}</span></p>
          </div>

          <div class="footer">
            <p>This request was automatically generated from the Prom8eus platform.</p>
            <p>Please respond to the user within 24 hours to maintain our service level agreement.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Implementation Request - ${requestId}

Contact Information:
- Name: ${data.user_name}
- Email: ${data.user_email}
${data.company ? `- Company: ${data.company}` : ''}

Project Details:
- Timeline: ${data.timeline}
- Budget Range: ${data.budget_range}
${data.preferred_tools && data.preferred_tools.length > 0 ? `- Preferred Tools: ${data.preferred_tools.join(', ')}` : ''}

${data.task_context ? `
Task Context:
${data.task_context.task_description ? `- Task: ${data.task_context.task_description}` : ''}
${data.task_context.subtasks && data.task_context.subtasks.length > 0 ? `- Subtasks: ${data.task_context.subtasks.join(', ')}` : ''}
${data.task_context.automation_score ? `- Automation Score: ${data.task_context.automation_score}/100` : ''}
${data.task_context.selected_workflow_ids && data.task_context.selected_workflow_ids.length > 0 ? `- Selected Workflows: ${data.task_context.selected_workflow_ids.length}` : ''}
${data.task_context.selected_agent_ids && data.task_context.selected_agent_ids.length > 0 ? `- Selected Agents: ${data.task_context.selected_agent_ids.length}` : ''}
` : ''}

${data.additional_requirements ? `
Additional Requirements:
${data.additional_requirements}
` : ''}

Technical Details:
- User Agent: ${data.user_agent || 'Not provided'}
- Referrer: ${data.referrer_url || 'Direct'}
- Session ID: ${data.session_id || 'Not provided'}

Submitted: ${new Date().toLocaleString()}
    `;

    return { to: 'service@prom8.eus', subject, html, text };
  }

  /**
   * Generate auto-reply email for user
   */
  static generateAutoReplyEmail(data: any, requestId: string): EmailData {
    const subject = `Implementation Request Received - ${requestId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Implementation Request Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .content { margin-bottom: 20px; }
          .highlight { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .cta { background: #1976d2; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Thank You for Your Request!</h1>
            <p>Your implementation request has been received and is being processed.</p>
          </div>

          <div class="content">
            <p>Dear ${data.user_name},</p>
            
            <p>Thank you for submitting your implementation request to Prom8eus. We've received your request and our team will review it within 24 hours.</p>

            <div class="highlight">
              <h3>📋 Request Summary</h3>
              <p><strong>Request ID:</strong> ${requestId}</p>
              <p><strong>Timeline:</strong> ${data.timeline}</p>
              <p><strong>Budget Range:</strong> ${data.budget_range}</p>
              ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
            </div>

            <h3>🔄 What Happens Next?</h3>
            <ol>
              <li><strong>Review (Within 24 hours):</strong> Our team will review your requirements and task context</li>
              <li><strong>Initial Contact:</strong> We'll reach out to discuss your needs in detail</li>
              <li><strong>Proposal:</strong> We'll provide a detailed proposal with timeline and pricing</li>
              <li><strong>Implementation:</strong> Once approved, we'll begin implementing your automation solution</li>
            </ol>

            <h3>📞 Need Immediate Assistance?</h3>
            <p>If you have urgent questions or need immediate assistance, please don't hesitate to contact us:</p>
            <ul>
              <li>Email: service@prom8.eus</li>
              <li>Response time: Within 24 hours</li>
            </ul>
          </div>

          <div class="footer">
            <p>This is an automated confirmation email. Please do not reply to this message.</p>
            <p>© 2024 Prom8eus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Thank You for Your Implementation Request!

Dear ${data.user_name},

Thank you for submitting your implementation request to Prom8eus. We've received your request and our team will review it within 24 hours.

Request Summary:
- Request ID: ${requestId}
- Timeline: ${data.timeline}
- Budget Range: ${data.budget_range}
${data.company ? `- Company: ${data.company}` : ''}

What Happens Next?
1. Review (Within 24 hours): Our team will review your requirements and task context
2. Initial Contact: We'll reach out to discuss your needs in detail
3. Proposal: We'll provide a detailed proposal with timeline and pricing
4. Implementation: Once approved, we'll begin implementing your automation solution

Need Immediate Assistance?
If you have urgent questions or need immediate assistance, please contact us:
- Email: service@prom8.eus
- Response time: Within 24 hours

This is an automated confirmation email. Please do not reply to this message.

© 2024 Prom8eus. All rights reserved.
    `;

    return { to: data.user_email, subject, html, text };
  }
}
