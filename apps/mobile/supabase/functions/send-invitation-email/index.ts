import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  invitationCode: string;
  role: 'coach' | 'parent';
}

function generateInvitationLink(invitationCode: string, role: string, email: string): string {
  const baseUrl = Deno.env.get('SITE_URL') || 'https://tryeleve.com';
  return `${baseUrl}/invite/${role}/${invitationCode}?email=${encodeURIComponent(email)}`;
}

// Read HTML template and replace placeholders
async function loadEmailTemplate(): Promise<string> {
  try {
    const templatePath = new URL('./email-template.html', import.meta.url).pathname;
    const template = await Deno.readTextFile(templatePath);
    return template;
  } catch (error) {
    console.error('Failed to load email template:', error);
    // Fallback to inline template if file loading fails
    return getInlineTemplate();
  }
}

function getInlineTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{role_title}} Invitation - Elevé</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F7F7; font-family: Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F7F7F7; margin: 0; padding: 0;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; margin: 0 auto;">
                    <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                            <img src="https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-logo.png" alt="Eleve Logo" width="120" height="60" style="display: block; margin: 0 auto; height: 40px; width: auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000; border-radius: 20px;">
                                <tr>
                                    <td style="padding: 0 3px 3px 0;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFFFFF; border: 2px solid #000000; border-radius: 20px;">
                                            <tr>
                                                <td style="background-color: #a5bff2; padding: 32px 30px; text-align: center; border-bottom: 2px solid #000000; border-radius: 18px 18px 0 0;">
                                                    <h1 style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 26px; font-weight: bold; color: #000000; line-height: 1.2;">
                                                        You're Invited as a {{role_title}}!
                                                    </h1>
                                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: normal; color: #000000; line-height: 1.4;">
                                                        {{header_subtitle}}
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 40px 30px;">
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td style="text-align: center; padding: 0 0 32px 0;">
                                                                <h2 style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #000000; line-height: 1.3;">
                                                                    Hi {{recipient_name}}!
                                                                </h2>
                                                                <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; color: #64748B; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">
                                                                    Great news! You've been invited to join <strong style="color: #000000;">{{organization_name}}</strong> as a {{role}} on Elevé – the modern action sports academy platform.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
                                                        <tr>
                                                            <td>
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000; border-radius: 16px;">
                                                                    <tr>
                                                                        <td>
                                                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f2f2f2; border: 2px solid #000000; border-radius: 16px;">
                                                                                <tr>
                                                                                    <td style="padding: 32px 30px; text-align: center;">
                                                                                        <h3 style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #000000; line-height: 1.3;">
                                                                                            What You'll Be Able To Do
                                                                                        </h3>
                                                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 400px; margin: 0 auto;">
                                                                                            {{features_list}}
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
                                                        <tr>
                                                            <td>
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000; border-radius: 16px;">
                                                                    <tr>
                                                                        <td>
                                                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFFFFF; border: 2px solid #000000; border-radius: 16px;">
                                                                                <tr>
                                                                                    <td style="padding: 32px 30px; text-align: center;">
                                                                                        <h3 style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #000000; line-height: 1.3;">
                                                                                            Let's Get Started
                                                                                        </h3>
                                                                                        <p style="margin: 0 0 32px 0; font-family: Arial, sans-serif; font-size: 15px; color: #64748B; line-height: 1.6;">
                                                                                            {{cta_message}}
                                                                                        </p>
                                                                                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                                                                            <tr>
                                                                                                <td>
                                                                                                    <table cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; border-radius: 12px;">
                                                                                                        <tr>
                                                                                                            <td style="padding: 0 3px 3px 0;">
                                                                                                                <a href="{{invitation_link}}" style="display: block; text-decoration: none; background-color: #F97316; color: #000; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; padding: 16px 32px; border: 2px solid #000000; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                                                                                    Accept Invitation &amp; Get Started
                                                                                                                </a>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </table>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </table>
                                                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
                                                                                            <tr>
                                                                                                <td style="padding: 16px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
                                                                                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; color: #64748B; line-height: 1.4; text-align: center;">
                                                                                                        This invitation expires in 7 days. Make sure to accept it before then!
                                                                                                    </p>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0 0 0;">
                                                        <tr>
                                                            <td>
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000; border-radius: 16px;">
                                                                    <tr>
                                                                        <td>
                                                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F8FAFC; border: 2px solid #000000; border-radius: 16px;">
                                                                                <tr>
                                                                                    <td style="padding: 24px 30px; text-align: center;">
                                                                                        <h4 style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #000000; line-height: 1.3;">
                                                                                            Need Help?
                                                                                        </h4>
                                                                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #64748B; line-height: 1.6;">
                                                                                            Contact your academy administrator if you have any questions about the platform or need assistance getting started.
                                                                                        </p>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0 0 0;">
                                                        <tr>
                                                            <td style="text-align: center; padding: 0;">
                                                                <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #64748B; line-height: 1.4;">
                                                                    Powered by Elevé – The future of action sports education
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generateFeaturesList(role: 'coach' | 'parent'): string {
  const features = role === 'coach' 
    ? [
        'Record and review student progress videos',
        'Track student achievements and milestones',
        'Access detailed progress analytics',
        'Communicate with parents and students',
        'Award badges and celebrate successes'
      ]
    : [
        'Create accounts for your children',
        'Monitor your children\'s progress and achievements',
        'Receive notifications about sessions and milestones',
        'Access detailed progress reports',
        'Communicate with coaches and academy staff',
        'View video analysis and coaching feedback',
        'Track skill development over time'
      ];

  return features.map(feature => `
    <tr>
      <td style="padding: 6px 0; text-align: left;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="20" style="font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #000000; vertical-align: top; padding-top: 2px;">
              •
            </td>
            <td style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 500; color: #000000; line-height: 1.4;">
              ${feature}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');
}

async function createEmailTemplate(invitation: EmailRequest, invitationLink: string): Promise<string> {
  const roleTitle = invitation.role === 'coach' ? 'Coach' : 'Parent';
  const headerSubtitle = invitation.role === 'parent' 
    ? 'Join your child\'s journey with Elevé'
    : 'Join our coaching team with Elevé';
  const ctaMessage = invitation.role === 'parent'
    ? 'Click below to accept your invitation and connect with your child\'s skateboarding journey!'
    : 'Click below to accept your invitation and connect with our academy team!';

  // Load template
  const template = await loadEmailTemplate();
  
  // Generate features list
  const featuresList = generateFeaturesList(invitation.role);
  
  // Replace placeholders
  return template
    .replace(/{{role_title}}/g, roleTitle)
    .replace(/{{header_subtitle}}/g, headerSubtitle)
    .replace(/{{recipient_name}}/g, invitation.recipientName)
    .replace(/{{organization_name}}/g, invitation.organizationName)
    .replace(/{{role}}/g, invitation.role)
    .replace(/{{features_list}}/g, featuresList)
    .replace(/{{cta_message}}/g, ctaMessage)
    .replace(/{{invitation_link}}/g, invitationLink);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const emailRequest: EmailRequest = await req.json()
    
    // Validate required fields
    if (!emailRequest.recipientEmail || !emailRequest.recipientName || !emailRequest.invitationCode || !emailRequest.role) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: recipientEmail, recipientName, invitationCode, role' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@tryeleve.com'
    const fromName = Deno.env.get('FROM_NAME') || 'Eleve Academy'

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate invitation link
    const invitationLink = generateInvitationLink(
      emailRequest.invitationCode, 
      emailRequest.role,
      emailRequest.recipientEmail
    )

    // Create email content
    const emailSubject = `You're invited to join ${emailRequest.organizationName} as a ${emailRequest.role}!`
    const emailBody = await createEmailTemplate(emailRequest, invitationLink)

    console.log('📧 Sending email via Resend to:', emailRequest.recipientEmail)
    console.log('🔗 Invitation link:', invitationLink)

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [emailRequest.recipientEmail],
        subject: emailSubject,
        html: emailBody,
        tags: [
          { name: 'type', value: `${emailRequest.role}-invitation` },
          { name: 'organization', value: emailRequest.organizationName.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() }
        ]
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Resend API error:', result)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${result.message || 'Unknown error'}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Email ID:', result.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation email sent successfully to ${emailRequest.recipientEmail}`,
        emailId: result.id,
        invitationLink: invitationLink
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in send-invitation-email function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 