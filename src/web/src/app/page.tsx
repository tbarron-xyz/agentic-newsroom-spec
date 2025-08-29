'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EditorData {
  bio: string;
  prompt: string;
}

export default function Home() {
  const [editorData, setEditorData] = useState<EditorData>({ bio: '', prompt: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch editor data on component mount
  useEffect(() => {
    fetchEditorData();
  }, []);

  const fetchEditorData = async () => {
    try {
      const response = await fetch('/api/editor');
      if (response.ok) {
        const data = await response.json();
        setEditorData(data);
      } else {
        setMessage('Failed to load editor data');
      }
    } catch (error) {
      setMessage('Error loading editor data');
      console.error('Error fetching editor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEditorData = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/editor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editorData),
      });

      if (response.ok) {
        setMessage('Editor data saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to save editor data');
      }
    } catch (error) {
      setMessage('Error saving editor data');
      console.error('Error saving editor data:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Newsroom Editor Configuration
            </h1>
            <p className="text-slate-600 text-lg">
              Configure your AI editor's biography and editorial guidelines
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/daily-edition"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
              </svg>
              <span>Read Daily Edition</span>
            </Link>
            <Link
              href="/reporters"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Manage Reporters</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Bio Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800">Editor Biography</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <textarea
                value={editorData.bio}
                onChange={(e) => setEditorData({ ...editorData, bio: e.target.value })}
                placeholder="Enter the editor's biography..."
                className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-400"
                rows={4}
              />
              <p className="text-sm text-slate-500 mt-2">
                This biography will be used to inform the AI's editorial decisions and writing style.
              </p>
            </div>
          </div>

          {/* Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800">Editorial Prompt</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <textarea
                value={editorData.prompt}
                onChange={(e) => setEditorData({ ...editorData, prompt: e.target.value })}
                placeholder="Enter the editorial guidelines and prompt..."
                className="w-full h-48 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-400"
                rows={6}
              />
              <p className="text-sm text-slate-500 mt-2">
                Define the editorial standards, tone, and guidelines that will guide the AI's newsroom decisions.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={fetchEditorData}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Refresh Data
            </button>

            <div className="flex items-center space-x-4">
              {message && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  message.includes('successfully')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <button
                onClick={saveEditorData}
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500">
          <p>AI Newsroom Editor Configuration Panel</p>
        </div>
      </div>
    </div>
  );
}
