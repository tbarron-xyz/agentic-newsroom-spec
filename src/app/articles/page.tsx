'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Article {
  id: string;
  reporterId: string;
  headline: string;
  body: string;
  generationTime: number;
  prompt: string;
  messageIds: string[];
  messageTexts: string[];
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  hasReader: boolean;
  hasReporter: boolean;
  hasEditor: boolean;
}

function ArticlesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reporterId = searchParams.get('reporterId');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [_user, setUser] = useState<User | null>(null);
  const [hasReaderAccess, setHasReaderAccess] = useState(false);

  const checkUserAccess = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Allow public access - no redirect needed
        return;
      }

      // Check reader ability if no reporterId (all articles view)
      if (!reporterId) {
        const response = await fetch('/api/abilities/reader', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setHasReaderAccess(data.hasReader);
        } else {
          // If we can't check permissions, assume no reader access
          setHasReaderAccess(false);
        }
      }

      // Get user info for display
      const userResponse = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      // Continue with public access if there's an error
    }
  }, [reporterId]);

  // Check user authentication and reader access
  useEffect(() => {
    checkUserAccess();
  }, [checkUserAccess]);

  const fetchArticles = useCallback(async () => {
    try {
      let response;
      if (reporterId) {
        // Fetch articles by specific reporter
        response = await fetch(`/api/articles?reporterId=${reporterId}`);
      } else {
        // Check if user has reader access for all articles
        const token = localStorage.getItem('accessToken');
        if (token && hasReaderAccess) {
          // User is authenticated and has reader access - fetch all articles
          response = await fetch('/api/articles/all', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } else {
          // User is not authenticated or doesn't have reader access - fetch latest 5 articles
          response = await fetch('/api/articles/public');
        }
      }

      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load articles');
      }
    } catch (error) {
      setError('Error loading articles');
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  }, [reporterId, hasReaderAccess]);

  useEffect(() => {
    if (reporterId) {
      fetchArticles();
    } else {
      // For all articles view, fetch regardless of reader access (will use public endpoint if needed)
      fetchArticles();
    }
  }, [reporterId, fetchArticles]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePrompt = (articleId: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedPrompts(newExpanded);
  };

  const toggleMessages = (articleId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedMessages(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 relative z-10"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white/90 mb-2">Error Loading Articles</h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-8 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white/90 mb-2">
                {reporterId ? 'Articles by Reporter' : (!hasReaderAccess ? 'Latest Articles' : 'All Articles')}
              </h1>
              <p className="text-white/70 text-lg">
                {reporterId
                  ? `Reporter ${reporterId.split('_')[2] || reporterId} (${articles.length} articles)`
                  : !hasReaderAccess
                    ? `Showing the ${articles.length} most recent articles (login with Reader access to see all articles)`
                    : `Chronological list of all published articles (${articles.length} articles)`
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {reporterId ? (
                <Link
                  href="/reporters"
                  className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
                >
                  ← Back to Reporters
                </Link>
              ) : (
                <Link
                  href="/"
                  className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
                >
                  ← Back to Daily Edition
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          {articles.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center shadow-2xl">
              <div className="w-16 h-16 backdrop-blur-sm bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">No Articles Found</h3>
              <p className="text-white/70">
                {reporterId ? "This reporter hasn't written any articles yet." : "No articles have been published yet."}
              </p>
            </div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl hover:bg-white/15 transition-all duration-300">
                <div className="mb-4">
                  <Link
                    href={`/articles/${article.id}`}
                    className="block group"
                  >
                    <h2 className="text-2xl font-bold text-white/90 mb-2 group-hover:text-white transition-colors">
                      {article.headline}
                    </h2>
                  </Link>
                  <div className="flex items-center text-sm text-white/70">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(article.generationTime)}
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                    {article.body}
                  </p>
                </div>

                {/* Source Messages Section */}
                {article.messageTexts && article.messageTexts.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <button
                      onClick={() => toggleMessages(article.id)}
                      className="flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 mr-2 transition-transform ${expandedMessages.has(article.id) ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {expandedMessages.has(article.id) ? 'Hide Source Messages' : `Show Source Messages (${article.messageTexts.length})`}
                    </button>

                    {expandedMessages.has(article.id) && (
                      <div className="mt-4 space-y-4">
                        <h4 className="text-sm font-semibold text-white/90">Social Media Messages Used:</h4>
                        {article.messageTexts.map((message, index) => (
                          <div key={index} className="p-4 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-white/70">Message {index + 1}</span>
                              {article.messageIds && article.messageIds[index] && (
                                <span className="text-xs text-white/50">ID: {article.messageIds[index]}</span>
                              )}
                            </div>
                            <div className="text-sm text-white/80 whitespace-pre-wrap">
                              {message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt Section */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <button
                    onClick={() => togglePrompt(article.id)}
                    className="flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 mr-2 transition-transform ${expandedPrompts.has(article.id) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {expandedPrompts.has(article.id) ? 'Hide Prompt' : 'Show Prompt'}
                  </button>

                  {expandedPrompts.has(article.id) && (
                    <div className="mt-4 p-4 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg">
                      <h4 className="text-sm font-semibold text-white/90 mb-2">AI Generation Prompt:</h4>
                      <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono leading-relaxed">
                        {article.prompt}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Article ID: {article.id}</span>
                    <span>Reporter: {article.reporterId}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/50">
          <p>Skylines Articles</p>
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 relative z-10"></div>
      </div>
    }>
      <ArticlesContent />
    </Suspense>
  );
}
