'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '@web/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Determine if input is email or username (like mobile app)
      const isEmail = email.includes('@');
      const finalEmail = email.trim();

      if (!isEmail) {
        // For usernames without @, try as a student account (username@child.eleve.app)
        const studentEmail = `${email.trim()}@child.eleve.app`;
        
        try {
          console.log('🔍 Trying student login with:', studentEmail);
          const { data: studentData, error: studentError } = await supabase.auth.signInWithPassword({
            email: studentEmail,
            password,
          });

          console.log('👨‍🎓 Student login result:', { studentData, studentError });

          if (!studentError && studentData.user) {
            // Successfully logged in as student
            const { data: userRole, error: roleError } = await supabase
              .rpc('get_user_role', { user_id: studentData.user.id });

            if (!roleError && userRole === 'student') {
              window.location.href = '/student/dashboard';
              return;
            }
            
            if (roleError) {
              // Fallback: Check students table directly
              const { data: studentCheck } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', studentData.user.id)
                .single();
                
              if (studentCheck) {
                window.location.href = '/student/dashboard';
                return;
              }
            }
          }
        } catch {
          console.log('Not a student account, trying regular email login...');
        }
        
        // If student login failed, show helpful message
        setError('If this is a student account, please check your username and password. If this is a regular account, please use your full email address.');
        setLoading(false);
        return;
      }

      // Regular email login
      console.log('🔍 Trying regular email login with:', finalEmail);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password,
      });

      console.log('📧 Regular login result:', { data, authError });

      if (authError) throw authError;

      if (data.user) {
        try {
          // Try the RPC function first
          const { data: userRole, error: roleError } = await supabase
            .rpc('get_user_role', { user_id: data.user.id });

          if (roleError) {
            console.warn('RPC function error, using fallback method:', roleError);
            
            // Fallback: Check role tables directly
            const userId = data.user.id;
            
            // Check admins table
            const { data: adminData } = await supabase
              .from('admins')
              .select('id')
              .eq('id', userId)
              .single();
            
            if (adminData) {
              window.location.href = '/admin/dashboard';
              return;
            }
            
            // Check coaches table
            const { data: coachData } = await supabase
              .from('coaches')
              .select('id')
              .eq('id', userId)
              .single();
            
            if (coachData) {
              window.location.href = '/coach/dashboard';
              return;
            }
            
            // Check parents table
            const { data: parentData } = await supabase
              .from('parents')
              .select('id')
              .eq('id', userId)
              .single();
            
            if (parentData) {
              window.location.href = '/parent/dashboard';
              return;
            }
            
            // Check students table
            const { data: studentData } = await supabase
              .from('students')
              .select('id')
              .eq('user_id', userId)
              .single();
            
            if (studentData) {
              window.location.href = '/student/dashboard';
              return;
            }
            
            // Default to business/admin if not found in other tables
            window.location.href = '/admin/dashboard';
            return;
          }

          // Navigate based on role (same logic as mobile app)
          switch (userRole) {
            case 'business':
            case 'admin':
              window.location.href = '/admin/dashboard';
              break;
            case 'coach':
              window.location.href = '/coach/dashboard';
              break;
            case 'parent':
              window.location.href = '/parent/dashboard';
              break;
            case 'student':
              window.location.href = '/student/dashboard';
              break;
            default:
              window.location.href = '/dashboard';
          }
        } catch (roleError: unknown) {
          console.error('Role determination error:', roleError);
          // If all else fails, default to admin dashboard
          window.location.href = '/admin/dashboard';
        }
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Image 
            src="/eleve-logo.svg" 
            alt="Eleve" 
            width={120} 
            height={36}
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-6 text-3xl font-black text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-2 border-black">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-black text-gray-900">
                Email or Username
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border-2 border-black rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="Enter your email or username (students)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-black text-gray-900">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border-2 border-black rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Image src="/eye-off.svg" alt="Hide password" width={20} height={20} />
                  ) : (
                    <Image src="/eye.svg" alt="Show password" width={20} height={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 font-medium">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-black text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 