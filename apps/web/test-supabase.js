// Simple test script to check Supabase connectivity
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://noaeiuejccwfabjhjndy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWVpdWVqY2N3ZmFiamhqbmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMTk3ODEsImV4cCI6MjA2NzU5NTc4MX0.E33Wv1XDmjxrzxaTYCbbJwVfa7GackRrMYUtLFbvEk4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('🔍 Testing Supabase connectivity...');
    
    // Test basic connectivity by checking students table
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, user_id')
      .limit(5);
    
    console.log('👨‍🎓 Students in database:', { students, studentsError });
    
    // Check if any auth users exist with @child.eleve.app emails
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot list auth users (need service role key):', authError.message);
    } else {
      console.log('👥 Auth users found:', authUsers.users.length);
      const childUsers = authUsers.users.filter(u => u.email?.includes('@child.eleve.app'));
      console.log('🧒 Child users:', childUsers.map(u => ({ email: u.email, id: u.id })));
    }
    
    // Test the get_user_role function
    if (students && students.length > 0) {
      const testStudent = students[0];
      if (testStudent.user_id) {
        console.log('🎯 Testing get_user_role function with student:', testStudent.name);
        const { data: role, error: roleError } = await supabase
          .rpc('get_user_role', { user_id: testStudent.user_id });
        console.log('🔍 Role detection result:', { role, roleError });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupabase(); 