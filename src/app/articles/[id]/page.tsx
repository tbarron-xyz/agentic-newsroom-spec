'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const fetchArticle = useCallback(async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
      } else if (response.status === 404) {
        setError('Article not found');
      } else {
        setError('Failed to load article');
      }
    } catch (error) {
      setError('Error loading article');
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId, fetchArticle]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Article</h2>
          <p className="text-slate-600">{error}</p>
          <Link
            href="/articles"
            className="mt-4 inline-block px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Article Details
            </h1>
            <p className="text-slate-600 text-lg">
              Reporter {article.reporterId.split('_')[2] || article.reporterId}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href={`/articles?reporterId=${article.reporterId}`}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              ← Back to Articles
            </Link>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">
              {article.headline}
            </h2>
            <div className="flex items-center text-sm text-slate-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(article.generationTime)}
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-8">
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
              {article.body}
            </div>
          </div>

          {/* Message Texts Section */}
          {article.messageTexts && article.messageTexts.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <button
                onClick={() => setShowMessages(!showMessages)}
                className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg
                  className={`w-4 h-4 mr-2 transition-transform ${showMessages ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {showMessages ? 'Hide Source Messages' : `Show Source Messages (${article.messageTexts.length})`}
              </button>

              {showMessages && (
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
          <div className="mt-8 pt-8 border-t border-slate-200">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <svg
                className={`w-4 h-4 mr-2 transition-transform ${showPrompt ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
            </button>

            {showPrompt && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">AI Generation Prompt:</h4>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {article.prompt}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Article ID: {article.id}</span>
              <span>Reporter: {article.reporterId}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500">
          <p>AI Newsroom Article</p>
        </div>
      </div>
    </div>
  );
}
