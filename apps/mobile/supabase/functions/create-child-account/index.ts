// Child account creation with RLS bypass
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🚀 Child Account Creation - RLS Bypass Version')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Step 1: Setup')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    })
    console.log('✅ Supabase client with service role initialized')

    console.log('🔍 Step 2: Parse request')
    let requestBody;
    try {
      requestBody = await req.json()
      console.log('✅ Request body parsed:', JSON.stringify(requestBody, null, 2))
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      throw new Error('Invalid JSON in request body')
    }
    
    // Handle username availability check requests
    if (requestBody.checkUsernameOnly === true && requestBody.username) {
      console.log('🔍 Username availability check for:', requestBody.username)
      
      try {
        const childEmail = `${requestBody.username.trim()}@child.eleve.app`
        console.log('🔍 Checking email:', childEmail)
        
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          console.error('❌ Error listing users:', listError.message)
          return new Response(
            JSON.stringify({
              success: true,
              usernameAvailable: false,
              error: 'Error checking username availability',
              details: listError.message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        console.log('✅ Retrieved users list, count:', existingUsers?.users?.length || 0)
        
        const usernameExists = existingUsers.users.some((u: any) => u.email === childEmail)
        const isAvailable = !usernameExists
        
        console.log('✅ Username check result:', { username: requestBody.username, available: isAvailable })
        
        return new Response(
          JSON.stringify({
            success: true,
            usernameAvailable: isAvailable,
            message: isAvailable ? 'Username is available' : 'Username is already taken'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (usernameError: any) {
        console.error('❌ Error in username check:', usernameError)
        return new Response(
          JSON.stringify({
            success: true,
            usernameAvailable: false,
            error: 'Error checking username availability',
            details: usernameError?.message || 'Unknown error'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // Handle full account creation requests
    const { childData } = requestBody
    if (!childData) {
      console.error('❌ Missing childData in request')
      throw new Error('Missing childData')
    }
    console.log('✅ Request parsed for child:', childData.child_name)

    console.log('🔍 Step 3: Validate fields')
    const required = ['parent_user_id', 'child_name', 'child_username', 'child_password']
    for (const field of required) {
      if (!childData[field]) throw new Error(`Missing required field: ${field}`)
    }
    console.log('✅ All required fields present')

    console.log('🔍 Step 4: Check username availability')
    const childEmail = `${childData.child_username.trim()}@child.eleve.app`
    
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw new Error(`Failed to check existing users: ${listError.message}`)
    
    const usernameExists = existingUsers.users.some((u: any) => u.email === childEmail)
    if (usernameExists) throw new Error('Username already taken. Please choose a different username.')
    console.log('✅ Username is available:', childData.child_username)

    console.log('🔍 Step 5: Create auth user')
    const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: childEmail,
      password: childData.child_password,
      email_confirm: true,
      user_metadata: {
        username: childData.child_username.trim(),
        full_name: childData.child_name.trim(),
        first_name: childData.child_name.trim().split(' ')[0],
        last_name: childData.child_name.trim().split(' ').slice(1).join(' '),
        user_role: 'student',
        age: childData.child_age,
        level: childData.child_level || 'Beginner',
        created_by_parent: childData.parent_user_id
      }
    })

    if (signUpError || !newUser.user) {
      throw new Error(`Failed to create auth user: ${signUpError?.message}`)
    }
    console.log('✅ Auth user created:', newUser.user.id)

    // Try to create database records with error handling for each step
    let profileCreated = false
    let studentCreated = false
    let linkCreated = false
    let studentId = null

    try {
      console.log('🔍 Step 6: Create profile record (using service role)')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: childEmail,
          full_name: childData.child_name.trim(),
          first_name: childData.child_name.trim().split(' ')[0],
          last_name: childData.child_name.trim().split(' ').slice(1).join(' '),
          role: 'student'
        })

      if (profileError) {
        console.log('⚠️ Profile creation failed, but continuing:', profileError.message)
      } else {
        profileCreated = true
        console.log('✅ Profile record created')
      }
    } catch (profileErr) {
      console.log('⚠️ Profile creation error, but continuing:', profileErr)
    }

    try {
      console.log('🔍 Step 7: Create student record')
             const { data: studentData, error: studentError } = await supabase
         .from('students')
         .insert({
           name: childData.child_name.trim(),
           level: childData.child_level || 'Beginner',
           age: childData.child_age || null,
           user_id: newUser.user.id,
           coach_id: null, // No coach assigned yet - parent is not a coach
           parent_id: childData.parent_user_id, // Will work after migration
           xp_points: 0,
           total_videos: 0,
           landed_tricks: 0,
           session_count: 0
         })
        .select()
        .single()

      if (studentError) {
        console.log('⚠️ Student creation failed:', studentError.message)
      } else {
        studentCreated = true
        studentId = studentData.id
        console.log('✅ Student record created:', studentId)
      }
    } catch (studentErr) {
      console.log('⚠️ Student creation error:', studentErr)
    }

         // Step 8: Parent linking is now handled by parent_id column in students table
     linkCreated = studentCreated // If student was created, parent link is automatic
     if (linkCreated) {
       console.log('✅ Student automatically linked to parent via parent_id column')
     }

    // Success response (auth user is created, database records are optional)
    const successResponse = {
      success: true,
      message: 'Student account created successfully!',
      data: {
        child_user_id: newUser.user.id,
        student_id: studentId,
        username: childData.child_username,
        email: childEmail,
        records_created: {
          auth_user: true,
          profile: profileCreated,
          student: studentCreated,
          parent_link: linkCreated
        },
        login_info: {
          username: childData.child_username,
          password: childData.child_password,
          note: 'Child can log in with these credentials on the main login screen'
        }
      }
    }

    console.log('🎉 SUCCESS! Child account created:', successResponse.data)
    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('❌ ERROR in child account creation:', error.message)
    console.error('❌ Full error details:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create child account',
        details: 'Check server logs for more information'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 