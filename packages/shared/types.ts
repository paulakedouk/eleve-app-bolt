// User and Authentication Types
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

// Student and Session Types
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

export interface VideoRecord {
  id: string;
  uri: string;
  studentIds: string[];
  note?: string;
  timestamp: Date;
  duration: number;
}

// XP and Achievement Types
export interface XPEntry {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  timestamp: Date;
  coachId: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'trick_landed' | 'xp_milestone' | 'badge_earned';
}

// Organization and Admin Types
export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  subscription_plan: string;
  created_at: string;
  updated_at: string;
}

export interface PendingApproval {
  id: string;
  type: 'new_student' | 'new_parent' | 'new_coach' | 'profile_update';
  name: string;
  timestamp: Date;
}

// Utility Types
export interface SessionFeedItem {
  id: string;
  type: 'video' | 'trick_tag' | 'xp_update' | 'coach_note';
  content: string;
  timestamp: Date;
  studentName?: string;
  videoUri?: string;
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