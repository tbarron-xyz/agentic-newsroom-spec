'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  reporterId: string;
  headline: string;
  body: string;
  generationTime: number;
  prompt: string;
}

interface NewspaperEdition {
  id: string;
  stories: Article[];
  generationTime: number;
  prompt: string;
}

export default function EditionsPage() {
  const [editions, setEditions] = useState<NewspaperEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch newspaper editions on component mount
  useEffect(() => {
    fetchEditions();
  }, []);

  const fetchEditions = async () => {
    try {
      const response = await fetch('/api/editions');
      if (response.ok) {
        const data = await response.json();
        setEditions(data);
      } else {
        setMessage('Failed to load newspaper editions');
      }
    } catch (error) {
      setMessage('Error loading newspaper editions');
      console.error('Error fetching newspaper editions:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-8 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white/90 mb-2">
                All Newspaper Editions
              </h1>
              <p className="text-white/70 text-lg">
                Browse and view all available newspaper editions
              </p>
            </div>
            <Link
              href="/"
              className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 px-6 py-4 backdrop-blur-sm rounded-xl text-center font-medium bg-red-500/20 border border-red-500/30 text-red-200">
            {message}
          </div>
        )}

        {editions.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center shadow-2xl">
            <div className="w-16 h-16 backdrop-blur-sm bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-2">No Editions Available</h3>
            <p className="text-white/70">Newspaper editions are generated automatically. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {editions.map((edition: NewspaperEdition) => (
              <div key={edition.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white/90 mb-2">
                    Newspaper Edition
                  </h2>
                  <p className="text-sm text-white/70 mb-2">
                    {formatDate(edition.generationTime)}
                  </p>
                  <p className="text-white/80 text-sm mb-4">
                    {edition.stories.length} stories included
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/90 mb-2">Articles</h4>
                  <div className="space-y-4">
                    {edition.stories.map((article: Article, _index: number) => (
                      <div key={article.id} className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-4">
                        <Link href={`/articles/${article.id}`} className="block">
                          <h5 className="font-semibold text-white/90 mb-2 hover:text-white transition-colors cursor-pointer">{article.headline}</h5>
                        </Link>
                        <p className="text-white/80 text-sm leading-relaxed">{article.body}</p>
                        <div className="mt-2 text-xs text-white/60">
                          Reporter: {article.reporterId} | Generated: {new Date(article.generationTime).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center text-sm text-white/70">
                  Edition ID: {edition.id.slice(0, 12)}...
                </div>

                {/* Prompt Display */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h4 className="text-sm font-semibold text-white/90 mb-2">Generation Prompt</h4>
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/70 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {edition.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-white/50">
          <p>Skylines Edition Archive</p>
        </div>
      </div>
    </div>
  );
}
