'use client';

import { useState, useEffect } from 'react';
import { User } from '../../models/types';

interface BlueskyMessage {
  did: string;
  text: string;
  time: number;
}

interface BlueskyResponse {
  messages: BlueskyMessage[];
  count: number;
  timestamp: number;
}

export default function BlueskyMessagesPage() {
  const [data, setData] = useState<BlueskyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthAndFetchMessages();
  }, []);

  const checkAuthAndFetchMessages = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // First, verify the current user
      const userResponse = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      const userData = await userResponse.json();
      setCurrentUser(userData.user);

      // Check if user is admin
      if (userData.user.role !== 'admin') {
        setError('Admin access required');
        setLoading(false);
        return;
      }

      // Fetch Bluesky messages
      const messagesResponse = await fetch('/api/admin/bluesky-messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch Bluesky messages');
      }

      const messagesData = await messagesResponse.json();
      setData(messagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading Bluesky messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="text-red-300 text-lg font-semibold mb-2">Access Denied</div>
          <p className="text-white/80">{error}</p>
          <a
            href="/login"
            className="group relative inline-flex items-center mt-4 px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <span className="relative">Go to Login</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20">
          <div className="px-6 py-4 border-b border-white/20">
            <h1 className="text-2xl font-bold text-white">Bluesky Messages</h1>
             <p className="mt-1 text-sm text-white/80">
               Bluesky messages will be obtained from bluesky.service.ts by constructing a fresh TinyJetstream from the npm package "mbjc", listening for "n" messages, and then disposing the TinyJetstream.
             </p>
            {data && (
              <div className="mt-2 text-sm text-white/70">
                <span className="font-medium">{data.count}</span> messages fetched at {formatTimestamp(data.timestamp)}
              </div>
            )}
          </div>

          <div className="p-6">
            {data ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="backdrop-blur-xl bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/70">Total Messages:</span>
                      <span className="ml-2 font-medium text-white">{data.count}</span>
                    </div>
                    <div>
                      <span className="text-white/70">Fetched At:</span>
                      <span className="ml-2 font-medium text-white">{formatTimestamp(data.timestamp)}</span>
                    </div>
                    <div>
                      <span className="text-white/70">Response Time:</span>
                      <span className="ml-2 font-medium text-white">{Date.now() - data.timestamp}ms ago</span>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="backdrop-blur-xl bg-white/5 rounded-lg border border-white/10">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Messages</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {data.messages.length > 0 ? (
                      <div className="divide-y divide-white/10">
                        {data.messages.map((message, index) => (
                          <div key={index} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-blue-300">#{index + 1}</span>
                              <span className="text-xs text-white/50">{formatTimestamp(message.time)}</span>
                            </div>
                            <div className="text-sm text-white/90 mb-2">
                              <strong className="text-white/70">DID:</strong> {message.did}
                            </div>
                            <div className="text-sm text-white">
                              <strong className="text-white/70">Text:</strong> {message.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-white/70">
                        No messages available
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw JSON */}
                <div className="backdrop-blur-xl bg-white/5 rounded-lg border border-white/10">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Raw JSON Response</h3>
                  </div>
                  <div className="p-4">
                    <pre className="text-xs text-white/80 bg-black/20 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/70">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}