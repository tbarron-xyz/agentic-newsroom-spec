'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse duration-3000"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse duration-3000 delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse duration-3000 delay-500"></div>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 relative z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 py-8 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Welcome Box for Non-Authenticated Users */}
        {!user && (
           <div className="relative mb-8 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 backdrop-blur-sm bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white/90 mb-3">
                  Welcome to Skylines AI Newsroom
                </h2>
                <div className="text-white/80 space-y-3">
                  <p className="text-base leading-relaxed">
                    Each article in our newsroom is sourced from real messages on the Bluesky social media platform's firehose - a continuous stream of public posts and conversations.
                  </p>
                  <p className="text-base leading-relaxed">
                    Every article clearly states which specific social media messages were used to write and inform the content, ensuring transparency about our AI-powered reporting process.
                  </p>

                </div>
               </div>
             </div>

             {/* Floating Events Info Box */}
             <div className="absolute top-4 right-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 shadow-xl hover:bg-white/15 transition-all duration-300">
               <Link href="/events" className="block text-center">
                 <h3 className="text-sm font-bold text-white/90 mb-2">Events!</h3>
                 <p className="text-xs text-white/70">Explore list-of-facts style event coverage sourced from real Bluesky conversations</p>
               </Link>
             </div>
           </div>
         )}

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white/90 mb-2">
            Daily Edition
          </h1>
            <p className="text-white/70 text-lg">
              Read today's comprehensive newspaper edition
            </p>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 px-6 py-4 backdrop-blur-sm rounded-xl text-center font-medium bg-red-500/20 border border-red-500/30 text-red-200">
            {message}
          </div>
        )}

        {dailyEditions.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center shadow-2xl">
            <div className="w-16 h-16 backdrop-blur-sm bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-2">No Daily Editions Available</h3>
            <p className="text-white/70">Daily editions are generated automatically. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Edition Selector */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-semibold text-white/90 mb-4">Available Editions</h2>
                <div className="space-y-2">
                  {dailyEditions.map((edition) => (
                    <button
                      key={edition.id}
                      onClick={() => setSelectedEdition(edition)}
                      className={`w-full text-left px-4 py-3 backdrop-blur-sm rounded-xl transition-all duration-300 ${
                        selectedEdition?.id === edition.id
                          ? 'bg-white/20 border-2 border-white/30 text-white'
                          : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {edition.newspaperName || 'Daily Edition'}
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        {formatDate(edition.generationTime)}
                      </div>
                      <div className="text-xs text-white/60">
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
                  <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <div className="border-b border-white/20 pb-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold text-white/90">
                          {selectedEdition.newspaperName || 'Daily Edition'}
                        </h2>
                        <span className="text-sm text-white/70">
                          {formatDate(selectedEdition.generationTime)}
                        </span>
                      </div>
                      <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                        {selectedEdition.frontPageHeadline}
                      </h1>
                    </div>

                    <div className="prose prose-lg max-w-none">
                      <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                        {selectedEdition.frontPageArticle}
                      </p>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white/90">Today's Stories</h2>
                    {selectedEdition.topics.map((topic, index) => (
                      <div key={index} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
                        <div className="mb-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 backdrop-blur-sm bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-white/80">
                                {index + 1}
                              </span>
                            </div>
                            <span className="px-3 py-1 backdrop-blur-sm bg-white/10 border border-white/20 text-white/80 rounded-full text-sm font-medium">
                              {topic.name}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-white/90 mb-2">
                            {topic.headline}
                          </h3>
                          <p className="text-sm text-white/70 italic">
                            {topic.oneLineSummary}
                          </p>
                        </div>

                        <div className="prose prose-lg max-w-none mb-6">
                          <p className="text-white/80 leading-relaxed mb-4">
                            {topic.newsStoryFirstParagraph}
                          </p>
                          <p className="text-white/80 leading-relaxed">
                            {topic.newsStorySecondParagraph}
                          </p>
                        </div>

                        {/* Social Media & Comments */}
                        <div className="border-t border-white/20 pt-6 space-y-4">
                           <div>
                             <h4 className="text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                               Social Media Buzz
                               <div className="relative group">
                                 <svg className="w-4 h-4 text-white/60 hover:text-white/80 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                 </svg>
                                 <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                   To assist in semantic parsing of the given story, Skylines generates several opposing reactions to the story.
                                 </div>
                               </div>
                             </h4>
                             <p className="text-white/70 italic">"{topic.supportingSocialMediaMessage}"</p>
                           </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-red-300 mb-2">Skeptical View</h4>
                              <p className="text-white/80 text-sm italic">"{topic.skepticalComment}"</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-green-300 mb-2">Supportive View</h4>
                              <p className="text-white/80 text-sm italic">"{topic.gullibleComment}"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Model Feedback */}
                  {user?.role === 'admin' && selectedEdition.modelFeedbackAboutThePrompt.positive && (
                    <div className="backdrop-blur-xl sparkly-bg border border-white/20 rounded-2xl p-8 shadow-2xl">
                      <h2 className="text-2xl font-bold text-white/90 mb-6">Editorial Notes</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-green-300 mb-3">What Worked Well</h3>
                          <p className="text-white/80">{selectedEdition.modelFeedbackAboutThePrompt.positive}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-300 mb-3">Areas for Improvement</h3>
                          <p className="text-white/80">{selectedEdition.modelFeedbackAboutThePrompt.negative}</p>
                        </div>
                      </div>
                    </div>
                  )}

                   {/* Generation Prompt */}
                   <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
                     <div className="flex items-center gap-2 mb-6 relative group">
                       <h2 className="text-2xl font-bold text-white/90">Generation Prompt</h2>
                       <div className="relative group">
                         <svg className="w-4 h-4 text-white/60 hover:text-white/80 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                         </svg>
                         <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                           To ensure full journalistic transparency, this is the exact prompt given to the AI model to generate this daily edition. This allows the user to verify that no funny business has taken place.
                         </div>
                       </div>
                     </div>
                    <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/70 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {selectedEdition.prompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-white/50">
          <p>Skylines AI Newsroom Daily Edition Reader</p>
        </div>
      </div>
    </div>
  );
}
