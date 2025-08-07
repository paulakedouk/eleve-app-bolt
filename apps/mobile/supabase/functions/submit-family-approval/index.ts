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
  notes: string;
}

interface ParentData {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

interface SubmitFamilyRequest {
  parentData: ParentData;
  children: ChildData[];
  additionalNotes?: string;
  invitationCode: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Processing family approval submission...')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })
    
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
    
    // Create client with service role key for authenticated requests
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    let requestData: SubmitFamilyRequest;
    try {
      requestData = await req.json()
      console.log('✅ Request body parsed successfully')
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request body format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Ensure children array exists (can be empty for initial registration)
    const children = requestData.children || [];
    
    console.log('📋 Family approval data received:', {
      parentEmail: requestData.parentData?.email,
      childrenCount: children.length,
      invitationCode: requestData.invitationCode
    })
    
    // Basic validation
    if (!requestData.parentData || !requestData.invitationCode) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: parentData, invitationCode' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate invitation code exists and is valid
    console.log('🔍 Validating invitation code...')
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', requestData.invitationCode)
      .eq('status', 'pending')
      .eq('role', 'parent')
      .single()

    if (invitationError) {
      console.error('❌ Invitation validation failed:', invitationError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired invitation code' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      console.error('❌ Invitation has expired')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invitation has expired' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Valid invitation found for:', invitation.email)

    // Check if family approval already exists
    console.log('🔍 Checking for existing family approval...')
    const { data: existingApproval } = await supabase
      .from('family_approvals')
      .select('id')
      .eq('parent_email', requestData.parentData.email.toLowerCase())
      .eq('organization_id', invitation.organization_id)
      .single()

    if (existingApproval) {
      console.error('❌ Family approval already exists')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Application already submitted for this family' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 1: Create parent auth.users record
    console.log('👤 Creating parent auth.users account...')
    
    // First check if user already exists
    let authUser;
    const { data: allUsers } = await supabase.auth.admin.listUsers()
    const existingUser = allUsers.users.find(user => user.email === requestData.parentData.email.toLowerCase())
    
    if (existingUser) {
      console.log('✅ Parent auth.users record already exists:', existingUser.id)
      authUser = existingUser
    } else {
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: requestData.parentData.email.toLowerCase(),
        password: requestData.parentData.password || 'temporary123!', // Use provided password or fallback
        email_confirm: true, // Skip email confirmation since invitation was already sent to verified email
        user_metadata: {
          role: 'parent',
          name: requestData.parentData.name,
          phone: requestData.parentData.phone,
          organization_id: invitation.organization_id
        }
      })

      if (authError) {
        console.error('❌ Error creating parent auth user:', authError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to create parent account: ${authError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('✅ Parent auth.users record created:', newUser.user.id)
      authUser = newUser.user
    }

    // Step 2: Create parent record in parents table
    console.log('👤 Creating parent record...')
    console.log('Parent data to insert:', {
      id: authUser.id,
      organization_id: invitation.organization_id,
      phone_number: requestData.parentData.phone,
      notification_preferences: { email: true, sms: false }
    })
    
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .upsert({
        id: authUser.id,
        organization_id: invitation.organization_id,
        phone_number: requestData.parentData.phone,
        notification_preferences: { email: true, sms: false }
      })
      .select()

    if (parentError) {
      console.error('❌ Error creating parent record:', parentError)
      console.error('❌ Error details:', JSON.stringify(parentError, null, 2))
      console.error('❌ Auth user ID:', authUser.id)
      console.error('❌ Organization ID:', invitation.organization_id)
      
      // Clean up auth user if parent record creation fails
      await supabase.auth.admin.deleteUser(authUser.id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create parent profile: ${parentError.message}`,
          details: parentError
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Parent record created successfully:', parentData)

    // Step 3: Create family approval record (children will be created after approval)
    console.log('📝 Creating family approval record...')
    console.log('Family approval data to insert:', {
      parent_email: requestData.parentData.email.toLowerCase(),
      parent_name: requestData.parentData.name,
      organization_id: invitation.organization_id,
      status: 'pending',
      children_count: requestData.children?.length || 0,
      has_admin_notes: !!requestData.additionalNotes
    })

    const { data: approvalData, error: approvalError } = await supabase
      .from('family_approvals')
      .insert({
        parent_email: requestData.parentData.email.toLowerCase(),
        parent_name: requestData.parentData.name,
        parent_username: requestData.parentData.email.toLowerCase(),
        parent_password_hash: 'temporary123!', // This will be updated later
        children_data: children,
        organization_id: invitation.organization_id,
        admin_notes: requestData.additionalNotes,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      })
      .select()
      .single()

    if (approvalError) {
      console.error('❌ Error creating family approval:', approvalError)
      console.error('❌ Family approval error details:', JSON.stringify(approvalError, null, 2))
      // Clean up created records
      await supabase.from('parents').delete().eq('id', authUser.id)
      await supabase.auth.admin.deleteUser(authUser.id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to submit application for approval: ${approvalError.message}`,
          details: approvalError
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Family approval created successfully:', approvalData.id)

    // Step 4: Mark invitation as used
    console.log('🔄 Marking invitation as used...')
    const { error: inviteUpdateError } = await supabase
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('code', requestData.invitationCode)

    if (inviteUpdateError) {
      console.error('❌ Error updating invitation status:', inviteUpdateError)
      // Don't fail the whole process for this
    }

    // Get organization name for response
    console.log('🏢 Fetching organization name...')
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .single()

    if (orgError) {
      console.error('❌ Error fetching organization:', orgError)
      // Don't fail for this, use default
    }

    console.log('🎉 Family approval submission completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Family application submitted successfully! An administrator will review your request.',
        approvalId: approvalData.id,
        organizationName: organization?.name || 'Academy',
        parentId: authUser.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in submit-family-approval function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred while processing your application' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 