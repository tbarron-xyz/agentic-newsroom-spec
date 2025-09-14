'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  hasReader: boolean;
  hasReporter: boolean;
  hasEditor: boolean;
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [_loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Re-check auth status when pathname changes
  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h14a2 2 0 012 2v2H3V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h.01M11 12h.01M15 12h.01M7 16h.01M11 16h.01M15 16h.01" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-800">Skylines AI Newsroom</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <Link
                href="/editions"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                All Editions
              </Link>
            )}
            <Link
              href="/reporters"
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Reporters
            </Link>
            {user?.hasReader && (
              <Link
                href="/articles"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Articles
              </Link>
            )}
            <Link
              href="/ads"
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Ads
            </Link>
            <Link
              href="/pricing"
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            {user && (
              <Link
                href="/account"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Account
              </Link>
            )}

            {/* Admin-only links */}
            {user?.role === 'admin' && (
              <>
                <Link
                  href="/users"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Users
                </Link>
                <Link
                  href="/events"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Events
                </Link>
                <Link
                  href="/editor"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Editor Settings
                </Link>
              </>
            )}

            {/* Show login/logout based on auth status */}
            {user ? (
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-slate-200">
          {user && (
            <Link
              href="/editions"
              onClick={closeMobileMenu}
              className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              All Editions
            </Link>
          )}
          <Link
            href="/reporters"
            onClick={closeMobileMenu}
            className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
          >
            Reporters
          </Link>
          {user?.hasReader && (
            <Link
              href="/articles"
              onClick={closeMobileMenu}
              className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Articles
            </Link>
          )}
          <Link
            href="/ads"
            onClick={closeMobileMenu}
            className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
          >
            Ads
          </Link>
          <Link
            href="/pricing"
            onClick={closeMobileMenu}
            className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
          >
            Pricing
          </Link>
          {user && (
            <Link
              href="/account"
              onClick={closeMobileMenu}
              className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Account
            </Link>
          )}

          {/* Admin-only links */}
          {user?.role === 'admin' && (
            <>
              <Link
                href="/users"
                onClick={closeMobileMenu}
                className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Users
              </Link>
              <Link
                href="/events"
                onClick={closeMobileMenu}
                className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Events
              </Link>
              <Link
                href="/editor"
                onClick={closeMobileMenu}
                className="bg-blue-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
              >
                Editor Settings
              </Link>
            </>
          )}

          {/* Mobile auth section */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="text-slate-600 hover:text-slate-900 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
