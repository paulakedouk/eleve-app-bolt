import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProtectedRoute from '@web/components/ProtectedRoute';
import { supabase } from '@web/lib/supabase';
import { signOut } from '@web/lib/auth';

interface StudentProfile {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  xp: number;
  badge_level: string;
  profile_image_url?: string;
}

interface Badge {
  id: string;
  name: string;
  xp_reward: number;
  earned_at?: string;
}

interface TrickProgress {
  id: string;
  trick_name: string;
  success_rate: number;
  landings: number;
  attempts: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'trick_landed' | 'xp_milestone' | 'badge_earned';
}

export default function StudentDashboard() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [trickProgress, setTrickProgress] = useState<TrickProgress[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudent(studentData);
      }

      // Load badges (mock data for now)
      setBadges([
        { id: '1', name: 'First Ollie', xp_reward: 100, earned_at: '2024-01-15' },
        { id: '2', name: 'Kickflip Master', xp_reward: 250, earned_at: '2024-01-20' },
        { id: '3', name: 'Session Streak', xp_reward: 150 }, // Not earned yet
      ]);

      // Load trick progress (mock data)
      setTrickProgress([
        { id: '1', trick_name: 'Ollie', success_rate: 85, landings: 17, attempts: 20 },
        { id: '2', trick_name: 'Kickflip', success_rate: 60, landings: 12, attempts: 20 },
        { id: '3', trick_name: 'Heelflip', success_rate: 30, landings: 3, attempts: 10 },
      ]);

      // Load recent achievements (mock data)
      setRecentAchievements([
        {
          id: '1',
          title: 'Landed 10 Ollies in a row!',
          description: 'Consistency is key - great job!',
          timestamp: '2024-01-20T10:30:00Z',
          type: 'trick_landed'
        },
        {
          id: '2',
          title: 'Reached 500 XP',
          description: 'You\'re making great progress!',
          timestamp: '2024-01-19T15:45:00Z',
          type: 'xp_milestone'
        }
      ]);

    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Image 
                  src="/eleve-logo.svg" 
                  alt="Eleve" 
                  width={40} 
                  height={40}
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-xl font-black text-gray-900">
                    Welcome back, {student?.name || 'Skater'}!
                  </h1>
                  <p className="text-sm text-gray-600">Level: {student?.level || 'Beginner'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{student?.xp || 0} XP</p>
                  <p className="text-xs text-gray-600">{student?.badge_level || 'Bronze'} Badge</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Progress & Stats */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* XP Progress Card */}
              <div className="bg-white rounded-2xl p-6 border-4 border-blue-600 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.3)]">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Your Progress</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-700">XP Progress</span>
                      <span className="text-sm font-bold text-blue-600">{student?.xp || 0} / 1000 XP</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((student?.xp || 0) / 1000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trick Progress */}
              <div className="bg-white rounded-2xl p-6 border-4 border-green-600 shadow-[8px_8px_0px_0px_rgba(34,197,94,0.3)]">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Trick Progress</h2>
                <div className="space-y-4">
                  {trickProgress.map((trick) => (
                    <div key={trick.id} className="border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{trick.trick_name}</h3>
                        <span className="text-sm font-bold text-green-600">{trick.success_rate}%</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Landed: {trick.landings}</span>
                        <span>Attempts: {trick.attempts}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 border border-black">
                        <div 
                          className="bg-green-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${trick.success_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="bg-white rounded-2xl p-6 border-4 border-yellow-500 shadow-[8px_8px_0px_0px_rgba(234,179,8,0.3)]">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Recent Achievements</h2>
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                      <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-black text-sm">🏆</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{achievement.title}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(achievement.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Badges & Quick Actions */}
            <div className="space-y-6">
              
              {/* Badges */}
              <div className="bg-white rounded-2xl p-6 border-4 border-purple-600 shadow-[8px_8px_0px_0px_rgba(147,51,234,0.3)]">
                <h2 className="text-xl font-black text-gray-900 mb-4">Badges</h2>
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                        badge.earned_at 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-gray-50 border-gray-200 opacity-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        badge.earned_at ? 'bg-purple-500' : 'bg-gray-400'
                      }`}>
                        <span className="text-white font-bold">🏅</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-900">{badge.name}</h3>
                        <p className="text-xs text-gray-600">+{badge.xp_reward} XP</p>
                        {badge.earned_at && (
                          <p className="text-xs text-purple-600">
                            Earned {new Date(badge.earned_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 border-4 border-red-500 shadow-[8px_8px_0px_0px_rgba(239,68,68,0.3)]">
                <h2 className="text-xl font-black text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link 
                    href="/student/videos"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold text-center transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    📹 View My Videos
                  </Link>
                  <Link 
                    href="/student/progress"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold text-center transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    📊 View Progress
                  </Link>
                  <Link 
                    href="/student/goals"
                    className="block w-full bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-3 rounded-lg font-bold text-center transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    🎯 Set Goals
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 