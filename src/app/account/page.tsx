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

      const [readerResponse, editorResponse] = await Promise.all([
        fetch('/api/abilities/reader', {
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

      if (editorResponse.ok) {
        const editorData = await editorResponse.json();
        setHasEditor(editorData.hasEditor);
      }
    } catch (_error) {
      console.error('Failed to load abilities');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Placeholder - in a real app, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Account information saved successfully!');
    } catch (error) {
      alert('Failed to save account information.');
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
            <p className="text-slate-600 mt-1">Manage your account information and preferences</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Account Permissions */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Permissions</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reader-permission"
                    checked={hasReader}
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-not-allowed"
                  />
                  <label htmlFor="reader-permission" className="text-sm font-medium text-slate-700">
                    Reader
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editor-permission"
                    checked={hasEditor}
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-not-allowed"
                  />
                  <label htmlFor="editor-permission" className="text-sm font-medium text-slate-700">
                    Editor
                  </label>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-600">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
              {user.role !== 'editor' && user.role !== 'admin' && (
                <div className="mt-4">
                  <a
                    href={`${process.env.STRIPE_READER_BUY_URL}?prefilled_email=${user.email}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Upgrade To Reader
                  </a>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your company or organization"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Tell us a bit about yourself"
                  />
                </div>
              </div>
            </div>

            {/* Account Activity */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Activity</h2>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Last Login</p>
                    <p className="font-medium text-slate-800">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Account Created</p>
                    <p className="font-medium text-slate-800">
                      {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
