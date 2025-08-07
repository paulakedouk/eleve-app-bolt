export interface Student {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  age: number;
  profileImage?: string;
  xp: number;
  badgeLevel: string;
  goals: string[];
}

export interface VideoRecord {
  id: string;
  uri: string;
  studentIds: string[];
  note?: string;
  timestamp: Date;
  duration: number;
}

export interface SessionVideo {
  id: string;
  thumbnail: string;
  students: Student[];
  trickName?: string;
  landed: boolean;
  hasComment: boolean;
  hasVoiceNote: boolean;
  timestamp: Date;
  uri?: string;
  duration?: number;
  comment?: string;
  location?: string; // Location where video was recorded
  isEditing?: boolean;
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'failed';
  uploadProgress?: number; // 0-100
  s3Url?: string;
  databaseId?: string;
}

export type UserType = 'coach' | 'student' | 'parent' | 'admin';

export interface User {
  id: string;
  name: string;
  type: UserType;
  profileImage?: string;
  children?: Student[]; // For parent users
  schoolId?: string; // For admin users
}

export interface Coach {
  id: string;
  name: string;
  profileImage?: string;
  students: Student[];
  totalSessions: number;
  totalVideos: number;
}

export interface Parent {
  id: string;
  name: string;
  profileImage?: string;
  children: Student[];
}

export interface Admin {
  id: string;
  name: string;
  profileImage?: string;
  schoolId: string;
  pendingApprovals: number;
}

export interface SessionFeedItem {
  id: string;
  type: 'video' | 'trick_tag' | 'xp_update' | 'coach_note';
  content: string;
  timestamp: Date;
  studentName?: string;
  videoUri?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'trick_landed' | 'xp_milestone' | 'badge_earned';
}

export interface Timeline {
  id: string;
  type: 'achievement' | 'feedback' | 'trick_tag' | 'milestone';
  content: string;
  timestamp: Date;
}

export interface UpcomingSession {
  id: string;
  date: Date;
  time: string;
  coachName: string;
  studentNames: string[];
}

export interface PendingApproval {
  id: string;
  type: 'new_student' | 'new_parent' | 'new_coach' | 'profile_update';
  name: string;
  timestamp: Date;
}

export type RootStackParamList = {
  SignUpBusiness: undefined;
  Login: undefined;
  InvitationLogin: {
    invitationCode: string;
  };
  CoachProfileCompletion: {
    invitationCode: string;
    userId: string;
  };
  TestSupabase: undefined;
  
  // Coach/Business Portal
  CoachHome: undefined;
  CoachVideosList: undefined;
  CoachMenu: undefined;
  StudentsListScreen: { role?: 'coach' | 'admin' | 'parent' };
  StudentDetails: { studentId: string };
  VideosCalendar: undefined;
  VideoDetail: {
    video: {
      id: string;
      s3_url: string;
      s3_key: string;
      duration: number;
      trick_name?: string;
      landed?: boolean;
      comment?: string;
      student_ids: string[];
      created_at: string;
      upload_status: string;
    };
  };
  StudentHome: undefined;
  AdminHome: undefined;
  AdminCoaches: {
    organizationId: string;
  };
  AdminStudents: {
    organizationId: string;
  };
  InviteCoach: {
    organizationId: string;
  };
  InviteParent: {
    organizationId: string;
  };
  InvitePartner: {
    organizationId: string;
  };
  ReviewApprovals: {
    organizationId: string;
  };
  AdminSettings: {
    organizationId: string;
  };
  AdminStats: undefined;
  Camera: undefined;
  VideoReview: {
    videoUri: string;
    videoDuration: number;
    preSelectedStudents?: Student[];
  };
  SessionSetup: undefined;
  SessionHome: {
    environment: string;
    environmentName: string;
    students: Student[];
    newVideo?: SessionVideo;
  };
  SessionVideoReview: {
    videoUri: string;
    videoDuration: number;
    sessionStudents: Student[];
    environment: string;
    environmentName: string;
    editingVideoId?: string;
  };
  QuickVideoReview: {
    videoUri: string;
    videoDuration: number;
  };
  SessionSummary: {
    environment: string;
    environmentName: string;
    students: Student[];
    videos: SessionVideo[];
    duration: number;
  };
  
  // Student Portal
  StudentDashboard: undefined;
  StudentProgress: undefined;
  StudentVideos: undefined;
  StudentBadges: undefined;
  StudentTricks: undefined;
  VideoUpload: undefined;
  VideoPlayer: {
    videoUri: string;
    title?: string;
  };
  
  // Parent Portal
  ParentHome: {
    showSuccessMessage?: boolean;
    childName?: string;
    childUsername?: string;
    childPassword?: string;
  } | undefined;
  ParentNotifications: undefined;
  ParentStudentDetail: {
    studentId: string;
  };
  ParentSessionReports: undefined;
  ParentSettings: undefined;
  ParentAddChild: undefined;
  
  // Family Onboarding
  FamilyApprovals: undefined;
  StudentAccountSetup: {
    token: string;
  };
  
  // Parent Management
  ParentAddChildren: {
    parentId: string;
    organizationId: string;
    invitationCode: string;
  };
}; 
