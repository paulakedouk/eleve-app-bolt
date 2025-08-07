import { useEffect, useState } from 'react';
import { getCurrentUser, UserRole, redirectToDashboard } from '@web/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectOnUnauthorized?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectOnUnauthorized = '/login' 
}: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        
        if (!user) {
          // Not authenticated
          window.location.href = redirectOnUnauthorized;
          return;
        }

        // Check if user has required role
        if (requiredRole) {
          const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          if (!allowedRoles.includes(user.role)) {
            // User doesn't have required role, redirect to their dashboard
            redirectToDashboard(user.role);
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = redirectOnUnauthorized;
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [requiredRole, redirectOnUnauthorized]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
} 