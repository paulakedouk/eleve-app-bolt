// Web configuration for Elevé marketing website and organization portals
const config = {
  // API Configuration
  api: {
    baseURL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://noaeiuejccwfabjhjndy.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWVpdWVqY2N3ZmFiamhqbmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMTk3ODEsImV4cCI6MjA2NzU5NTc4MX0.E33Wv1XDmjxrzxaTYCbbJwVfa7GackRrMYUtLFbvEk4',
  },
  
  // Routing Configuration
  routes: {
    // Main marketing website
    home: '/',
    adminLogin: '/login',
    
    // Organization portals
    orgLogin: '/:orgSlug/login',
    orgDashboard: '/:orgSlug/dashboard',
    
    // Dashboard routes
    adminDashboard: '/admin/dashboard',
    coachDashboard: '/coach/dashboard',
    parentDashboard: '/parent/dashboard',
    studentDashboard: '/student/dashboard',
  },
  
  // Organization settings
  organizations: {
    // Map organization slugs to their display names
    // This would typically come from the database
    'example-skate-school': 'Example Skate School',
    'pro-skate-academy': 'Pro Skate Academy',
    'youth-skate-center': 'Youth Skate Center',
  },
  
  // Authentication configuration
  auth: {
    // Session timeout in milliseconds
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    
    // Redirect URLs after login
    redirects: {
      admin: '/admin',
      coach: '/coach',
      parent: '/parent',
      student: '/student',
    },
    
    // User types and their permissions
    userTypes: {
      admin: {
        canSignUp: true,
        canInvite: true,
        canManageOrg: true,
      },
      coach: {
        canSignUp: false,
        canInvite: true,
        canManageStudents: true,
      },
      parent: {
        canSignUp: false,
        canInvite: false,
        canViewChildren: true,
      },
      student: {
        canSignUp: false,
        canInvite: false,
        canViewProgress: true,
      },
    },
  },
  
  // Email configuration
  email: {
    from: 'noreply@tryeleve.com',
    supportEmail: 'support@tryeleve.com',
    templates: {
      welcome: 'welcome-template',
      invitation: 'invitation-template',
      passwordReset: 'password-reset-template',
    },
  },
  
  // UI configuration
  ui: {
    brandColors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#ffd700',
    },
    
    // Feature flags
    features: {
      studentSignup: false, // Students can't sign up directly
      parentSignup: false,  // Parents can't sign up directly
      videoAnalysis: true,
      badgeSystem: true,
      mobileApp: true,
    },
  },
};

// Helper functions for routing
const routeHelpers = {
  /**
   * Generate organization login URL
   * @param {string} orgSlug - Organization slug
   * @returns {string} Login URL
   */
  getOrgLoginUrl: (orgSlug) => {
    return `/${orgSlug}/login`;
  },
  
  /**
   * Generate organization dashboard URL
   * @param {string} orgSlug - Organization slug
   * @param {string} userType - User type (admin, coach, parent, student)
   * @returns {string} Dashboard URL
   */
  getOrgDashboardUrl: (orgSlug, userType) => {
    return `/${orgSlug}/dashboard/${userType}`;
  },
  
  /**
   * Check if organization exists
   * @param {string} orgSlug - Organization slug
   * @returns {boolean} Whether organization exists
   */
  orgExists: (orgSlug) => {
    return Object.keys(config.organizations).includes(orgSlug);
  },
  
  /**
   * Get organization display name
   * @param {string} orgSlug - Organization slug
   * @returns {string} Organization display name
   */
  getOrgName: (orgSlug) => {
    return config.organizations[orgSlug] || 'Unknown Organization';
  },
  
  /**
   * Check if user can sign up
   * @param {string} userType - User type
   * @returns {boolean} Whether user can sign up
   */
  canUserSignUp: (userType) => {
    return config.auth.userTypes[userType]?.canSignUp || false;
  },
  
  /**
   * Get redirect URL after login
   * @param {string} userType - User type
   * @returns {string} Redirect URL
   */
  getLoginRedirect: (userType) => {
    return config.auth.redirects[userType] || '/';
  },
};

// API helpers
const apiHelpers = {
  /**
   * Get API headers with authentication
   * @param {string} token - Authentication token
   * @returns {Object} Headers object
   */
  getAuthHeaders: (token) => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.api.anonKey,
    };
  },
  
  /**
   * Handle API response
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Parsed response
   */
  handleApiResponse: async (response) => {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    return await response.json();
  },
  
  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} API response
   */
  makeAuthenticatedRequest: async (endpoint, options = {}, token) => {
    const url = `${config.api.baseURL}${endpoint}`;
    const headers = apiHelpers.getAuthHeaders(token);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    return await apiHelpers.handleApiResponse(response);
  },
};

// Export configuration and helpers
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    config,
    routeHelpers,
    apiHelpers,
  };
} else {
  // Browser environment
  window.EleveConfig = {
    config,
    routeHelpers,
    apiHelpers,
  };
} 