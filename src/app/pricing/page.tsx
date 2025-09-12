'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  hasReader: boolean;
  hasReporter: boolean;
  hasEditor: boolean;
}

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
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
      setLoading(false);
    }
  };

  const getButtonLink = () => {
    return user ? '/account' : '/login';
  };

  const getButtonText = (baseText: string) => {
    return user ? baseText : `Login to ${baseText.toLowerCase()}`;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-bounce" style={{animationDelay: '1s'}}></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Access AI-powered news generation with flexible pricing tiers designed for every level of content creation.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Free Tier */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative">
            {/* Sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
            <div className="text-center mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-white mb-2">$0</div>
              <div className="text-white/80">per month</div>
            </div>

            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Read last 3 daily editions</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-white/60 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/70">Limited archive access</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-white/60 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/70">No AI reporters</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-white/60 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/70">No editing tools</span>
              </li>
            </ul>

            <Link href={getButtonLink()}>
              <button className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-slate-400 hover:to-slate-500 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg hover:shadow-slate-500/25 relative overflow-hidden group">
                <span className="relative z-10">{getButtonText('Get Started Free')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </Link>
          </div>

          {/* Reader Tier */}
          <div className="backdrop-blur-xl bg-white/10 border border-cyan-400/50 rounded-3xl shadow-2xl p-8 relative">
            {/* Sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -skew-x-12 animate-pulse"></div>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                Most Popular
              </span>
            </div>

            <div className="text-center mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Reader</h3>
              <div className="text-4xl font-bold text-white mb-2">$9.99</div>
              <div className="text-white/80">per month</div>
            </div>

            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Full archive access</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Hourly editions</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Additional articles</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-white/60 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/70">No AI reporters</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-white/60 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/70">No editing tools</span>
              </li>
            </ul>

            <Link href={getButtonLink()}>
              <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 relative overflow-hidden group">
                <span className="relative z-10">{getButtonText('Start Reading')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </Link>
          </div>

          {/* Reporter Tier */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative">
            {/* Sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
            <div className="text-center mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Reporter</h3>
              <div className="text-4xl font-bold text-white mb-2">$29.99</div>
              <div className="text-white/80">per month</div>
            </div>

            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Everything in Reader</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">1 Customizable AI Reporter</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">1 Article per hour</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-white/60 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/70">Limited reporters</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-white/60 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/70">No editing tools</span>
              </li>
            </ul>

            <Link href={getButtonLink()}>
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-400 hover:to-pink-500 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 relative overflow-hidden group">
                <span className="relative z-10">{getButtonText('Start Reporting')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </Link>
          </div>

          {/* Editor Tier */}
          <div className="backdrop-blur-xl bg-white/10 border border-yellow-400/50 rounded-3xl shadow-2xl p-8 relative">
            {/* Sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -skew-x-12 animate-pulse"></div>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
              <span className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                Premium
              </span>
            </div>

            <div className="text-center mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Editor</h3>
              <div className="text-4xl font-bold text-white mb-2">$99.99</div>
              <div className="text-white/80">per month</div>
            </div>

            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Everything in Reporter</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Unlimited AI Reporters</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">1 AI Editor</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Compile full publications</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">Advanced editing tools</span>
              </li>
            </ul>

            <Link href={getButtonLink()}>
              <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-500 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 relative overflow-hidden group">
                <span className="relative z-10">{getButtonText('Start Editing')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 mb-16 relative overflow-hidden">
          {/* Sheen effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
          <h2 className="text-3xl font-bold text-white text-center mb-8 relative z-10">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Can I change plans anytime?
              </h3>
              <p className="text-white/80">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                What happens to my content when I cancel?
              </h3>
              <p className="text-white/80">
                Your generated content remains accessible for 30 days after cancellation, giving you time to export any important articles.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                How does the AI reporter work?
              </h3>
              <p className="text-white/80">
                Our AI reporters can be customized with specific topics, writing styles, and research parameters to generate articles automatically.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                How are articles sourced?
              </h3>
              <p className="text-white/80">
                Every article cites the specific social media messages that the reporter used as sources in its writing.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/60 relative z-10">
          <p>All plans include our standard terms of service and privacy policy.</p>
        </div>
      </div>
    </div>
  );
}
