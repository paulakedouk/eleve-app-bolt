import { supabase } from '../lib/supabase';

export interface CoachProfileData {
  fullName: string;
  email?: string;
  dateOfBirth: string;
  phoneNumber: string;
  specialties: string[];
}

export interface CoachProfileCompletionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Updates a coach's profile information after invitation acceptance
 */
export async function completeCoachProfile(
  userId: string,
  profileData: CoachProfileData
): Promise<CoachProfileCompletionResult> {
  try {
    // Call the database function to update coach profile
    const { data, error } = await supabase.rpc('complete_coach_profile', {
      coach_user_id: userId,
      p_full_name: profileData.fullName,
      p_email: profileData.email || null,
      p_date_of_birth: profileData.dateOfBirth,
      p_phone_number: profileData.phoneNumber,
      p_specialties: profileData.specialties,
    });

    if (error) {
      console.error('Database function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update coach profile'
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Coach profile not found or could not be updated'
      };
    }

    // Also update basic user metadata in auth for consistency
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: profileData.fullName,
        profile_completed: true,
      }
    });

    if (authUpdateError) {
      console.warn('Auth metadata update failed, but coach profile was saved:', authUpdateError);
      // Don't fail the operation since the main data is saved in coaches table
    }

    return {
      success: true,
      message: 'Profile completed successfully!'
    };

  } catch (error: any) {
    console.error('Complete coach profile error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while completing your profile'
    };
  }
}

/**
 * Validates coach profile data before submission
 */
export function validateCoachProfile(profileData: CoachProfileData): { 
  isValid: boolean; 
  errors: Partial<Record<keyof CoachProfileData, string>> 
} {
  const errors: Partial<Record<keyof CoachProfileData, string>> = {};

  // Validate full name
  if (!profileData.fullName.trim()) {
    errors.fullName = 'Full name is required';
  } else if (profileData.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  // Validate date of birth
  if (!profileData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(profileData.dateOfBirth)) {
      errors.dateOfBirth = 'Please use YYYY-MM-DD format';
    } else {
      const date = new Date(profileData.dateOfBirth);
      const today = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        errors.dateOfBirth = 'Please enter a valid date';
      } else {
        const age = today.getFullYear() - date.getFullYear() - 
          (today < new Date(today.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
        
        if (age < 16) {
          errors.dateOfBirth = 'You must be at least 16 years old';
        } else if (age > 100) {
          errors.dateOfBirth = 'Please enter a valid birth date';
        }
      }
    }
  }

  // Validate phone number
  if (!profileData.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else {
    // Allow various phone number formats
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(profileData.phoneNumber.trim())) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
  }

  // Validate specialties
  if (!profileData.specialties || profileData.specialties.length === 0) {
    errors.specialties = 'Please select at least one specialty' as any;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Gets coach profile completion status
 */
export async function getCoachProfileStatus(userId: string): Promise<{
  isCompleted: boolean;
  profileData?: any;
  error?: string;
}> {
  try {
    // Use the database function to check profile completion
    const { data, error } = await supabase.rpc('is_coach_profile_complete', {
      coach_user_id: userId
    });

    if (error) {
      console.error('Profile status check error:', error);
      return {
        isCompleted: false,
        error: error.message || 'Failed to check profile status'
      };
    }

    const isCompleted = data === true;

    // If profile is completed, also get the full profile data
    let profileData = null;
    if (isCompleted) {
      const { data: profile, error: profileError } = await supabase.rpc('get_coach_profile', {
        coach_user_id: userId
      });

      if (!profileError && profile && profile.length > 0) {
        profileData = profile[0];
      }
    }

    return {
      isCompleted,
      profileData
    };

  } catch (error: any) {
    console.error('Get coach profile status error:', error);
    return {
      isCompleted: false,
      error: error.message || 'Failed to check profile status'
    };
  }
} 