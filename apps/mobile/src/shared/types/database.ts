export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          subscription_plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          subscription_plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          subscription_plan?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          organization_id: string;
          is_owner: boolean;
          permissions: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          is_owner?: boolean;
          permissions?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          is_owner?: boolean;
          permissions?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      coaches: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string | null;
          email: string | null;
          date_of_birth: string | null;
          phone_number: string | null;
          specialties: string[];
          certification_level: string | null;
          bio: string | null;
          hourly_rate: number | null;
          is_active: boolean;
          profile_completed: boolean;
          profile_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name?: string | null;
          email?: string | null;
          date_of_birth?: string | null;
          phone_number?: string | null;
          specialties?: string[];
          certification_level?: string | null;
          bio?: string | null;
          hourly_rate?: number | null;
          is_active?: boolean;
          profile_completed?: boolean;
          profile_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string | null;
          email?: string | null;
          date_of_birth?: string | null;
          phone_number?: string | null;
          specialties?: string[];
          certification_level?: string | null;
          bio?: string | null;
          hourly_rate?: number | null;
          is_active?: boolean;
          profile_completed?: boolean;
          profile_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      parents: {
        Row: {
          id: string;
          organization_id: string;
          phone_number: string | null;
          emergency_contact: string | null;
          emergency_phone: string | null;
          billing_address: Record<string, any> | null;
          notification_preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          phone_number?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
          billing_address?: Record<string, any> | null;
          notification_preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          phone_number?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
          billing_address?: Record<string, any> | null;
          notification_preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      partners: {
        Row: {
          id: string;
          organization_id: string;
          company_name: string | null;
          partnership_type: string | null;
          contact_info: Record<string, any> | null;
          agreement_details: Record<string, any> | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          company_name?: string | null;
          partnership_type?: string | null;
          contact_info?: Record<string, any> | null;
          agreement_details?: Record<string, any> | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          company_name?: string | null;
          partnership_type?: string | null;
          contact_info?: Record<string, any> | null;
          agreement_details?: Record<string, any> | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          recipient_name: string;
          role: 'coach' | 'parent';
          organization_id: string;
          invited_by: string;
          status: 'pending' | 'accepted' | 'declined';
          code: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          recipient_name: string;
          role: 'coach' | 'parent';
          organization_id: string;
          invited_by: string;
          status?: 'pending' | 'accepted' | 'declined';
          code: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          recipient_name?: string;
          role?: 'coach' | 'parent';
          organization_id?: string;
          invited_by?: string;
          status?: 'pending' | 'accepted' | 'declined';
          code?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          organization_id: string;
          username: string;
          passcode: string;
          full_name: string;
          age: number | null;
          skill_level: string;
          profile_image: string | null;
          xp_points: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          username: string;
          passcode: string;
          full_name: string;
          age?: number | null;
          skill_level?: string;
          profile_image?: string | null;
          xp_points?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          username?: string;
          passcode?: string;
          full_name?: string;
          age?: number | null;
          skill_level?: string;
          profile_image?: string | null;
          xp_points?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      parent_student_relationships: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          relationship_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          student_id: string;
          relationship_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          student_id?: string;
          relationship_type?: string;
          created_at?: string;
        };
      };
      coach_student_assignments: {
        Row: {
          id: string;
          coach_id: string;
          student_id: string;
          assigned_by: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          student_id: string;
          assigned_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          student_id?: string;
          assigned_by?: string;
          created_at?: string;
        };
      };
      // Keep existing tables
      organization_admins: {
        Row: {
          id: string;
          admin_id: string;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          organization_id: string;
          is_owner?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          organization_id?: string;
          is_owner?: boolean;
          created_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: 'coach' | 'parent';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          role: 'coach' | 'parent';
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          role?: 'coach' | 'parent';
          created_at?: string;
        };
      };
      student_parents: {
        Row: {
          id: string;
          student_id: string;
          parent_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          parent_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          parent_id?: string;
          created_at?: string;
        };
      };
      student_coach_assignments: {
        Row: {
          id: string;
          student_id: string;
          coach_id: string;
          assigned_by: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          coach_id: string;
          assigned_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          coach_id?: string;
          assigned_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: { user_id: string };
        Returns: string;
      };
      get_user_organization: {
        Args: { user_id: string };
        Returns: string;
      };
      get_user_info: {
        Args: { user_id: string };
        Returns: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string;
          role: string;
          organization_id: string;
        }[];
      };
    };
    Enums: {
      user_role: 'admin' | 'coach' | 'parent' | 'student';
      invitation_status: 'pending' | 'accepted' | 'declined';
    };
  };
} 