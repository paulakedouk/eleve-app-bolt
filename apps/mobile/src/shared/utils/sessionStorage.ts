import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionVideo, Student } from '../types';
import uuid from 'react-native-uuid';
import { supabase } from '../lib/supabase';

interface SessionData {
  id: string;
  environment: string;
  environmentName: string;
  students: Student[];
  videos: SessionVideo[];
  startTime: Date;
  isActive: boolean;
  uploaded: boolean;
}

const ACTIVE_SESSION_KEY = 'activeSession';
const SESSIONS_KEY = 'sessions';

export const SessionStorage = {
  // Create a new session
  async createSession(environment: string, environmentName: string, students: Student[]): Promise<string> {
    const sessionId = uuid.v4() as string;
    
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

                    // Get user's organization_id using the safe RPC function
      const { data: organizationId, error: orgError } = await supabase
        .rpc('get_user_organization', { user_id: user.id });

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        throw new Error('Failed to get user organization');
      }

      // Save session to database
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          environment,
          environment_name: environmentName,
          coach_id: user.id,
          organization_id: organizationId,
          start_time: new Date().toISOString(),
          is_active: true,
        });

      if (sessionError) {
        console.error('Error creating session in database:', sessionError);
        throw new Error('Failed to create session in database');
      }

      // Create session_students relationships
      if (students.length > 0) {
        const sessionStudents = students.map(student => ({
          session_id: sessionId,
          student_id: student.id,
        }));

        const { error: studentsError } = await supabase
          .from('session_students')
          .insert(sessionStudents);

        if (studentsError) {
          console.error('Error linking students to session:', studentsError);
          // Don't fail the whole session creation for this
        }
      }

      // Save session locally for app state
      const sessionData: SessionData = {
        id: sessionId,
        environment,
        environmentName,
        students,
        videos: [],
        startTime: new Date(),
        isActive: true,
        uploaded: false,
      };

      await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));

      console.log('✅ Session created successfully:', sessionId);
      return sessionId;

    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  },

  // Get active session
  async getActiveSession(): Promise<SessionData | null> {
    try {
      const data = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (data) {
        const session = JSON.parse(data);
        // Convert startTime back to Date object
        session.startTime = new Date(session.startTime);
        // Convert video timestamps back to Date objects
        session.videos = session.videos.map((video: SessionVideo) => ({
          ...video,
          timestamp: new Date(video.timestamp),
        }));
        return session;
      }
      return null;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  },

  // Add video to active session
  async addVideoToSession(video: SessionVideo): Promise<void> {
    const session = await this.getActiveSession();
    if (session) {
      session.videos.push(video);
      await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
  },

  // Update video in active session
  async updateVideoInSession(videoId: string, updatedVideo: SessionVideo): Promise<void> {
    const session = await this.getActiveSession();
    if (session) {
      const index = session.videos.findIndex(v => v.id === videoId);
      if (index !== -1) {
        session.videos[index] = updatedVideo;
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
      }
    }
  },

  // End session and archive it
  async endSession(): Promise<SessionData | null> {
    const session = await this.getActiveSession();
    if (session) {
      try {
        // Update session in database
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            is_active: false,
            end_time: new Date().toISOString(),
          })
          .eq('id', session.id);

        if (updateError) {
          console.error('Error updating session in database:', updateError);
          // Don't fail the whole operation for this
        }

        // Update local session
        session.isActive = false;
        
        // Archive the session
        const sessions = await this.getAllSessions();
        sessions.push(session);
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
        
        // Clear active session
        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        
        console.log('✅ Session ended successfully:', session.id);
        return session;
      } catch (error) {
        console.error('❌ Error ending session:', error);
        // Still return the session even if database update fails
        return session;
      }
    }
    return null;
  },

  // Get all archived sessions
  async getAllSessions(): Promise<SessionData[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      if (data) {
        const sessions = JSON.parse(data);
        return sessions.map((session: SessionData) => ({
          ...session,
          startTime: new Date(session.startTime),
          videos: session.videos.map((video: SessionVideo) => ({
            ...video,
            timestamp: new Date(video.timestamp),
          })),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  },

  // Mark session as uploaded
  async markSessionAsUploaded(sessionId: string): Promise<void> {
    const sessions = await this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.uploaded = true;
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }
  },

  // Get sessions pending upload
  async getPendingUploadSessions(): Promise<SessionData[]> {
    const sessions = await this.getAllSessions();
    return sessions.filter(s => !s.uploaded);
  },

  // Clear all session data (for testing)
  async clearAllSessions(): Promise<void> {
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    await AsyncStorage.removeItem(SESSIONS_KEY);
  },
}; 