import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { EmailService, EmailTemplates } from '../../lib/emailService';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types
interface ImplementationRequestData {
  user_name: string;
  user_email: string;
  company?: string;
  preferred_tools: string[];
  timeline: string;
  budget_range: string;
  additional_requirements?: string;
  task_context?: {
    task_description?: string;
    subtasks?: string[];
    automation_score?: number;
    selected_workflow_ids?: string[];
    selected_agent_ids?: string[];
  };
  user_agent?: string;
  referrer_url?: string;
  session_id?: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}


// Initialize email service
const emailService = EmailService.fromEnvironment();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: ImplementationRequestData = req.body;

    // Validate required fields
    if (!data.user_name || !data.user_email || !data.timeline || !data.budget_range) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_name, user_email, timeline, budget_range' 
      });
    }

    // Insert into database
    const { data: requestData, error: dbError } = await supabase
      .from('implementation_requests')
      .insert([{
        user_name: data.user_name,
        user_email: data.user_email,
        company: data.company || null,
        preferred_tools: data.preferred_tools || [],
        timeline: data.timeline,
        budget_range: data.budget_range,
        task_description: data.task_context?.task_description || null,
        subtasks: data.task_context?.subtasks || null,
        automation_score: data.task_context?.automation_score || null,
        selected_workflow_ids: data.task_context?.selected_workflow_ids || [],
        selected_agent_ids: data.task_context?.selected_agent_ids || [],
        user_agent: data.user_agent || null,
        referrer_url: data.referrer_url || null,
        session_id: data.session_id || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save request to database' });
    }

    const requestId = requestData.id;

    // Send emails
    const serviceEmail = EmailTemplates.generateServiceEmail(data, requestId);
    const autoReplyEmail = EmailTemplates.generateAutoReplyEmail(data, requestId);

    // Send service email
    const serviceEmailSent = await emailService.sendEmail(serviceEmail);
    if (serviceEmailSent) {
      await supabase
        .from('implementation_requests')
        .update({ 
          email_sent_to_service: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', requestId);
    }

    // Send auto-reply email
    const autoReplySent = await emailService.sendEmail(autoReplyEmail);
    if (autoReplySent) {
      await supabase
        .from('implementation_requests')
        .update({ 
          auto_reply_sent: true,
          auto_reply_sent_at: new Date().toISOString()
        })
        .eq('id', requestId);
    }

    return res.status(200).json({ 
      success: true, 
      request_id: requestId,
      message: 'Implementation request submitted successfully'
    });

  } catch (error) {
    console.error('Error processing implementation request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process implementation request'
    });
  }
}
