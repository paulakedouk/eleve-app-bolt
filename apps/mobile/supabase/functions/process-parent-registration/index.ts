import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChildData {
  name: string;
  age: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  username: string;
  password: string;
}

interface RegistrationRequest {
  invitationCode: string;
  children: ChildData[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Processing parent registration request...')
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
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
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const registrationData: RegistrationRequest = await req.json()
    
    console.log('📋 Registration data received:', {
      invitationCode: registrationData.invitationCode,
      childrenCount: registrationData.children?.length || 0
    })
    
    // Basic validation
    if (!registrationData.invitationCode || !registrationData.children || 
        registrationData.children.length === 0) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
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
      .eq('code', registrationData.invitationCode)
      .eq('status', 'pending')
      .eq('role', 'parent')
      .single()

    if (invitationError) {
      console.error('❌ Invitation lookup failed. Used code:', registrationData.invitationCode);
      console.error('❌ Invitation validation failed:', invitationError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid invitation code' 
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

    // Log invitation details
    console.log('✅ Valid invitation found for:', invitation.email)

    // Check if registration already exists
    console.log('🔍 Checking for existing registration...')
    const { data: existingApproval } = await supabase
      .from('family_approvals')
      .select('id')
      .eq('invitation_code', registrationData.invitationCode)
      .single()

    if (existingApproval) {
      console.error('❌ Registration already exists')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Registration already submitted for this invitation' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare children data (store passwords as plain text temporarily)
    const childrenData = registrationData.children.map(child => ({
      name: child.name,
      age: child.age,
      level: child.level,
      username: child.username,
      password: child.password
    }))

    console.log('✅ Creating family approval record...')

    // Create family approval record
    const { data: approvalData, error: approvalError } = await supabase
      .from('family_approvals')
      .insert({
        invitation_code: registrationData.invitationCode,
        parent_email: invitation.email,
        parent_name: invitation.email.split('@')[0],
        children_data: childrenData,
        organization_id: invitation.organization_id,
        status: 'pending'
      })
      .select()
      .single()

    if (approvalError) {
      console.error('❌ Error creating family approval:', approvalError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to submit registration for approval' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Family approval created successfully:', approvalData.id)

    // Get organization name for response
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration submitted successfully! An admin will review your request and you will be notified when approved.',
        approvalId: approvalData.id,
        organizationName: organization?.name || 'Academy'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in process-parent-registration function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 