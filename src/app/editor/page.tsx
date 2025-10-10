'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KpiName } from '../models/types';

interface EditorData {
  bio: string;
  prompt: string;
  modelName: string;
  messageSliceCount: number;
  inputTokenCost: number;
  outputTokenCost: number;
  articleGenerationPeriodMinutes: number;
  lastArticleGenerationTime: number | null;
  eventGenerationPeriodMinutes: number;
  lastEventGenerationTime: number | null;
  editionGenerationPeriodMinutes: number;
  lastEditionGenerationTime: number | null;
}

interface KpiData {
  [KpiName.TOTAL_AI_API_SPEND]: number;
  [KpiName.TOTAL_TEXT_INPUT_TOKENS]: number;
  [KpiName.TOTAL_TEXT_OUTPUT_TOKENS]: number;
}

interface JobStatus {
  status: {
    reporterJob: boolean;
    newspaperJob: boolean;
    dailyJob: boolean;
  };
  lastRuns: {
    reporterJob: Date | null;
    newspaperJob: Date | null;
    dailyJob: Date | null;
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
    inputTokenCost: 0.050,
    outputTokenCost: 0.400,
    articleGenerationPeriodMinutes: 15,
    lastArticleGenerationTime: null,
    eventGenerationPeriodMinutes: 30,
    lastEventGenerationTime: null,
    editionGenerationPeriodMinutes: 180,
    lastEditionGenerationTime: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [jobTriggering, setJobTriggering] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const router = useRouter();

  // Check admin status and fetch data on component mount
  useEffect(() => {
    checkAdminStatus();
    fetchEditorData();
    fetchJobStatus();
    fetchKpiData();
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

  const fetchKpiData = async () => {
    try {
      const response = await fetch('/api/kpi');
      if (response.ok) {
        const data = await response.json();
        setKpiData(data);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000" style={{animationDelay: '1s'}}></div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 relative z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 py-8 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000" style={{animationDelay: '1s'}}></div>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white/90 mb-2">
                Newsroom Editor Configuration
              </h1>
              <p className="text-white/70 text-lg">
                Configure your AI editor's biography and editorial guidelines
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={handleLogout}
                  className="relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium overflow-hidden group hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 space-y-8 shadow-2xl">
          {/* Bio Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Editor Biography</h2>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
              <textarea
                value={editorData.bio}
                onChange={(e) => setEditorData({ ...editorData, bio: e.target.value })}
                placeholder="Enter the editor's biography..."
                className={`w-full h-32 p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg resize-none text-white/90 placeholder-white/50 ${
                  isAdmin
                    ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                    : 'bg-white/5 cursor-not-allowed opacity-60'
                }`}
                rows={4}
                readOnly={!isAdmin}
              />
              <p className="text-sm text-white/70 mt-2">
                This biography will be used to inform the AI's editorial decisions and writing style.
              </p>
            </div>
          </div>

          {/* Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Editorial Prompt</h2>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
              <textarea
                value={editorData.prompt}
                onChange={(e) => setEditorData({ ...editorData, prompt: e.target.value })}
                placeholder="Enter the editorial guidelines and prompt..."
                className={`w-full h-48 p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg resize-none text-white/90 placeholder-white/50 ${
                  isAdmin
                    ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                    : 'bg-white/5 cursor-not-allowed opacity-60'
                }`}
                rows={6}
                readOnly={!isAdmin}
              />
              <p className="text-sm text-white/70 mt-2">
                Define the editorial standards, tone, and guidelines that will guide the AI's newsroom decisions.
              </p>
            </div>
          </div>

           {/* Model Name Section */}
           <div className="space-y-4">
             <div className="flex items-center space-x-3">
               <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                 <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                 </svg>
               </div>
               <h2 className="text-2xl font-semibold text-white/90">AI Model Configuration</h2>
             </div>
             <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
               {/* Model Name */}
               <div>
                 <label className="block text-sm font-medium text-white/80 mb-2">
                   Model Name
                 </label>
                 <input
                   type="text"
                   value={editorData.modelName}
                   onChange={(e) => setEditorData({ ...editorData, modelName: e.target.value })}
                   placeholder="Enter AI model name (e.g., gpt-5-nano)"
                   className={`w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 ${
                     isAdmin
                       ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                       : 'bg-white/5 cursor-not-allowed opacity-60'
                   }`}
                   readOnly={!isAdmin}
                 />
                 <p className="text-sm text-white/70 mt-2">
                   Specify the AI model to use for content generation. This setting affects all AI operations in the newsroom.
                 </p>
               </div>

               {/* Input Token Cost */}
               <div>
                 <label className="block text-sm font-medium text-white/80 mb-2">
                   Input Token Cost ($ per 1M tokens)
                 </label>
                 <input
                   type="number"
                   value={editorData.inputTokenCost}
                   onChange={(e) => setEditorData({ ...editorData, inputTokenCost: parseFloat(e.target.value) || 0 })}
                   placeholder="0.050"
                   min="0"
                   step="0.001"
                   className={`w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 ${
                     isAdmin
                       ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                       : 'bg-white/5 cursor-not-allowed opacity-60'
                   }`}
                   readOnly={!isAdmin}
                 />
                 <p className="text-sm text-white/70 mt-2">
                   Cost per million input tokens for AI API calls. Used to calculate and track API spending.
                 </p>
               </div>

               {/* Output Token Cost */}
               <div>
                 <label className="block text-sm font-medium text-white/80 mb-2">
                   Output Token Cost ($ per 1M tokens)
                 </label>
                 <input
                   type="number"
                   value={editorData.outputTokenCost}
                   onChange={(e) => setEditorData({ ...editorData, outputTokenCost: parseFloat(e.target.value) || 0 })}
                   placeholder="0.400"
                   min="0"
                   step="0.001"
                   className={`w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 ${
                     isAdmin
                       ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                       : 'bg-white/5 cursor-not-allowed opacity-60'
                   }`}
                   readOnly={!isAdmin}
                 />
                 <p className="text-sm text-white/70 mt-2">
                   Cost per million output tokens for AI API calls. Used to calculate and track API spending.
                 </p>
               </div>
             </div>
           </div>

          {/* Message Slice Count Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Message Slice Count</h2>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
              <input
                type="number"
                value={editorData.messageSliceCount}
                onChange={(e) => setEditorData({ ...editorData, messageSliceCount: parseInt(e.target.value) || 200 })}
                placeholder="Enter message slice count (e.g., 200)"
                min="1"
                max="1000"
                className={`w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 ${
                  isAdmin
                    ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                    : 'bg-white/5 cursor-not-allowed opacity-60'
                }`}
                readOnly={!isAdmin}
              />
              <p className="text-sm text-white/70 mt-2">
                Number of recent messages to fetch from Bluesky for article generation (1-1000). Higher values provide more context but may slow down processing.
              </p>
            </div>
          </div>

          {/* Article Generation Period Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Article Generation Period</h2>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Generation Interval (minutes)
                </label>
                <input
                  type="number"
                  value={editorData.articleGenerationPeriodMinutes}
                  onChange={(e) => setEditorData({ ...editorData, articleGenerationPeriodMinutes: parseInt(e.target.value) || 15 })}
                  placeholder="Enter generation period in minutes (e.g., 15)"
                  min="1"
                  max="1440"
                  className={`w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 ${
                    isAdmin
                      ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                      : 'bg-white/5 cursor-not-allowed opacity-60'
                  }`}
                  readOnly={!isAdmin}
                />
                <p className="text-sm text-white/70 mt-2">
                  Minimum time interval between article generation runs (1-1440 minutes). The cron job will skip generation if this duration hasn't elapsed since the last run.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Last Generation Time
                </label>
                <input
                  type="text"
                  value={editorData.lastArticleGenerationTime ? new Date(editorData.lastArticleGenerationTime).toLocaleString() : 'Never'}
                  placeholder="No generation has occurred yet"
                  className="w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 bg-white/5 cursor-not-allowed"
                  readOnly
                />
                <p className="text-sm text-white/70 mt-2">
                  Timestamp of the last successful article generation run. This field is automatically updated by the system.
                </p>
              </div>
            </div>
          </div>

          {/* Event Generation Period Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Event Generation Period</h2>
            </div>
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Generation Interval (minutes)
                </label>
                <input
                  type="number"
                  value={editorData.eventGenerationPeriodMinutes}
                  onChange={(e) => setEditorData({ ...editorData, eventGenerationPeriodMinutes: parseInt(e.target.value) || 30 })}
                  placeholder="Enter generation period in minutes (e.g., 30)"
                  min="1"
                  max="1440"
                  className={`w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 ${
                    isAdmin
                      ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                      : 'bg-white/5 cursor-not-allowed opacity-60'
                  }`}
                  readOnly={!isAdmin}
                />
                <p className="text-sm text-white/70 mt-2">
                  Minimum time interval between event generation runs (1-1440 minutes). The cron job will skip generation if this duration hasn't elapsed since the last run.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Last Generation Time
                </label>
                <input
                  type="text"
                  value={editorData.lastEventGenerationTime ? new Date(editorData.lastEventGenerationTime).toLocaleString() : 'Never'}
                  placeholder="No generation has occurred yet"
                  className="w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 bg-white/5 cursor-not-allowed"
                  readOnly
                />
                <p className="text-sm text-white/70 mt-2">
                  Timestamp of the last successful event generation run. This field is automatically updated by the system.
                </p>
              </div>
            </div>
           </div>

           {/* Edition Generation Period Section */}
           <div className="space-y-4">
             <div className="flex items-center space-x-3">
               <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                 <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
                 </svg>
               </div>
               <h2 className="text-2xl font-semibold text-white/90">Edition Generation Period</h2>
             </div>
             <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-white/80 mb-2">
                   Generation Interval (minutes)
                 </label>
                 <input
                   type="number"
                   value={editorData.editionGenerationPeriodMinutes}
                   onChange={(e) => setEditorData({ ...editorData, editionGenerationPeriodMinutes: parseInt(e.target.value) || 180 })}
                   placeholder="Enter generation period in minutes (e.g., 180)"
                   min="1"
                   max="1440"
                   className={`w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 ${
                     isAdmin
                       ? 'focus:ring-2 focus:ring-white/50 focus:border-white/30'
                       : 'bg-white/5 cursor-not-allowed opacity-60'
                   }`}
                   readOnly={!isAdmin}
                 />
                 <p className="text-sm text-white/70 mt-2">
                   Minimum time interval between edition generation runs (1-1440 minutes). The cron job will skip generation if this duration hasn't elapsed since the last run.
                 </p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-white/80 mb-2">
                   Last Generation Time
                 </label>
                 <input
                   type="text"
                   value={editorData.lastEditionGenerationTime ? new Date(editorData.lastEditionGenerationTime).toLocaleString() : 'Never'}
                   placeholder="No generation has occurred yet"
                   className="w-full p-4 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white/90 bg-white/5 cursor-not-allowed"
                   readOnly
                 />
                 <p className="text-sm text-white/70 mt-2">
                   Timestamp of the last successful edition generation run. This field is automatically updated by the system.
                 </p>
               </div>
             </div>
           </div>

           {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/20">
            <button
              onClick={fetchEditorData}
              disabled={!isAdmin}
              className={`relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300 ${
                !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Refresh Data
            </button>

            <div className="flex items-center space-x-4">
              {message && (
                <div className={`px-4 py-2 backdrop-blur-sm rounded-xl text-sm font-medium border ${
                  message.includes('successfully')
                    ? 'bg-green-500/20 border-green-500/30 text-green-200'
                    : 'bg-red-500/20 border-red-500/30 text-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                onClick={saveEditorData}
                disabled={saving || !isAdmin}
                className={`relative px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium overflow-hidden group hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 ${
                  !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10 flex items-center space-x-2">
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
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Display Section */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">AI Usage Metrics</h2>
            </div>

            <p className="text-white/70">
              Track your AI API usage and costs across all newsroom operations.
            </p>

            {kpiData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total AI API Spend */}
                <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">API Spend</h3>
                      <p className="text-sm text-white/70">Total cost</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-200">
                    ${kpiData[KpiName.TOTAL_AI_API_SPEND].toFixed(4)}
                  </div>
                </div>

                {/* Total Input Tokens */}
                <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">Input Tokens</h3>
                      <p className="text-sm text-white/70">Total sent</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-200">
                    {kpiData[KpiName.TOTAL_TEXT_INPUT_TOKENS].toLocaleString()}
                  </div>
                </div>

                {/* Total Output Tokens */}
                <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">Output Tokens</h3>
                      <p className="text-sm text-white/70">Total received</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-200">
                    {kpiData[KpiName.TOTAL_TEXT_OUTPUT_TOKENS].toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30 mx-auto mb-4"></div>
                <p className="text-white/70">Loading KPI data...</p>
              </div>
            )}

            <div className="flex items-center justify-center pt-4">
              <button
                onClick={fetchKpiData}
                className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
              >
                Refresh Metrics
              </button>
            </div>
          </div>
        </div>

        {/* Manual Job Triggers */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mt-8 shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Manual Job Triggers</h2>
            </div>

            <p className="text-white/70">
              Manually trigger scheduled jobs for testing and immediate execution. These jobs run the same logic as the automated cron jobs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reporter Articles Job */}
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90">Generate Articles</h3>
                    <p className="text-sm text-white/70">Every 15 minutes</p>
                  </div>
                </div>
                <p className="text-sm text-white/70">
                  Triggers article generation for all reporters in the system.
                </p>
                <button
                  onClick={() => triggerJob('reporter')}
                  disabled={jobTriggering === 'reporter' || !isAdmin}
                  className={`w-full relative px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium overflow-hidden group hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 ${
                    !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10 flex items-center justify-center space-x-2">
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
                  </span>
                </button>
              </div>

              {/* Newspaper Edition Job */}
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90">Newspaper Edition</h3>
                    <p className="text-sm text-white/70">Every 3 hours</p>
                  </div>
                </div>
                <p className="text-sm text-white/70">
                  Creates a newspaper edition from available articles.
                </p>
                <button
                  onClick={() => triggerJob('newspaper')}
                  disabled={jobTriggering === 'newspaper' || !isAdmin}
                  className={`w-full relative px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium overflow-hidden group hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 ${
                    !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10 flex items-center justify-center space-x-2">
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
                  </span>
                </button>
              </div>

              {/* Daily Edition Job */}
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90">Daily Edition</h3>
                    <p className="text-sm text-white/70">Every 24 hours</p>
                  </div>
                </div>
                <p className="text-sm text-white/70">
                  Compiles all newspaper editions into a daily edition.
                </p>
                <button
                  onClick={() => triggerJob('daily')}
                  disabled={jobTriggering === 'daily' || !isAdmin}
                  className={`w-full relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium overflow-hidden group hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 ${
                    !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10 flex items-center justify-center space-x-2">
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
                  </span>
                </button>
              </div>
            </div>

            {/* Job Status Information */}
            {jobStatus && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white/90">Job Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Reporter Job Status */}
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white/90">Article Generation</span>
                      <div className="flex items-center space-x-2">
                        {jobStatus.status.reporterJob ? (
                          <div className="flex items-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border border-yellow-400 border-t-transparent"></div>
                            <span className="text-xs text-yellow-200">Running</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-200">Idle</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-white/70">
                      <div>Last run: {jobStatus.lastRuns.reporterJob ? jobStatus.lastRuns.reporterJob.toLocaleString() : 'Never'}</div>
                      <div>Next run: {jobStatus.nextRuns.reporterJob ? jobStatus.nextRuns.reporterJob.toLocaleString() : 'Unknown'}</div>
                    </div>
                  </div>

                  {/* Newspaper Job Status */}
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white/90">Newspaper Edition</span>
                      <div className="flex items-center space-x-2">
                        {jobStatus.status.newspaperJob ? (
                          <div className="flex items-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border border-yellow-400 border-t-transparent"></div>
                            <span className="text-xs text-yellow-200">Running</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-200">Idle</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-white/70">
                      <div>Last run: {jobStatus.lastRuns.newspaperJob ? jobStatus.lastRuns.newspaperJob.toLocaleString() : 'Never'}</div>
                      <div>Next run: {jobStatus.nextRuns.newspaperJob ? jobStatus.nextRuns.newspaperJob.toLocaleString() : 'Unknown'}</div>
                    </div>
                  </div>

                  {/* Daily Job Status */}
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white/90">Daily Edition</span>
                      <div className="flex items-center space-x-2">
                        {jobStatus.status.dailyJob ? (
                          <div className="flex items-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border border-yellow-400 border-t-transparent"></div>
                            <span className="text-xs text-yellow-200">Running</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-200">Idle</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-white/70">
                      <div>Last run: {jobStatus.lastRuns.dailyJob ? jobStatus.lastRuns.dailyJob.toLocaleString() : 'Never'}</div>
                      <div>Next run: {jobStatus.nextRuns.dailyJob ? jobStatus.nextRuns.dailyJob.toLocaleString() : 'Unknown'}</div>
                    </div>
                  </div>
                </div>

                {jobStatus.note && (
                  <div className="backdrop-blur-sm bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-200 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-blue-200">Note</h4>
                        <p className="text-sm text-blue-100 mt-1">{jobStatus.note}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/50">
          <p>Skylines Editor Configuration Panel</p>
        </div>
      </div>
    </div>
  );
}
