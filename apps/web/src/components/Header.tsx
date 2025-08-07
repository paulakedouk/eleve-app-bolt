'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import type {
  SupabaseClient,
  Session,
  User,
  Subscription,
  AuthChangeEvent,
} from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const subscription = useRef<Subscription | null>(null);

  useEffect(() => {
    const loadSupabase = async (): Promise<SupabaseClient | null> => {
      if (typeof window !== 'undefined' && !supabase) {
        const { supabase: sb } = await import('@shared/shared/supabaseClient');
        supabase = sb;
      }
      return supabase;
    };

    const getUser = async () => {
      try {
        const sb = await loadSupabase();
        if (sb) {
          const {
            data: { user },
          } = await sb.auth.getUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    const setupAuthListener = async () => {
      const sb = await loadSupabase();
      if (sb) {
        const {
          data: { subscription: sub },
        } = sb.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user || null);
            setLoading(false);
          }
        );
        subscription.current = sub;
      }
    };

    getUser();
    setupAuthListener();

    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/eleve-logo.svg"
                alt="Eleve"
                width={120}
                height={36}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-12">
            <Link
              href="#features"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              FEATURES
            </Link>
            <Link
              href="#audience"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              AUDIENCE
            </Link>
            <Link
              href="#pricing"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              PRICING
            </Link>
            <Link
              href="#portal"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              PORTAL
            </Link>
          </nav>

          {/* Login Button or User Menu */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 font-medium">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
