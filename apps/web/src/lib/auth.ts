import { supabase } from './supabase';

export type UserRole = 'student' | 'coach' | 'parent' | 'admin' | 'business';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile?: any;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    const role = await getUserRole(user.id);
    if (!role) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    console.log('🔍 Getting role for user:', userId);
    
    // Try the RPC function first
    const { data: userRole, error: roleError } = await supabase
      .rpc('get_user_role', { user_id: userId });

    console.log('🎯 RPC result:', { userRole, roleError });

    if (!roleError && userRole) {
      console.log('✅ Found role via RPC:', userRole);
      return userRole as UserRole;
    }

    console.warn('RPC function error, using fallback method:', roleError);
    
    // Fallback: Check role tables directly
    // Check admins table
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (adminData) {
      return 'admin';
    }
    
    // Check coaches table
    const { data: coachData } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (coachData) {
      return 'coach';
    }
    
    // Check parents table
    const { data: parentData } = await supabase
      .from('parents')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (parentData) {
      return 'parent';
    }
    
    // Check students table
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, name, user_id')
      .eq('user_id', userId)
      .single();
    
    console.log('👨‍🎓 Student check:', { studentData, studentError });
    
    if (studentData) {
      console.log('✅ Found student role via fallback');
      return 'student';
    }
    
    console.log('❌ No role found for user');
    return null;
  } catch (error) {
    console.error('Error determining user role:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    window.location.href = '/';
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

export function redirectToDashboard(role: UserRole): void {
  switch (role) {
    case 'business':
    case 'admin':
      window.location.href = '/admin/dashboard';
      break;
    case 'coach':
      window.location.href = '/coach/dashboard';
      break;
    case 'parent':
      window.location.href = '/parent/dashboard';
      break;
    case 'student':
      window.location.href = '/student/dashboard';
      break;
    default:
      window.location.href = '/dashboard';
  }
} 