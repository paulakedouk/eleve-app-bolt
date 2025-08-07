import { supabase } from '../lib/supabase';

export interface EmailInvitation {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  invitationCode: string;
  role: 'coach' | 'parent';
  expiresAt: Date;
}

// Sanitize tag values to only contain ASCII letters, numbers, underscores, or dashes
const sanitizeTagValue = (value: string): string => {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, '-') // Replace invalid characters with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase(); // Convert to lowercase
};

// Generate invitation link
export const generateInvitationLink = (invitationCode: string, role: 'coach' | 'parent'): string => {
  // This would be your actual app URL in production
  const baseUrl = 'https://tryeleve.com';
  return `${baseUrl}/invite/${role}/${invitationCode}`;
};

// Send coach invitation email
export const sendCoachInvitation = async (invitation: EmailInvitation): Promise<{ success: boolean; message: string; emailId?: string }> => {
  try {
    // Always use Supabase Edge Function for security (both web and mobile)
    console.log('📧 Sending coach invitation via Supabase function');
    
    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        recipientEmail: invitation.recipientEmail,
        recipientName: invitation.recipientName,
        organizationName: invitation.organizationName,
        invitationCode: invitation.invitationCode,
        role: 'coach'
      }
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send invitation email'
      };
    }

    if (!data.success) {
      console.error('❌ Email sending failed:', data.error);
      return {
        success: false,
        message: data.error || 'Failed to send invitation email'
      };
    }

    console.log('✅ Coach invitation sent successfully via Supabase function');
    return {
      success: true,
      message: data.message,
      emailId: data.emailId
    };
  } catch (error) {
    console.error('❌ Error sending coach invitation email:', error);
    return {
      success: false,
      message: 'Failed to send invitation email'
    };
  }
};

// Send parent invitation email
export const sendParentInvitation = async (invitation: EmailInvitation): Promise<{ success: boolean; message: string; emailId?: string }> => {
  try {
    // Always use Supabase Edge Function for security (both web and mobile)
    console.log('📧 Sending parent invitation via Supabase function');
    
    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        recipientEmail: invitation.recipientEmail,
        recipientName: invitation.recipientName,
        organizationName: invitation.organizationName,
        invitationCode: invitation.invitationCode,
        role: 'parent'
      }
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send invitation email'
      };
    }

    if (!data.success) {
      console.error('❌ Email sending failed:', data.error);
      return {
        success: false,
        message: data.error || 'Failed to send invitation email'
      };
    }

    console.log('✅ Parent invitation sent successfully via Supabase function');
    return {
      success: true,
      message: data.message,
      emailId: data.emailId
    };
  } catch (error) {
    console.error('❌ Error sending parent invitation email:', error);
    return {
      success: false,
      message: 'Failed to send invitation email'
    };
  }
};

// Send family approval notification
export const sendFamilyApprovalNotification = async (
  parentEmail: string,
  parentName: string,
  organizationName: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
): Promise<{ success: boolean; message: string; emailId?: string }> => {
  try {
    const isApproved = status === 'approved';
    const emailSubject = `Your family application has been ${isApproved ? 'approved' : 'reviewed'} - ${organizationName}`;
    
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, ${isApproved ? '#10B981, #059669' : '#F59E0B, #D97706'}); color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🛹 Eleve</h1>
            <h2 style="margin: 10px 0 0 0; font-weight: normal;">
              ${isApproved ? '🎉 Family Application Approved!' : '📋 Family Application Update'}
            </h2>
          </div>
          
          <div style="padding: 30px; background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <h3 style="color: ${isApproved ? '#10B981' : '#F59E0B'}; margin-top: 0;">Hi ${parentName}! 👋</h3>
            
            ${isApproved ? `
              <p>Congratulations! Your family application for <strong>${organizationName}</strong> has been approved!</p>
              
              <p>🎉 <strong>What happens next:</strong></p>
              <ul style="color: #064e3b; margin: 20px 0;">
                <li>📧 You'll receive a separate email with your child's login credentials</li>
                <li>👤 Your child can now log in to their student account</li>
                <li>🛹 They're ready to start their action sports journey!</li>
                <li>📱 You can track their progress through the parent portal</li>
              </ul>
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  <strong>🔐 Login Information:</strong> Your child's login credentials will be sent to you in a separate email shortly.
                </p>
              </div>
            ` : `
              <p>Thank you for your application to <strong>${organizationName}</strong>. We have reviewed your submission and need some additional information.</p>
              
              <p>📝 <strong>Next Steps:</strong></p>
              <ul style="color: #92400e; margin: 20px 0;">
                <li>📞 Please contact your academy administrator</li>
                <li>📋 Additional information may be needed</li>
                <li>⏰ Your application will be reviewed again once complete</li>
              </ul>
            `}
            
            ${adminNotes ? `
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #64748B; font-size: 14px;">
                  <strong>📝 Administrator Notes:</strong><br>
                  ${adminNotes}
                </p>
              </div>
            ` : ''}
            
            <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
              Questions? Reply to this email or contact your academy administrator.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              This notification was sent by ${organizationName} through Eleve.<br>
              ${isApproved ? 'Welcome to the family!' : 'Thank you for your patience.'}
            </p>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: parentEmail,
      subject: emailSubject,
      html: emailBody,
      tags: [
        { name: 'type', value: 'family-approval' },
        { name: 'status', value: status },
        { name: 'organization', value: sanitizeTagValue(organizationName) }
      ]
    });
  } catch (error) {
    console.error('❌ Error sending family approval notification:', error);
    return {
      success: false,
      message: 'Failed to send notification email'
    };
  }
};

// Send student account credentials
export const sendStudentAccountCredentials = async (
  parentEmail: string,
  parentName: string,
  organizationName: string,
  organizationSlug: string,
  students: Array<{
    name: string;
    username: string;
    passcode: string;
  }>
): Promise<{ success: boolean; message: string; emailId?: string }> => {
  try {
    const loginUrl = `https://tryeleve.com/${organizationSlug}/login`;
    
    const emailSubject = `🎉 Student Account${students.length > 1 ? 's' : ''} Created - ${organizationName}`;
    
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🛹 Eleve</h1>
            <h2 style="margin: 10px 0 0 0; font-weight: normal;">🎉 Student Account${students.length > 1 ? 's' : ''} Ready!</h2>
          </div>
          
          <div style="padding: 30px; background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <h3 style="color: #8B5CF6; margin-top: 0;">Hi ${parentName}! 👋</h3>
            
            <p>Great news! Your child${students.length > 1 ? 'ren' : ''}'s student account${students.length > 1 ? 's have' : ' has'} been created at <strong>${organizationName}</strong>!</p>
            
            <p>🔐 <strong>Login Information:</strong></p>
            
            ${students.map(student => `
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
                <h4 style="color: #8B5CF6; margin: 0 0 10px 0;">👤 ${student.name}</h4>
                <p style="margin: 5px 0; color: #64748B;">
                  <strong>Username:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${student.username}</code>
                </p>
                <p style="margin: 5px 0; color: #64748B;">
                  <strong>Passcode:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${student.passcode}</code>
                </p>
              </div>
            `).join('')}
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                <strong>🌐 Login URL:</strong><br>
                <a href="${loginUrl}" style="color: #10B981; text-decoration: none; font-weight: bold;">${loginUrl}</a>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Go to Student Login
              </a>
            </div>
            
            <p>📱 <strong>What your child can do:</strong></p>
            <ul style="color: #64748B; margin: 20px 0;">
              <li>🎥 View their training videos and progress</li>
              <li>🏆 Track achievements and earned badges</li>
              <li>📊 See their skill development over time</li>
              <li>🎯 Set goals and work towards new tricks</li>
              <li>💬 Connect with coaches and teammates</li>
            </ul>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>🔒 Security Note:</strong> Please keep these login credentials secure. You can change the passcode anytime through your parent portal.
              </p>
            </div>
            
            <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
              Questions? Reply to this email or contact your academy administrator.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              This notification was sent by ${organizationName} through Eleve.<br>
              Welcome to the action sports family! 🛹
            </p>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: parentEmail,
      subject: emailSubject,
      html: emailBody,
      tags: [
        { name: 'type', value: 'student-credentials' },
        { name: 'organization', value: sanitizeTagValue(organizationName) },
        { name: 'student_count', value: students.length.toString() }
      ]
    });
  } catch (error) {
    console.error('❌ Error sending student credentials email:', error);
    return {
      success: false,
      message: 'Failed to send credentials email'
    };
  }
};

// DEPRECATED: Direct email sending from client is insecure
// This function has been disabled for security reasons
// Use Supabase Edge Functions instead: supabase.functions.invoke('send-invitation-email')
const sendEmail = async (emailData: {
  to: string;
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<{ success: boolean; message: string; emailId?: string }> => {
  console.error('🚫 sendEmail function is disabled for security reasons');
  console.error('💡 Use Supabase Edge Functions instead: supabase.functions.invoke("send-invitation-email")');
  return {
    success: false,
    message: 'Direct email sending from client is disabled for security. Use Edge Functions instead.'
  };
};

// Function to get organization name for email
export const getOrganizationNameForEmail = async (organizationId: string): Promise<string> => {
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization name:', error);
      return 'Your Academy';
    }

    return organization?.name || 'Your Academy';
  } catch (error) {
    console.error('Error in getOrganizationNameForEmail:', error);
    return 'Your Academy';
  }
}; 