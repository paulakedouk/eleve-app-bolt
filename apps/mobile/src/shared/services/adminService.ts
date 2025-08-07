import { supabase } from '../lib/supabase';
import { sendCoachInvitation, sendParentInvitation } from './emailService';

// Type definitions for AdminHomeScreen
export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  is_owner: boolean;
  permissions: any;
  created_at: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  slug?: string;
  subscription_plan: string;
  created_at: string;
  member_count: number;
  active_sessions: number;
}

export interface AdminStats {
  total_students: number;
  total_coaches: number;
  total_parents: number;
  active_sessions: number;
  total_videos: number;
  total_tricks: number;
  tricks_landed: number;
  monthly_revenue: number;
  growth_percentage: number;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  recipient_name?: string;
}

export interface ActivityData {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user_name?: string;
}

// Get admin profile for the current user
export async function getAdminProfile(): Promise<AdminProfile | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Not authenticated:', userError);
      return null;
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select(`
        *,
        organization:organizations(name, logo_url)
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching admin profile:', error);
      return null;
    }

    return {
      id: admin.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Admin User',
      organization_id: admin.organization_id,
      organization_name: admin.organization?.name || 'Your Organization',
      organization_logo_url: admin.organization?.logo_url || null,
      is_owner: admin.is_owner,
      permissions: admin.permissions,
      created_at: admin.created_at,
    };
  } catch (error) {
    console.error('Error getting admin profile:', error);
    return null;
  }
}

// Get organization data
export async function getOrganizationData(organizationId: string): Promise<OrganizationData | null> {
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }

    // Get member counts
    const [adminsCount, coachesCount, parentsCount] = await Promise.all([
      supabase.from('admins').select('id', { count: 'exact' }).eq('organization_id', organizationId),
      supabase.from('coaches').select('id', { count: 'exact' }).eq('organization_id', organizationId),
      supabase.from('parents').select('id', { count: 'exact' }).eq('organization_id', organizationId),
    ]);

    const memberCount = (adminsCount.count || 0) + (coachesCount.count || 0) + (parentsCount.count || 0);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      subscription_plan: organization.subscription_plan || 'free',
      created_at: organization.created_at,
      member_count: memberCount,
      active_sessions: 0, // TODO: Implement session counting
    };
  } catch (error) {
    console.error('Error getting organization data:', error);
    return null;
  }
}

// Get organization statistics
export async function getOrganizationStats(organizationId: string): Promise<AdminStats | null> {
  try {
    const [students, coaches, parents, sessions] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact' }).eq('organization_id', organizationId),
      supabase.from('coaches').select('id', { count: 'exact' }).eq('organization_id', organizationId),
      supabase.from('parents').select('id', { count: 'exact' }).eq('organization_id', organizationId),
      supabase.from('sessions').select('id', { count: 'exact' }).eq('organization_id', organizationId).eq('is_active', true),
    ]);

    // Get session IDs for this organization
    const { data: sessionIds } = await supabase
      .from('sessions')
      .select('id')
      .eq('organization_id', organizationId);

    const sessionIdList = sessionIds?.map(s => s.id) || [];

    // Get videos count and tricks stats through sessions (since videos don't have direct organization_id)
    const [videosResult, tricksResult, tricksLandedResult] = await Promise.all([
      supabase
        .from('videos')
        .select('id', { count: 'exact' })
        .in('session_id', sessionIdList),
      
      // Count videos with trick names (total tricks attempted)
      supabase
        .from('videos')
        .select('id', { count: 'exact' })
        .in('session_id', sessionIdList)
        .not('trick_name', 'is', null),
      
      // Count videos where tricks were landed successfully
      supabase
        .from('videos')
        .select('id', { count: 'exact' })
        .in('session_id', sessionIdList)
        .not('trick_name', 'is', null)
        .eq('landed', true)
    ]);

    return {
      total_students: students.count || 0,
      total_coaches: coaches.count || 0,
      total_parents: parents.count || 0,
      active_sessions: sessions.count || 0,
      total_videos: videosResult.count || 0,
      total_tricks: tricksResult.count || 0,
      tricks_landed: tricksLandedResult.count || 0,
      monthly_revenue: 0, // TODO: Implement revenue tracking
      growth_percentage: 0, // TODO: Implement growth calculation
    };
  } catch (error) {
    console.error('Error getting organization stats:', error);
    return null;
  }
}

// Get recent activity
export async function getRecentActivity(organizationId: string): Promise<ActivityData[]> {
  try {
    // For now, return mock data since activity tracking isn't implemented
    return [
      {
        id: '1',
        type: 'enrollment',
        title: 'New Student Enrolled',
        description: 'Sarah Johnson joined the academy',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user_name: 'Sarah Johnson'
      },
      {
        id: '2',
        type: 'coach_join',
        title: 'New Coach Added',
        description: 'Mike Davis joined as a skateboarding coach',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        user_name: 'Mike Davis'
      }
    ];
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

// Approve invitation
export async function approveInvitation(invitationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (error) {
      console.error('Error approving invitation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error approving invitation:', error);
    return false;
  }
}

// Reject invitation
export async function rejectInvitation(invitationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId);

    if (error) {
      console.error('Error rejecting invitation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return false;
  }
}

// Check if database tables exist
export async function checkDatabaseTables(): Promise<{
  success: boolean;
  missingTables: string[];
  message: string;
}> {
  try {
    const requiredTables = ['organizations', 'admins', 'coaches', 'parents', 'students', 'sessions', 'videos', 'invitations'];
    const missingTables: string[] = [];

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error && error.code === '42P01') {
          // Table doesn't exist
          missingTables.push(tableName);
        }
      } catch (err: any) {
        if (err.code === '42P01') {
          missingTables.push(tableName);
        }
      }
    }

    return {
      success: missingTables.length === 0,
      missingTables,
      message: missingTables.length === 0 
        ? 'All required tables exist' 
        : `Missing tables: ${missingTables.join(', ')}`
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      success: false,
      missingTables: [],
      message: 'Failed to check database tables'
    };
  }
}

// Get user's role and organization
export async function getUserRoleAndOrganization(userId: string): Promise<{
  role: string;
  organizationId: string | null;
}> {
  try {
    const role = await supabase.rpc('get_user_role', { user_id: userId });
    const organizationId = await supabase.rpc('get_user_organization', { user_id: userId });
    
    return {
      role: role.data || 'business',
      organizationId: organizationId.data || null,
    };
  } catch (error) {
    console.error('Error getting user role and organization:', error);
    return { role: 'business', organizationId: null };
  }
}

// Create a new organization
export async function createOrganization(
  name: string,
  slug: string,
  ownerId: string
): Promise<{ success: boolean; organization?: any; error?: string }> {
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert([
        {
          name,
          slug,
          owner_id: ownerId,
          logo_url: 'https://eleve-native-app.s3.us-east-2.amazonaws.com/defaults/eleve-default-logo.png', // Default logo
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return { success: false, error: error.message };
    }

    // Create admin record for the owner
    const { error: adminError } = await supabase
      .from('admins')
      .insert([
        {
          id: ownerId,
          organization_id: organization.id,
          is_owner: true,
          permissions: {},
        },
      ]);

    if (adminError) {
      console.error('Error creating admin record:', adminError);
      return { success: false, error: 'Failed to create admin record' };
    }

    return { success: true, organization };
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return { success: false, error: error.message };
  }
}

// Create invitation for coach or parent
export async function createInvitation(
  email: string,
  role: 'coach' | 'parent',
  organizationId: string,
  invitedBy: string,
  recipientName: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate required parameters
    if (!email || !email.trim()) {
      return { success: false, message: 'Email is required' };
    }
    
    if (!recipientName || !recipientName.trim()) {
      return { success: false, message: 'Recipient name is required' };
    }
    
    if (!organizationId || !organizationId.trim()) {
      return { success: false, message: 'Organization ID is required' };
    }
    
    if (!invitedBy || !invitedBy.trim()) {
      return { success: false, message: 'Invited by user ID is required' };
    }

    // Check if user already exists by checking invitations table
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email.trim())
      .eq('organization_id', organizationId)
      .eq('status', 'pending');
    
    if (existingInvitation && existingInvitation.length > 0) {
      return { success: false, message: 'An invitation has already been sent to this email' };
    }

    // Generate secure code
    const code = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert([
        {
          email: email.trim(),
          recipient_name: recipientName.trim(),
          role,
          organization_id: organizationId,
          invited_by: invitedBy,
          code,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return { success: false, message: error.message };
    }

    // Get organization name for email
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    // Send invitation email
    const emailFunction = role === 'coach' ? sendCoachInvitation : sendParentInvitation;
    const emailResult = await emailFunction({
      recipientEmail: email.trim(),
      recipientName: recipientName.trim(),
      organizationName: organization?.name || 'Eleve',
      invitationCode: code,
      role,
      expiresAt,
    });

    if (!emailResult.success) {
      // Clean up invitation if email fails
      await supabase.from('invitations').delete().eq('id', invitation.id);
      return { success: false, message: 'Failed to send invitation email' };
    }

    return { success: true, message: `${role} invitation sent successfully` };
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return { success: false, message: error.message };
  }
}

// Create coach invitation (wrapper function for InviteCoachScreen)
export async function createCoachInvitation(
  coachName: string,
  coachEmail: string,
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate required parameters
    if (!coachName || !coachName.trim()) {
      return { success: false, message: 'Coach name is required' };
    }
    
    if (!coachEmail || !coachEmail.trim()) {
      return { success: false, message: 'Coach email is required' };
    }

    // Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Call the generic createInvitation function with coach role
    return await createInvitation(
      coachEmail,
      'coach',
      organizationId,
      user.id,
      coachName.trim()
    );
  } catch (error: any) {
    console.error('Error creating coach invitation:', error);
    return { success: false, message: error.message };
  }
}

// Create parent invitation (wrapper function for InviteParentScreen)
export async function createParentInvitation(
  parentName: string,
  parentEmail: string,
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate required parameters
    if (!parentName || !parentName.trim()) {
      return { success: false, message: 'Parent name is required' };
    }
    
    if (!parentEmail || !parentEmail.trim()) {
      return { success: false, message: 'Parent email is required' };
    }

    // Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Call the generic createInvitation function with parent role
    return await createInvitation(
      parentEmail,
      'parent',
      organizationId,
      user.id,
      parentName.trim()
    );
  } catch (error: any) {
    console.error('Error creating parent invitation:', error);
    return { success: false, message: error.message };
  }
}

// Get organization members (coaches and parents)
export async function getOrganizationMembers(organizationId: string): Promise<{
  admins: any[];
  coaches: any[];
  parents: any[];
}> {
  try {
    // Get admins
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select(`
        *,
        user:auth.users!inner(email, raw_user_meta_data)
      `)
      .eq('organization_id', organizationId);

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    }

    // Get coaches
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select(`
        *,
        user:auth.users!inner(email, raw_user_meta_data)
      `)
      .eq('organization_id', organizationId);

    if (coachesError) {
      console.error('Error fetching coaches:', coachesError);
    }

    // Get parents
    const { data: parents, error: parentsError } = await supabase
      .from('parents')
      .select(`
        *,
        user:auth.users!inner(email, raw_user_meta_data)
      `)
      .eq('organization_id', organizationId);

    if (parentsError) {
      console.error('Error fetching parents:', parentsError);
    }

    return {
      admins: admins || [],
      coaches: coaches || [],
      parents: parents || [],
    };
  } catch (error) {
    console.error('Error getting organization members:', error);
    return { admins: [], coaches: [], parents: [] };
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  details?: any 
}> {
  try {
    const tablesToCheck = ['organizations', 'admins', 'coaches', 'parents', 'students', 'sessions', 'videos', 'invitations'];
    const results = [];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        results.push({
          table,
          success: !error,
          error: error?.message,
          hasData: data && data.length > 0,
        });
      } catch (err: any) {
        results.push({
          table,
          success: false,
          error: err.message,
          hasData: false,
        });
      }
    }

    return {
      success: true,
      message: 'Database connection test completed',
      details: results,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Database connection test failed',
      details: error.message,
    };
  }
}

// Get business account by user ID
export async function getBusinessAccount(userId: string): Promise<any> {
  try {
    // Get user info using the RPC function
    const { data: userInfo, error } = await supabase.rpc('get_user_info', { user_id: userId });
    
    if (error) {
      console.error('Error getting user info:', error);
      return null;
    }

    return userInfo?.[0] || null;
  } catch (error) {
    console.error('Error getting business account:', error);
    return null;
  }
}

// Get organization by user ID
export async function getOrganizationByUserId(userId: string): Promise<any> {
  try {
    const organizationId = await supabase.rpc('get_user_organization', { user_id: userId });
    
    if (!organizationId.data) {
      return null;
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId.data)
      .single();

    if (error) {
      console.error('Error getting organization:', error);
      return null;
    }

    return organization;
  } catch (error) {
    console.error('Error getting organization by user ID:', error);
    return null;
  }
}

// Get pending invitations for organization
export async function getPendingInvitations(organizationId: string): Promise<any[]> {
  try {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }

    return invitations || [];
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    return [];
  }
}

// Get family approvals for organization
export async function getFamilyApprovals(organizationId: string): Promise<any[]> {
  try {
    const { data: approvals, error } = await supabase
      .from('family_approvals')
      .select(`
        *,
        parent:parents!family_approvals_parent_id_fkey(
          id,
          phone_number,
          emergency_contact,
          user:auth.users!inner(email, raw_user_meta_data)
        ),
        submitted_by_profile:admins!family_approvals_submitted_by_fkey(
          id,
          user:auth.users!inner(email, raw_user_meta_data)
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting family approvals:', error);
      return [];
    }

    return approvals || [];
  } catch (error) {
    console.error('Error getting family approvals:', error);
    return [];
  }
}

// Generate secure token
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get students for organization
export async function getOrganizationStudents(organizationId: string): Promise<any[]> {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        parent_relationships:parent_student_relationships(
          parent:parents!parent_student_relationships_parent_id_fkey(
            id,
            phone_number,
            profiles:auth.users!inner(email, raw_user_meta_data)
          )
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting organization students:', error);
      return [];
    }

    return students || [];
  } catch (error) {
    console.error('Error getting organization students:', error);
    return [];
  }
}

// Get coaches with their assigned students for organization
export async function getOrganizationCoaches(organizationId: string): Promise<any[]> {
  try {
    console.log('🔍 Fetching coaches for organization:', organizationId);
    
    // Get coaches with their profile data directly from coaches table
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select(`
        *
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    console.log('📊 Raw coaches query result:', { coaches, coachesError, count: coaches?.length });

    if (coachesError) {
      console.error('Error getting coaches:', coachesError);
      return [];
    }

    if (!coaches || coaches.length === 0) {
      console.log('❌ No coaches found for organization:', organizationId);
      return [];
    }

    console.log('✅ Found coaches:', coaches.length);

    // Get assigned students for each coach and transform data structure
    const coachesWithStudents = await Promise.all(
      coaches.map(async (coach) => {
        // Get assigned students
        const { data: assignments, error: assignmentsError } = await supabase
          .from('coach_student_assignments')
          .select(`
            student:students(
              id,
              full_name,
              profile_image,
              xp_points,
              skill_level,
              age
            )
          `)
          .eq('coach_id', coach.id);

        // Transform the data structure to match what the UI expects
        // Use coach profile data from the coaches table instead of auth.users
        return {
          ...coach,
          // Create a user object structure that the UI expects
          user: {
            email: coach.email || 'No email provided',
            raw_user_meta_data: {
              full_name: coach.full_name || 'Coach Name Not Set',
              avatar_url: null // We don't have avatar URLs in coaches table yet
            }
          },
          assigned_students: assignmentsError ? [] : (assignments || [])
        };
      })
    );

    console.log('👨‍🏫 Coaches with profile data:', JSON.stringify(coachesWithStudents, null, 2));
    return coachesWithStudents;
  } catch (error) {
    console.error('Error getting organization coaches:', error);
    return [];
  }
}

// Get coach profile with assigned students
export async function getCoachProfile(coachId: string): Promise<any | null> {
  try {
    const { data: coach, error } = await supabase
      .from('coaches')
      .select(`
        *,
        user:auth.users!inner(email, raw_user_meta_data),
        assigned_students:coach_student_assignments(
          student:students!coach_student_assignments_student_id_fkey(
            id,
            full_name,
            profile_image,
            xp_points,
            skill_level,
            age
          )
        )
      `)
      .eq('id', coachId)
      .single();

    if (error) {
      console.error('Error getting coach profile:', error);
      return null;
    }

    return coach;
  } catch (error) {
    console.error('Error getting coach profile:', error);
    return null;
  }
}

// Assign student to coach
export async function assignStudentToCoach(
  coachId: string,
  studentId: string,
  assignedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('coach_student_assignments')
      .select('id')
      .eq('coach_id', coachId)
      .eq('student_id', studentId)
      .single();

    if (existingAssignment) {
      return { success: false, message: 'Student is already assigned to this coach' };
    }

    // Create new assignment
    const { error } = await supabase
      .from('coach_student_assignments')
      .insert([
        {
          coach_id: coachId,
          student_id: studentId,
          assigned_by: assignedBy,
        },
      ]);

    if (error) {
      console.error('Error assigning student to coach:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Student assigned successfully' };
  } catch (error: any) {
    console.error('Error assigning student to coach:', error);
    return { success: false, message: error.message };
  }
}

// Remove student assignment from coach
export async function removeStudentAssignment(
  coachId: string,
  studentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('coach_student_assignments')
      .delete()
      .eq('coach_id', coachId)
      .eq('student_id', studentId);

    if (error) {
      console.error('Error removing student assignment:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Student assignment removed successfully' };
  } catch (error: any) {
    console.error('Error removing student assignment:', error);
    return { success: false, message: error.message };
  }
}

// Update organization details
export async function updateOrganization(
  organizationId: string,
  updates: {
    name?: string;
    logo_url?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    if (!organizationId) {
      return { success: false, message: 'Organization ID is required' };
    }

    // Verify current user is an admin of this organization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: 'User not authenticated' };
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (adminError || !adminData) {
      return { success: false, message: 'Unauthorized: User is not an admin of this organization' };
    }

    // Update the organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return { success: false, message: updateError.message };
    }

    return { success: true, message: 'Organization updated successfully' };
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return { success: false, message: error.message };
  }
} 

export interface StudentWithCoach {
  id: string;
  full_name: string;
  profile_image: string | null;
  xp_points: number;
  skill_level: string;
  age: number | null;
  coach_name?: string | null;
}

export async function getAllStudentsForOrg(organizationId: string): Promise<StudentWithCoach[]> {
  try {
    // 1. Fetch students for org
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        profile_image,
        xp_points,
        skill_level,
        age
      `)
      .eq('organization_id', organizationId);

    if (studentError || !students) {
      console.error('Error fetching students:', studentError);
      return [];
    }

    // 2. Fetch coach-student assignments (to get coach_id per student)
    const { data: assignments, error: assignError } = await supabase
      .from('coach_student_assignments')
      .select(`
        student_id,
        coach:coaches!coach_student_assignments_coach_id_fkey (
          full_name
        )
      `);

    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return [];
    }

    // 3. Create a lookup map: studentId -> coach name
    const coachMap: Record<string, string> = {};
    assignments?.forEach((entry) => {
      if (entry.student_id && entry.coach?.full_name) {
        coachMap[entry.student_id] = entry.coach.full_name;
      }
    });

    // 4. Combine results
    return students.map((student) => ({
      ...student,
      coach_name: coachMap[student.id] || null,
    }));
  } catch (error) {
    console.error('Error in getAllStudentsForOrg:', error);
    return [];
  }
}
