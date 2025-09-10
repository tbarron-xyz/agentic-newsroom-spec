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
  const [user, setUser] = useState<User | null>(null);
  const [hasReaderAccess, setHasReaderAccess] = useState(false);

  // Check user authentication and reader access
  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (!reporterId) {
          // If no reporterId and not logged in, redirect to login
          router.push('/login');
          return;
        }
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
          if (!data.hasReader) {
            setError('Reader permission required to view all articles');
            setLoading(false);
            return;
          }
        } else {
          setError('Failed to verify permissions');
          setLoading(false);
          return;
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
      if (!reporterId) {
        setError('Authentication required');
      }
    }
  };

  const fetchArticles = useCallback(async () => {
    try {
      let response;
      if (reporterId) {
        // Fetch articles by specific reporter
        response = await fetch(`/api/articles?reporterId=${reporterId}`);
      } else {
        // Fetch all articles (requires reader permission, checked above)
        const token = localStorage.getItem('accessToken');
        response = await fetch('/api/articles/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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
  }, [reporterId]);

  useEffect(() => {
    if (reporterId) {
      fetchArticles();
    } else if (hasReaderAccess) {
      fetchArticles();
    }
  }, [reporterId, fetchArticles, hasReaderAccess]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Articles</h2>
          <p className="text-slate-600">{error}</p>
        </div>
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
              {reporterId ? 'Articles by Reporter' : 'All Articles'}
            </h1>
            <p className="text-slate-600 text-lg">
              {reporterId ? `Reporter ${reporterId.split('_')[2] || reporterId}` : 'Chronological list of all published articles'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {reporterId ? (
              <Link
                href="/reporters"
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                ← Back to Reporters
              </Link>
            ) : (
              <Link
                href="/"
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                ← Back to Daily Edition
              </Link>
            )}
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Articles Found</h3>
              <p className="text-slate-600">
                {reporterId ? "This reporter hasn't written any articles yet." : "No articles have been published yet."}
              </p>
            </div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="mb-4">
                  <Link
                    href={`/articles/${article.id}`}
                    className="block group"
                  >
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {article.headline}
                    </h2>
                  </Link>
                  <div className="flex items-center text-sm text-slate-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(article.generationTime)}
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {article.body}
                  </p>
                </div>

                {/* Source Messages Section */}
                {article.messageTexts && article.messageTexts.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <button
                      onClick={() => toggleMessages(article.id)}
                      className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
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
                        <h4 className="text-sm font-semibold text-slate-700">Social Media Messages Used:</h4>
                        {article.messageTexts.map((message, index) => (
                          <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-500">Message {index + 1}</span>
                              {article.messageIds && article.messageIds[index] && (
                                <span className="text-xs text-slate-400">ID: {article.messageIds[index]}</span>
                              )}
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap">
                              {message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt Section */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => togglePrompt(article.id)}
                    className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
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
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">AI Generation Prompt:</h4>
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                        {article.prompt}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Article ID: {article.id}</span>
                    <span>Reporter: {article.reporterId}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500">
          <p>Skylines Articles</p>
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ArticlesContent />
    </Suspense>
  );
}
