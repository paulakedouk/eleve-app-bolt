// Check Maya's auth user details
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://noaeiuejccwfabjhjndy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWVpdWVqY2N3ZmFiamhqbmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMTk3ODEsImV4cCI6MjA2NzU5NTc4MX0.E33Wv1XDmjxrzxaTYCbbJwVfa7GackRrMYUtLFbvEk4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaya() {
  try {
    // Get Maya's student record
    const { data: maya, error: mayaError } = await supabase
      .from('students')
      .select('*')
      .eq('name', 'Maya')
      .single();
    
    console.log('👩 Maya student record:', maya);
    
    if (maya && maya.user_id) {
      console.log('🔑 Maya\'s auth user ID:', maya.user_id);
      
      // Try to test login with different email patterns
      const testEmails = [
        'maya@child.eleve.app',
        'maya@test.com',
        maya.user_id + '@child.eleve.app'
      ];
      
      console.log('🧪 Testing potential email addresses for Maya:');
      for (const email of testEmails) {
        console.log(`📧 Testing: ${email}`);
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'test123'
          });
          
          if (error) {
            console.log(`   ❌ ${error.message}`);
          } else {
            console.log(`   ✅ SUCCESS! Maya can login with: ${email}`);
            // Sign out immediately
            await supabase.auth.signOut();
          }
        } catch (e) {
          console.log(`   ❌ ${e.message}`);
        }
      }
      
      // Also test the role function with Maya's user_id
      console.log('🎯 Testing get_user_role for Maya...');
      const { data: role, error: roleError } = await supabase
        .rpc('get_user_role', { user_id: maya.user_id });
      console.log('Role result:', { role, roleError });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMaya(); 