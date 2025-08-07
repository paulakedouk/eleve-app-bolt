import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChildData {
  name: string;
  age: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  notes?: string;
  profile_image?: string;
}

interface ApproveFamilyRequest {
  id: string;
  adminId: string;
}

function createApprovalEmailTemplate(parentName: string, organizationName: string, children: ChildData[]): string {
  const childrenBlocks = children.map(child => 
    `<div style="background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); font-weight: 500; color: #374151;">
      <strong>${child.name}</strong> - Age: ${child.age}, Level: ${child.level}
    </div>`
  ).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <!-- Header Block -->
        <div style="background: #fff; padding: 40px 30px; text-align: center; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
          <img src="https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-logo.svg" alt="Eleve" style="height: 48px; margin-bottom: 20px;">
          <div style="background: #dcfce7; color: #166534; margin: 20px 0 0 0; padding: 12px 24px; border-radius: 12px; display: inline-block; font-size: 16px; font-weight: 600;">
            Family Approved
          </div>
        </div>
        
        <!-- Main Content Block -->
        <div style="background: #fff; padding: 40px 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1f2937;">
            Hi ${parentName}!
          </h2>
          
          <p style="font-size: 16px; font-weight: 400; margin: 0 0 32px 0; color: #4b5563; line-height: 1.7;">
            Your family registration with <strong style="color: #1f2937;">${organizationName}</strong> has been approved! Your children's accounts are now active.
          </p>
          
          <!-- Approved Students Block -->
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 12px; padding: 24px; margin: 32px 0;">
            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
              Approved Student Accounts:
            </h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${childrenBlocks}
            </div>
          </div>
          
          <!-- Next Steps Block -->
          <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 32px 0;">
            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
              What's next:
            </h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); font-weight: 500; color: #374151;">
                Download the Eleve mobile app
              </div>
              <div style="background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); font-weight: 500; color: #374151;">
                Your children can now log in with their usernames
              </div>
              <div style="background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); font-weight: 500; color: #374151;">
                Start tracking their skateboarding progress
              </div>
              <div style="background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); font-weight: 500; color: #374151;">
                View detailed progress reports and achievements
              </div>
              <div style="background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); font-weight: 500; color: #374151;">
                Connect with coaches and academy staff
              </div>
            </div>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://tryeleve.com/login" style="background: #22c55e; color: #fff; padding: 16px 32px; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.2s;">
              Get Started Now
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
            <p style="color: #6b7280; font-size: 14px; font-weight: 400; margin: 0 0 8px 0;">
              Need help getting started? Contact your academy administrator.
            </p>
            <p style="color: #9ca3af; font-size: 12px; font-weight: 400; margin: 0;">
              Sent by ${organizationName} via Eleve
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Processing family approval request...')
    
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const requestData: ApproveFamilyRequest = await req.json()
    console.log('📋 Approval request data:', { id: requestData.id, adminId: requestData.adminId })
    
    // Validate required fields
    if (!requestData.id || !requestData.adminId) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: id, adminId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 1: Load the family_approvals record
    console.log('🔍 Loading family approval record...')
    const { data: familyApproval, error: familyError } = await supabase
      .from('family_approvals')
      .select('*')
      .eq('id', requestData.id)
      .eq('status', 'pending')
      .single()

    if (familyError || !familyApproval) {
      console.error('❌ Family approval not found or already processed:', familyError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Family approval not found or already processed' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Family approval loaded:', {
      parentEmail: familyApproval.parent_email,
      parentName: familyApproval.parent_name,
      organizationId: familyApproval.organization_id,
      childrenCount: Array.isArray(familyApproval.children_data) ? familyApproval.children_data.length : 0
    })

    // Step 2: Parse children_data array
    const childrenData: ChildData[] = Array.isArray(familyApproval.children_data) 
      ? familyApproval.children_data 
      : []

    if (childrenData.length === 0) {
      console.error('❌ No children data found in family approval')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No children data found in family approval' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📝 Children to create accounts for:', childrenData.map(child => ({ name: child.name, age: child.age, level: child.level })))

    // Step 3: Create accounts for each child
    const createdStudents = []
    for (const child of childrenData) {
      try {
        console.log(`👤 Creating account for: ${child.name}`)
        
        // Generate username from name (convert to lowercase, remove spaces)
        const baseUsername = child.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        let username = baseUsername
        let usernameCounter = 1
        
        // Check for username availability and increment if needed
        let usernameAvailable = false
        while (!usernameAvailable) {
          const childEmail = `${username}@child.eleve.app`
          const { data: existingUsers } = await supabase.auth.admin.listUsers()
          const usernameExists = existingUsers.users.some((u: any) => u.email === childEmail)
          
          if (!usernameExists) {
            usernameAvailable = true
          } else {
            username = `${baseUsername}${usernameCounter}`
            usernameCounter++
          }
        }

        console.log(`✅ Available username found: ${username}`)

        // Create auth user for the child
        const childEmail = `${username}@child.eleve.app`
        const childPassword = `${child.name.replace(/\s+/g, '')}123!` // Simple password based on name
        
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: childEmail,
          password: childPassword,
          email_confirm: true,
          user_metadata: {
            username: username,
            full_name: child.name,
            first_name: child.name.split(' ')[0],
            last_name: child.name.split(' ').slice(1).join(' '),
            user_role: 'student',
            age: child.age,
            level: child.level
          }
        })

        if (authError || !newUser.user) {
          console.error(`❌ Failed to create auth user for ${child.name}:`, authError)
          throw new Error(`Failed to create auth user for ${child.name}: ${authError?.message}`)
        }

        console.log(`✅ Auth user created for ${child.name}:`, newUser.user.id)

        // Create profiles record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUser.user.id,
            email: childEmail,
            full_name: child.name,
            role: 'student',
            organization_id: familyApproval.organization_id
          })

        if (profileError) {
          console.error(`❌ Failed to create profile for ${child.name}:`, profileError)
          // Clean up auth user
          await supabase.auth.admin.deleteUser(newUser.user.id)
          throw new Error(`Failed to create profile for ${child.name}: ${profileError.message}`)
        }

        console.log(`✅ Profile created for ${child.name}`)

                 // Create students record
         const { data: studentData, error: studentError } = await supabase
           .from('students')
           .insert({
             name: child.name,
             level: child.level,
             age: child.age,
             profile_image: child.profile_image || null,
             user_id: newUser.user.id,
             organization_id: familyApproval.organization_id,
             coach_id: null, // No coach assigned initially
             is_approved: true,
             is_active: true
           })
           .select()
           .single()

        if (studentError) {
          console.error(`❌ Failed to create student record for ${child.name}:`, studentError)
          // Clean up created records
          await supabase.from('profiles').delete().eq('id', newUser.user.id)
          await supabase.auth.admin.deleteUser(newUser.user.id)
          throw new Error(`Failed to create student record for ${child.name}: ${studentError.message}`)
        }

        console.log(`✅ Student record created for ${child.name}:`, studentData.id)

        createdStudents.push({
          name: child.name,
          username: username,
          email: childEmail,
          password: childPassword,
          userId: newUser.user.id,
          studentId: studentData.id
        })

      } catch (childError) {
        console.error(`❌ Error creating account for ${child.name}:`, childError)
        // Continue with other children but log the error
        // In a production system, you might want to rollback all changes if any child fails
      }
    }

    if (createdStudents.length === 0) {
      console.error('❌ Failed to create any student accounts')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create any student accounts' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Successfully created ${createdStudents.length} student accounts`)

    // Step 4: Update the family_approvals record
    console.log('📝 Updating family approval record...')
    const { error: updateError } = await supabase
      .from('family_approvals')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: requestData.adminId
      })
      .eq('id', requestData.id)

    if (updateError) {
      console.error('❌ Failed to update family approval:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Student accounts created but failed to update approval status: ${updateError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Family approval record updated')

    // Step 5: Send email notification (optional)
    try {
      console.log('📧 Sending approval email...')
      
      // Get organization name
      const { data: organization } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', familyApproval.organization_id)
        .single()

      const organizationName = organization?.name || 'Academy'
      
      // Get Resend API configuration
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@tryeleve.com'
      const fromName = Deno.env.get('FROM_NAME') || 'Eleve Academy'

      if (resendApiKey) {
        const emailSubject = `🎉 Family Registration Approved - ${organizationName}`
        const emailBody = createApprovalEmailTemplate(familyApproval.parent_name, organizationName, childrenData)

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [familyApproval.parent_email],
            subject: emailSubject,
            html: emailBody,
            tags: [
              { name: 'type', value: 'family-approval' },
              { name: 'organization', value: organizationName.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() }
            ]
          })
        })

        if (emailResponse.ok) {
          console.log('✅ Approval email sent successfully')
        } else {
          console.error('❌ Failed to send approval email:', await emailResponse.text())
        }
      } else {
        console.log('⚠️ Resend API key not configured, skipping email notification')
      }
    } catch (emailError) {
      console.error('❌ Error sending approval email:', emailError)
      // Don't fail the whole process for email issues
    }

    console.log('🎉 Family approval process completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Family approval processed successfully! Created ${createdStudents.length} student accounts.`,
        data: {
          approvalId: requestData.id,
          parentEmail: familyApproval.parent_email,
          parentName: familyApproval.parent_name,
          studentsCreated: createdStudents.map(student => ({
            name: student.name,
            username: student.username,
            studentId: student.studentId
          })),
          totalStudentsCreated: createdStudents.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in approve-family-request function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred while processing the family approval' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 