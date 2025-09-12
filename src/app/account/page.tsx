'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  createdAt: number;
  lastLoginAt?: number;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Form state for account info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');

  // Abilities state
  const [hasReader, setHasReader] = useState(false);
  const [hasReporter, setHasReporter] = useState(false);
  const [hasEditor, setHasEditor] = useState(false);

  const checkAuthAndLoadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
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
        // Load existing account info (placeholder - would come from API)
        loadAccountInfo();
        // Load abilities
        loadAbilities();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndLoadUser();
  }, [checkAuthAndLoadUser]);

  const loadAccountInfo = async () => {
    // Placeholder - in a real app, this would fetch from an API
    // For now, we'll just set some placeholder data
    setFirstName('John');
    setLastName('Doe');
    setPhone('(555) 123-4567');
    setCompany('Example Corp');
    setBio('News enthusiast and content creator.');
  };

  const loadAbilities = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const [readerResponse, reporterResponse, editorResponse] = await Promise.all([
        fetch('/api/abilities/reader', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/abilities/reporter', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/abilities/editor', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (readerResponse.ok) {
        const readerData = await readerResponse.json();
        setHasReader(readerData.hasReader);
      }

      if (reporterResponse.ok) {
        const reporterData = await reporterResponse.json();
        setHasReporter(reporterData.hasReporter);
      }

      if (editorResponse.ok) {
        const editorData = await editorResponse.json();
        setHasEditor(editorData.hasEditor);
      }
    } catch {
      console.error('Failed to load abilities');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Placeholder - in a real app, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Account information saved successfully!');
    } catch {
      alert('Failed to save account information.');
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/20">
            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
            <p className="text-white/80 mt-1">Manage your account information and preferences</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Account Permissions */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Account Permissions</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reader-permission"
                    checked={hasReader}
                    disabled
                    className="h-4 w-4 text-white focus:ring-white border-white/30 rounded cursor-not-allowed bg-white/10"
                  />
                  <label htmlFor="reader-permission" className="text-sm font-medium text-white/90">
                    Reader
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reporter-permission"
                    checked={hasReporter}
                    disabled
                    className="h-4 w-4 text-white focus:ring-white border-white/30 rounded cursor-not-allowed bg-white/10"
                  />
                  <label htmlFor="reporter-permission" className="text-sm font-medium text-white/90">
                    Reporter
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editor-permission"
                    checked={hasEditor}
                    disabled
                    className="h-4 w-4 text-white focus:ring-white border-white/30 rounded cursor-not-allowed bg-white/10"
                  />
                  <label htmlFor="editor-permission" className="text-sm font-medium text-white/90">
                    Editor
                  </label>
                </div>
              </div>
              <div className="mt-4 text-sm text-white/70">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
              {/* Upgrade Options */}
              <div className="mt-6 space-y-4">
                {/* Upgrade to Reader (existing) */}
                {!hasReader && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">Upgrade to Reader</h3>
                        <p className="text-xs text-white/70 mt-1">
                          Premium access to all published content and enhanced reading features
                        </p>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_STRIPE_READER_BUY_URL}?prefilled_email=${user.email}`}
                        className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden transition-all duration-300"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative">Upgrade To Reader</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Upgrade to Reporter */}
                {!hasReporter && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">Upgrade to Reporter</h3>
                        <p className="text-xs text-white/70 mt-1">
                          Access AI-powered reporting tools and create professional news content
                        </p>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_STRIPE_REPORTER_BUY_URL}?prefilled_email=${user.email}`}
                        className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 overflow-hidden transition-all duration-300"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative">Upgrade To Reporter</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Upgrade to Editor */}
                {!hasEditor && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">Upgrade to Editor</h3>
                        <p className="text-xs text-white/70 mt-1">
                          Full editorial control with advanced publishing tools and team management
                        </p>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_STRIPE_EDITOR_BUY_URL}?prefilled_email=${user.email}`}
                        className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 overflow-hidden transition-all duration-300"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative">Upgrade To Editor</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg text-white/70 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/50 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="company" className="block text-sm font-medium text-white/90 mb-2">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your company or organization"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-white/90 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
                    placeholder="Tell us a bit about yourself"
                  />
                </div>
              </div>
            </div>

            {/* Account Activity */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Account Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/70">Last Login</p>
                  <p className="font-medium text-white">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Account Created</p>
                  <p className="font-medium text-white">
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-white/20">
              <button
                onClick={handleSave}
                disabled={saving}
                className="group relative inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative">{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
