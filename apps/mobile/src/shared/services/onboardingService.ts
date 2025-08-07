import { supabase } from '../lib/supabase';

// Generate secure token (React Native compatible)
function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate 6-digit passcode
function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if username is available within an organization
export async function checkUsernameAvailability(username: string, organizationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('username')
      .eq('username', username)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error checking username availability:', error);
      return false;
    }

    return data.length === 0;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

// Get user role from role-specific tables
export async function getUserRole(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_user_role', { user_id: userId });
    
    if (error) {
      console.error('Error getting user role:', error);
      return 'business';
    }

    return data || 'business';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'business';
  }
}

// Get user's organization ID
export async function getUserOrganization(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_organization', { user_id: userId });
    
    if (error) {
      console.error('Error getting user organization:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
}

// Get complete user information
export async function getUserInfo(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_user_info', { user_id: userId });
    
    if (error) {
      console.error('Error getting user info:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Create coach invitation
export async function createCoachInvitation(
  email: string,
  organizationId: string,
  invitedBy: string
): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { data, error } = await supabase
      .from('invitations')
      .insert([
        {
          email,
          role: 'coach',
          organization_id: organizationId,
          invited_by: invitedBy,
          status: 'pending',
          token,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating coach invitation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, invitationId: data.id };
  } catch (error: any) {
    console.error('Error creating coach invitation:', error);
    return { success: false, error: error.message };
  }
}

// Create parent invitation
export async function createParentInvitation(
  email: string,
  organizationId: string,
  invitedBy: string
): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { data, error } = await supabase
      .from('invitations')
      .insert([
        {
          email,
          role: 'parent',
          organization_id: organizationId,
          invited_by: invitedBy,
          status: 'pending',
          token,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating parent invitation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, invitationId: data.id };
  } catch (error: any) {
    console.error('Error creating parent invitation:', error);
    return { success: false, error: error.message };
  }
}

// Process coach signup
export async function processCoachSignup(
  invitationToken: string,
  userData: {
    email: string;
    password: string;
    fullName: string;
    specialties?: string[];
    certificationLevel?: string;
    bio?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', invitationToken)
      .eq('status', 'pending')
      .eq('role', 'coach')
      .single();

    if (invitationError || !invitation) {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      return { success: false, error: 'Invitation has expired' };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
        },
      },
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Create coach record
    const { error: coachError } = await supabase
      .from('coaches')
      .insert([
        {
          id: authData.user.id,
          organization_id: invitation.organization_id,
          specialties: userData.specialties || [],
          certification_level: userData.certificationLevel,
          bio: userData.bio,
          is_active: true,
        },
      ]);

    if (coachError) {
      console.error('Error creating coach record:', coachError);
      return { success: false, error: 'Failed to create coach profile' };
    }

    // Update invitation status
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    return { success: true };
  } catch (error: any) {
    console.error('Error processing coach signup:', error);
    return { success: false, error: error.message };
  }
}

// Process parent signup
export async function processParentSignup(
  invitationToken: string,
  userData: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', invitationToken)
      .eq('status', 'pending')
      .eq('role', 'parent')
      .single();

    if (invitationError || !invitation) {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      return { success: false, error: 'Invitation has expired' };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
        },
      },
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Create parent record
    const { error: parentError } = await supabase
      .from('parents')
      .insert([
        {
          id: authData.user.id,
          organization_id: invitation.organization_id,
          phone_number: userData.phoneNumber,
          emergency_contact: userData.emergencyContact,
          emergency_phone: userData.emergencyPhone,
          notification_preferences: { email: true, sms: false },
        },
      ]);

    if (parentError) {
      console.error('Error creating parent record:', parentError);
      return { success: false, error: 'Failed to create parent profile' };
    }

    // Update invitation status
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    return { success: true };
  } catch (error: any) {
    console.error('Error processing parent signup:', error);
    return { success: false, error: error.message };
  }
}

// Create student account (after parent approval)
export async function createStudentAccount(
  organizationId: string,
  studentData: {
    fullName: string;
    age: number;
    username: string;
    skillLevel?: string;
  }
): Promise<{ success: boolean; student?: any; error?: string }> {
  try {
    // Check if username is available
    const isAvailable = await checkUsernameAvailability(studentData.username, organizationId);
    if (!isAvailable) {
      return { success: false, error: 'Username is already taken' };
    }

    const passcode = generatePasscode();

    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          organization_id: organizationId,
          username: studentData.username,
          passcode,
          full_name: studentData.fullName,
          age: studentData.age,
          skill_level: studentData.skillLevel || 'Beginner',
          xp_points: 0,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating student account:', error);
      return { success: false, error: error.message };
    }

    return { success: true, student: data };
  } catch (error: any) {
    console.error('Error creating student account:', error);
    return { success: false, error: error.message };
  }
}

// Authenticate student (username + passcode)
export async function authenticateStudent(
  username: string,
  passcode: string,
  organizationId: string
): Promise<{ success: boolean; student?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('username', username)
      .eq('passcode', passcode)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error authenticating student:', error);
      return { success: false, error: 'Invalid username or passcode' };
    }

    return { success: true, student: data };
  } catch (error: any) {
    console.error('Error authenticating student:', error);
    return { success: false, error: error.message };
  }
}

// Get organization by slug
export async function getOrganizationBySlug(slug: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error getting organization:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting organization:', error);
    return null;
  }
}

// Get user's role-specific data
export async function getUserRoleData(userId: string, role: string): Promise<any> {
  try {
    let data = null;
    let error = null;

    switch (role) {
      case 'admin':
        ({ data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('id', userId)
          .single());
        break;
      case 'coach':
        ({ data, error } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', userId)
          .single());
        break;
      case 'parent':
        ({ data, error } = await supabase
          .from('parents')
          .select('*')
          .eq('id', userId)
          .single());
        break;
      case 'partner':
        ({ data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('id', userId)
          .single());
        break;
      default:
        return null;
    }

    if (error) {
      console.error(`Error getting ${role} data:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error getting ${role} data:`, error);
    return null;
  }
} 