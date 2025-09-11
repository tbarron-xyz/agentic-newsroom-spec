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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              All Newspaper Editions
            </h1>
            <p className="text-slate-600 text-lg">
              Browse and view all available newspaper editions
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 px-6 py-4 rounded-lg text-center font-medium bg-red-100 text-red-800">
            {message}
          </div>
        )}

        {editions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Editions Available</h3>
            <p className="text-slate-600">Newspaper editions are generated automatically. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {editions.map((edition: NewspaperEdition) => (
              <div key={edition.id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    Newspaper Edition
                  </h2>
                  <p className="text-sm text-slate-500 mb-2">
                    {formatDate(edition.generationTime)}
                  </p>
                  <p className="text-slate-600 text-sm mb-4">
                    {edition.stories.length} stories included
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Articles</h4>
                  <div className="space-y-4">
                    {edition.stories.map((article: Article, _index: number) => (
                      <div key={article.id} className="border border-slate-200 rounded-lg p-4">
                        <h5 className="font-semibold text-slate-800 mb-2">{article.headline}</h5>
                        <p className="text-slate-600 text-sm leading-relaxed">{article.body}</p>
                        <div className="mt-2 text-xs text-slate-500">
                          Reporter: {article.reporterId} | Generated: {new Date(article.generationTime).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center text-sm text-slate-500">
                  Edition ID: {edition.id.slice(0, 12)}...
                </div>

                {/* Prompt Display */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Generation Prompt</h4>
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {edition.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500">
          <p>Skylines Edition Archive</p>
        </div>
      </div>
    </div>
  );
}
