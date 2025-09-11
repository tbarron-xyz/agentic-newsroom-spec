'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EditorData {
  bio: string;
  prompt: string;
  modelName: string;
  messageSliceCount: number;
  articleGenerationPeriodMinutes: number;
  lastArticleGenerationTime: number | null;
}

interface JobStatus {
  status: {
    reporterJob: boolean;
    newspaperJob: boolean;
    dailyJob: boolean;
  };
  nextRuns: {
    reporterJob: Date | null;
    newspaperJob: Date | null;
    dailyJob: Date | null;
  };
  note?: string;
}

export default function EditorPage() {
  const [editorData, setEditorData] = useState<EditorData>({
    bio: '',
    prompt: '',
    modelName: '',
    messageSliceCount: 200,
    articleGenerationPeriodMinutes: 15,
    lastArticleGenerationTime: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [jobTriggering, setJobTriggering] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Check admin status and fetch data on component mount
  useEffect(() => {
    checkAdminStatus();
    fetchEditorData();
    fetchJobStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setIsAdmin(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.user.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

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
      const accessToken = localStorage.getItem('accessToken');
      const requestBody = {
        ...editorData
      };

      const response = await fetch('/api/editor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody),
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

  const triggerJob = async (jobType: string) => {
    setJobTriggering(jobType);
    setMessage('');

    try {
      const accessToken = localStorage.getItem('accessToken');
      const requestBody = {
        jobType
      };

      const response = await fetch('/api/editor/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        setTimeout(() => setMessage(''), 5000);
      } else {
        const error = await response.json();
        setMessage(error.error || `Failed to trigger ${jobType} job`);
      }
    } catch (error) {
      setMessage(`Error triggering ${jobType} job`);
      console.error(`Error triggering ${jobType} job:`, error);
    } finally {
      setJobTriggering(null);
    }
  };

  const fetchJobStatus = async () => {
    try {
      const response = await fetch('/api/editor/jobs');
      if (response.ok) {
        const status = await response.json();
        setJobStatus(status);
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
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
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            )}
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
                className={`w-full h-32 p-4 border border-slate-200 rounded-lg resize-none text-slate-800 placeholder-slate-400 ${
                  isAdmin
                    ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    : 'bg-slate-100 cursor-not-allowed opacity-60'
                }`}
                rows={4}
                readOnly={!isAdmin}
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
                className={`w-full h-48 p-4 border border-slate-200 rounded-lg resize-none text-slate-800 placeholder-slate-400 ${
                  isAdmin
                    ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent'
                    : 'bg-slate-100 cursor-not-allowed opacity-60'
                }`}
                rows={6}
                readOnly={!isAdmin}
              />
              <p className="text-sm text-slate-500 mt-2">
                Define the editorial standards, tone, and guidelines that will guide the AI's newsroom decisions.
                Define the editorial standards, tone, and guidelines that will guide the AI's newsroom decisions.
              </p>
            </div>
          </div>

          {/* Model Name Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800">AI Model Name</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <input
                type="text"
                value={editorData.modelName}
                onChange={(e) => setEditorData({ ...editorData, modelName: e.target.value })}
                placeholder="Enter AI model name (e.g., gpt-5-nano)"
                className={`w-full p-4 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 ${
                  isAdmin
                    ? 'focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                    : 'bg-slate-100 cursor-not-allowed opacity-60'
                }`}
                readOnly={!isAdmin}
              />
              <p className="text-sm text-slate-500 mt-2">
                Specify the AI model to use for content generation. This setting affects all AI operations in the newsroom.
              </p>
            </div>
          </div>

          {/* Message Slice Count Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800">Message Slice Count</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <input
                type="number"
                value={editorData.messageSliceCount}
                onChange={(e) => setEditorData({ ...editorData, messageSliceCount: parseInt(e.target.value) || 200 })}
                placeholder="Enter message slice count (e.g., 200)"
                min="1"
                max="1000"
                className={`w-full p-4 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 ${
                  isAdmin
                    ? 'focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    : 'bg-slate-100 cursor-not-allowed opacity-60'
                }`}
                readOnly={!isAdmin}
              />
              <p className="text-sm text-slate-500 mt-2">
                Number of recent messages to fetch from the MCP server for article generation (1-1000). Higher values provide more context but may slow down processing.
              </p>
            </div>
          </div>

          {/* Article Generation Period Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800">Article Generation Period</h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Generation Interval (minutes)
                </label>
                <input
                  type="number"
                  value={editorData.articleGenerationPeriodMinutes}
                  onChange={(e) => setEditorData({ ...editorData, articleGenerationPeriodMinutes: parseInt(e.target.value) || 15 })}
                  placeholder="Enter generation period in minutes (e.g., 15)"
                  min="1"
                  max="1440"
                  className={`w-full p-4 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 ${
                    isAdmin
                      ? 'focus:ring-2 focus:ring-red-500 focus:border-transparent'
                      : 'bg-slate-100 cursor-not-allowed opacity-60'
                  }`}
                  readOnly={!isAdmin}
                />
                <p className="text-sm text-slate-500 mt-2">
                  Minimum time interval between article generation runs (1-1440 minutes). The cron job will skip generation if this duration hasn't elapsed since the last run.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Generation Time
                </label>
                <input
                  type="text"
                  value={editorData.lastArticleGenerationTime ? new Date(editorData.lastArticleGenerationTime).toLocaleString() : 'Never'}
                  placeholder="No generation has occurred yet"
                  className="w-full p-4 border border-slate-200 rounded-lg text-slate-800 bg-slate-100 cursor-not-allowed"
                  readOnly
                />
                <p className="text-sm text-slate-500 mt-2">
                  Timestamp of the last successful article generation run. This field is automatically updated by the system.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={fetchEditorData}
              disabled={!isAdmin}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isAdmin
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
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
                disabled={saving || !isAdmin}
                className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
                  isAdmin
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
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

        {/* Manual Job Triggers */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800">Manual Job Triggers</h2>
            </div>

            <p className="text-slate-600">
              Manually trigger scheduled jobs for testing and immediate execution. These jobs run the same logic as the automated cron jobs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reporter Articles Job */}
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Generate Articles</h3>
                    <p className="text-sm text-slate-500">Every 15 minutes</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Triggers article generation for all reporters in the system.
                </p>
                <button
                  onClick={() => triggerJob('reporter')}
                  disabled={jobTriggering === 'reporter' || !isAdmin}
                  className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                    isAdmin
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {jobTriggering === 'reporter' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Trigger Articles</span>
                    </>
                  )}
                </button>
              </div>

              {/* Newspaper Edition Job */}
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Newspaper Edition</h3>
                    <p className="text-sm text-slate-500">Every 3 hours</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Creates a newspaper edition from available articles.
                </p>
                <button
                  onClick={() => triggerJob('newspaper')}
                  disabled={jobTriggering === 'newspaper' || !isAdmin}
                  className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                    isAdmin
                      ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {jobTriggering === 'newspaper' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Edition</span>
                    </>
                  )}
                </button>
              </div>

              {/* Daily Edition Job */}
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Daily Edition</h3>
                    <p className="text-sm text-slate-500">Every 24 hours</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Compiles all newspaper editions into a daily edition.
                </p>
                <button
                  onClick={() => triggerJob('daily')}
                  disabled={jobTriggering === 'daily' || !isAdmin}
                  className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                    isAdmin
                      ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {jobTriggering === 'daily' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Compiling...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Compile Daily</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Information */}
            {jobStatus?.note && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-800">Job Status</h4>
                    <p className="text-sm text-blue-700 mt-1">{jobStatus.note}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500">
          <p>Skylines Editor Configuration Panel</p>
        </div>
      </div>
    </div>
  );
}
