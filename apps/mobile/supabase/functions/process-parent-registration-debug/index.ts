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
  parentEmail: string;
  parentUsername?: string;
  parentPassword: string;
  children: ChildData[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 DEBUG: Processing parent registration request...')
    
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
    
    console.log('📋 DEBUG: Registration data received:', {
      invitationCode: registrationData.invitationCode,
      parentEmail: registrationData.parentEmail,
      childrenCount: registrationData.children?.length || 0
    })
    
    // Basic validation
    if (!registrationData.invitationCode || !registrationData.parentEmail || 
        !registrationData.parentPassword || !registrationData.children || 
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

    // DEBUG: Check if tables exist
    console.log('🔍 DEBUG: Checking if tables exist...')
    
    try {
      const { data: invitationsTest } = await supabase
        .from('invitations')
        .select('count')
        .limit(1)
      console.log('✅ invitations table exists')
    } catch (error) {
      console.error('❌ invitations table missing:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database not configured - invitations table missing' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    try {
      const { data: familyApprovalsTest } = await supabase
        .from('family_approvals')
        .select('count')
        .limit(1)
      console.log('✅ family_approvals table exists')
    } catch (error) {
      console.error('❌ family_approvals table missing:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database not configured - family_approvals table missing' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // DEBUG: Try to find the invitation
    console.log('🔍 DEBUG: Looking for invitation code:', registrationData.invitationCode)
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', registrationData.invitationCode)
      .single()

    if (invitationError) {
      console.error('❌ Invitation lookup failed:', invitationError)
      
      // Check if any invitations exist at all
      const { data: allInvitations } = await supabase
        .from('invitations')
        .select('code, email, role, status')
        .limit(5)
      
      console.log('🔍 DEBUG: Available invitations:', allInvitations)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invitation not found. Debug info: ' + JSON.stringify(allInvitations) 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ DEBUG: Found invitation:', invitation)

    // For DEBUG: Skip most validation and try to create approval record
    const childrenData = registrationData.children.map(child => ({
      name: child.name,
      age: child.age,
      level: child.level,
      username: child.username,
      password: child.password
    }))

    console.log('✅ DEBUG: Creating family approval record...')

    // Create family approval record
    const { data: approvalData, error: approvalError } = await supabase
      .from('family_approvals')
      .insert({
        invitation_code: registrationData.invitationCode,
        parent_email: registrationData.parentEmail.toLowerCase(),
        parent_name: registrationData.parentUsername || registrationData.parentEmail.split('@')[0],
        parent_username: registrationData.parentUsername || registrationData.parentEmail,
        parent_password_hash: registrationData.parentPassword,
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
          error: 'Failed to create approval record: ' + JSON.stringify(approvalError) 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ DEBUG: Family approval created successfully:', approvalData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'DEBUG: Registration submitted successfully!',
        approvalId: approvalData.id,
        debug: {
          invitation: invitation,
          approval: approvalData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ DEBUG: Error in process-parent-registration function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'DEBUG: Unexpected error - ' + error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 