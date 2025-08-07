// Mock coach data for testing recording features
export const mockCoachProfile = {
  id: 'coach-test-123',
  email: 'coach@eliteskating.com',
  full_name: 'Elite Skating Coach',
  role: 'coach' as const,
  organization_id: 'org-elite-skating',
  organization_name: 'Elite Skating Academy',
  created_at: new Date().toISOString(),
};

export const mockCoachStudents = [
  {
    id: 'student-1',
    name: 'Alex Johnson',
    age: 14,
    level: 'Intermediate' as const,
    username: 'alex.johnson',
    coach_id: 'coach-test-123',
    organization_id: 'org-elite-skating',
    profile_image: null,
    created_at: new Date().toISOString(),
    xp: 850,
    badgeLevel: 'Bronze',
    goals: ['Master kickflip', 'Improve balance'],
  },
  {
    id: 'student-2', 
    name: 'Maria Rodriguez',
    age: 12,
    level: 'Beginner' as const,
    username: 'maria.rodriguez',
    coach_id: 'coach-test-123',
    organization_id: 'org-elite-skating',
    profile_image: null,
    created_at: new Date().toISOString(),
    xp: 320,
    badgeLevel: 'Rookie',
    goals: ['Perfect ollie', 'Build confidence'],
  },
  {
    id: 'student-3',
    name: 'Jamie Chen',
    age: 16,
    level: 'Advanced' as const,
    username: 'jamie.chen',
    coach_id: 'coach-test-123',
    organization_id: 'org-elite-skating',
    profile_image: null,
    created_at: new Date().toISOString(),
    xp: 1450,
    badgeLevel: 'Silver',
    goals: ['Land tre flip', 'Compete in contest'],
  },
  {
    id: 'student-4',
    name: 'Taylor Swift',
    age: 13,
    level: 'Beginner' as const,
    username: 'taylor.swift',
    coach_id: 'coach-test-123',
    organization_id: 'org-elite-skating',
    profile_image: null,
    created_at: new Date().toISOString(),
    xp: 180,
    badgeLevel: 'Rookie',
    goals: ['Learn to push properly', 'Stay on board'],
  },
];

export const mockSessionEnvironments = [
  {
    id: 'env-1',
    name: 'Main Street Skate Park',
    description: 'Outdoor park with bowls and rails',
    type: 'outdoor',
  },
  {
    id: 'env-2',
    name: 'Indoor Training Hall',
    description: 'Climate-controlled practice space',
    type: 'indoor',
  },
  {
    id: 'env-3',
    name: 'Halfpipe Arena',
    description: 'Professional halfpipe facility',
    type: 'specialized',
  },
];

// Mock authentication state
export const mockAuthState = {
  user: {
    id: 'coach-test-123',
    email: 'coach@eliteskating.com',
    user_metadata: {
      full_name: 'Elite Skating Coach',
      role: 'coach',
    },
  },
  session: {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000, // 1 hour
  },
}; 