'use client';

import { useState, useEffect } from 'react';

interface Topic {
  name: string;
  headline: string;
  newsStoryFirstParagraph: string;
  newsStorySecondParagraph: string;
  oneLineSummary: string;
  supportingSocialMediaMessage: string;
  skepticalComment: string;
  gullibleComment: string;
}

interface DailyEdition {
  id: string;
  editions: string[];
  generationTime: number;
  frontPageHeadline: string;
  frontPageArticle: string;
  newspaperName: string;
  topics: Topic[];
  modelFeedbackAboutThePrompt: {
    positive: string;
    negative: string;
  };
  prompt: string;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  hasReader: boolean;
  hasReporter: boolean;
  hasEditor: boolean;
}

export default function Home() {
  const [dailyEditions, setDailyEditions] = useState<DailyEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdition, setSelectedEdition] = useState<DailyEdition | null>(null);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fetch daily editions on component mount
  useEffect(() => {
    fetchDailyEditions();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAuthLoading(false);
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
      setAuthLoading(false);
    }
  };

  const fetchDailyEditions = async () => {
    try {
      const response = await fetch('/api/daily-editions');
      if (response.ok) {
        const data = await response.json();
        setDailyEditions(data);
        // Auto-select the latest edition if available
        if (data.length > 0) {
          setSelectedEdition(data[0]);
        }
      } else {
        setMessage('Failed to load daily editions');
      }
    } catch (error) {
      setMessage('Error loading daily editions');
      console.error('Error fetching daily editions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Box for Non-Authenticated Users */}
        {!user && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  Welcome to Skylines AI Newsroom
                </h2>
                <div className="text-slate-700 space-y-3">
                  <p className="text-lg leading-relaxed">
                    Each article in our newsroom is sourced from real messages on the Bluesky social media platform's firehose - a continuous stream of public posts and conversations.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Every article clearly states which specific social media messages were used to write and inform the content, ensuring transparency about our AI-powered reporting process.
                  </p>
                  <div className="mt-4 p-4 bg-white/50 rounded-lg border border-blue-200">
                    <p className="text-sm text-slate-600 italic">
                      "Our commitment is to provide accurate, sourced journalism powered by artificial intelligence while maintaining full transparency about our data sources."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Daily Edition
          </h1>
            <p className="text-slate-600 text-lg">
              Read today's comprehensive newspaper edition
            </p>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 px-6 py-4 rounded-lg text-center font-medium bg-red-100 text-red-800">
            {message}
          </div>
        )}

        {dailyEditions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Daily Editions Available</h3>
            <p className="text-slate-600">Daily editions are generated automatically. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Edition Selector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Available Editions</h2>
                <div className="space-y-2">
                  {dailyEditions.map((edition) => (
                    <button
                      key={edition.id}
                      onClick={() => setSelectedEdition(edition)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedEdition?.id === edition.id
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {edition.newspaperName || 'Daily Edition'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatDate(edition.generationTime)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {edition.topics.length} topics
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Edition Content */}
            <div className="lg:col-span-3">
              {selectedEdition && (
                <div className="space-y-8">
                  {/* Front Page */}
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="border-b border-slate-200 pb-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold text-slate-800">
                          {selectedEdition.newspaperName || 'Daily Edition'}
                        </h2>
                        <span className="text-sm text-slate-500">
                          {formatDate(selectedEdition.generationTime)}
                        </span>
                      </div>
                      <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
                        {selectedEdition.frontPageHeadline}
                      </h1>
                    </div>

                    <div className="prose prose-lg max-w-none">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedEdition.frontPageArticle}
                      </p>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Today's Stories</h2>
                    {selectedEdition.topics.map((topic, index) => (
                      <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="mb-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                              {topic.name}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-800 mb-2">
                            {topic.headline}
                          </h3>
                          <p className="text-sm text-slate-600 italic">
                            {topic.oneLineSummary}
                          </p>
                        </div>

                        <div className="prose prose-lg max-w-none mb-6">
                          <p className="text-slate-700 leading-relaxed mb-4">
                            {topic.newsStoryFirstParagraph}
                          </p>
                          <p className="text-slate-700 leading-relaxed">
                            {topic.newsStorySecondParagraph}
                          </p>
                        </div>

                        {/* Social Media & Comments */}
                        <div className="border-t border-slate-200 pt-6 space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Social Media Buzz</h4>
                            <p className="text-slate-600 italic">"{topic.supportingSocialMediaMessage}"</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-red-600 mb-2">Skeptical View</h4>
                              <p className="text-slate-600 text-sm italic">"{topic.skepticalComment}"</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-green-600 mb-2">Supportive View</h4>
                              <p className="text-slate-600 text-sm italic">"{topic.gullibleComment}"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Model Feedback */}
                  {selectedEdition.modelFeedbackAboutThePrompt.positive && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6">Editorial Notes</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-green-600 mb-3">What Worked Well</h3>
                          <p className="text-slate-700">{selectedEdition.modelFeedbackAboutThePrompt.positive}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-600 mb-3">Areas for Improvement</h3>
                          <p className="text-slate-700">{selectedEdition.modelFeedbackAboutThePrompt.negative}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generation Prompt */}
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Generation Prompt</h2>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {selectedEdition.prompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500">
          <p>Skylines AI Newsroom Daily Edition Reader</p>
        </div>
      </div>
    </div>
  );
}
