'use client';

import React, { useState, useEffect } from 'react';

interface AdEntry {
  id: string;
  userId: string;
  name: string;
  bidPrice: number;
  promptContent: string;
}

const AdsPage: React.FC = () => {
  const [ads, setAds] = useState<AdEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAd, setNewAd] = useState({
    name: '',
    bidPrice: '',
    promptContent: ''
  });

  // Fetch ads from API
  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads');
      if (!response.ok) throw new Error('Failed to fetch ads');
      const data = await response.json();
      setAds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Create new ad
  const createAd = async () => {
    if (!newAd.name || !newAd.bidPrice || !newAd.promptContent) {
      setError('All fields are required');
      return;
    }

    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAd.name,
          bidPrice: newAd.bidPrice,
          promptContent: newAd.promptContent
        })
      });

      if (!response.ok) throw new Error('Failed to create ad');

      const createdAd = await response.json();
      setAds(prev => [...prev, createdAd]);
      setNewAd({ name: '', bidPrice: '', promptContent: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ad');
    }
  };

  // Update ad
  const updateAd = async (id: string, field: keyof AdEntry, value: string | number) => {
    try {
      const response = await fetch(`/api/ads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) throw new Error('Failed to update ad');

      const updatedAd = await response.json();
      setAds(prev => prev.map(ad => ad.id === id ? updatedAd : ad));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad');
    }
  };

  // Delete ad
  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const response = await fetch(`/api/ads/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete ad');

      setAds(prev => prev.filter(ad => ad.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ad');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-bounce" style={{animationDelay: '1s'}}></div>

        <div className="text-center relative z-10">
          <h1 className="text-4xl font-bold mb-8 text-white drop-shadow-lg">Ad Entries</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-8 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-bounce" style={{animationDelay: '1s'}}></div>

      <div className="container mx-auto relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-white drop-shadow-lg">Ad Entries</h1>

        {/* Informational Section */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
          {/* Sheen effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
          <h2 className="text-2xl font-semibold mb-6 text-white relative z-10">How Ads Work</h2>
          <div className="relative z-10 space-y-4">
            <p className="text-white/90 text-lg leading-relaxed">
              Each ad you create may be placed into a reporter's article generation prompt. This provides valuable exposure for your business by potentially influencing how your product is discussed in news articles.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              Benefits include increased positive exposure and the ability to shape consumers' understanding of your product through contextual mentions in relevant news content.
            </p>
            <p className="text-cyan-300 font-semibold text-lg">
              Contact us for pricing information and to get started with your ad campaign.
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
          {/* Sheen effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
          <h2 className="text-2xl font-semibold mb-6 text-white relative z-10">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-medium text-white mb-3">Fixed-Text Ad</h3>
              <p className="text-3xl font-bold text-cyan-300 mb-3">$5/mo</p>
              <p className="text-white/80 mb-4 leading-relaxed">
                One fixed-text advertisement that appears in relevant reporter prompts.
              </p>
              <ul className="text-white/70 text-sm space-y-2">
                <li>• Static content placement</li>
                <li>• Guaranteed exposure in targeted prompts</li>
                <li>• Basic performance tracking</li>
              </ul>
            </div>

            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-medium text-white mb-3">Contextually Aware Ad</h3>
              <p className="text-3xl font-bold text-cyan-300 mb-3">$20/mo</p>
              <p className="text-white/80 mb-4 leading-relaxed">
                One dynamically tuned advertisement that uses AI to adapt to its context for maximum impact.
              </p>
              <ul className="text-white/70 text-sm space-y-2">
                <li>• AI-powered content optimization</li>
                <li>• Contextual adaptation for relevance</li>
                <li>• Advanced analytics and reporting</li>
                <li>• Maximum engagement potential</li>
              </ul>
            </div>
          </div>
        </div>

      {error && (
        <div className="backdrop-blur-sm bg-red-500/20 border border-red-400/30 rounded-xl p-4 mb-6 relative z-10">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Create New Ad Form */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
        {/* Sheen effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
        <h2 className="text-2xl font-semibold mb-6 text-white relative z-10">Create New Ad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Name
            </label>
            <input
              type="text"
              value={newAd.name}
              onChange={(e) => setNewAd(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
              placeholder="Enter ad name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Bid Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newAd.bidPrice}
              onChange={(e) => setNewAd(prev => ({ ...prev, bidPrice: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={createAd}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 relative overflow-hidden group"
            >
              <span className="relative z-10">Create Ad</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>

        <div className="relative z-10">
          <label className="block text-sm font-medium text-white/90 mb-3">
            Prompt Content
          </label>
          <textarea
            value={newAd.promptContent}
            onChange={(e) => setNewAd(prev => ({ ...prev, promptContent: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm resize-vertical"
            placeholder="Enter prompt content here..."
          />
        </div>
      </div>

      {/* Existing Ads */}
      <div className="space-y-6">
        {ads.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden">
            {/* Sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
            <div className="relative z-10">
              <p className="text-white/70 text-lg">No ads found. Create your first ad above.</p>
            </div>
          </div>
        ) : (
          ads.map(ad => (
            <div key={ad.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
              {/* Sheen effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h3 className="text-xl font-medium text-white">Ad Entry</h3>
                <button
                  onClick={() => deleteAd(ad.id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-400 hover:to-red-500 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 relative overflow-hidden group"
                >
                  <span className="relative z-10">Delete</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Name
                  </label>
                  <input
                    type="text"
                    value={ad.name}
                    onChange={(e) => updateAd(ad.id, 'name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Bid Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ad.bidPrice}
                    onChange={(e) => updateAd(ad.id, 'bidPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    ID
                  </label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm backdrop-blur-sm">
                    {ad.id}
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <label className="block text-sm font-medium text-white/90 mb-3">
                  Prompt Content
                </label>
                <textarea
                  value={ad.promptContent}
                  onChange={(e) => updateAd(ad.id, 'promptContent', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm resize-vertical"
                  placeholder="Enter prompt content here..."
                />
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};

export default AdsPage;
