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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Ad Entries</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Ad Entries</h1>

        {/* Informational Section */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">How Ads Work</h2>
          <p className="text-blue-800 mb-4">
            Each ad you create may be placed into a reporter's article generation prompt. This provides valuable exposure for your business by potentially influencing how your product is discussed in news articles.
          </p>
          <p className="text-blue-800 mb-4">
            Benefits include increased positive exposure and the ability to shape consumers' understanding of your product through contextual mentions in relevant news content.
          </p>
          <p className="text-blue-800">
            <strong>Contact us for pricing information and to get started with your ad campaign.</strong>
          </p>
        </div>

        {/* Pricing Section */}
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-900">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-green-200 rounded-lg">
              <h3 className="text-lg font-medium text-green-900 mb-2">Fixed-Text Ad</h3>
              <p className="text-2xl font-bold text-green-600 mb-2">$5/mo</p>
              <p className="text-green-800 mb-4">
                One fixed-text advertisement that appears in relevant reporter prompts.
              </p>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Static content placement</li>
                <li>• Guaranteed exposure in targeted prompts</li>
                <li>• Basic performance tracking</li>
              </ul>
            </div>

            <div className="p-4 bg-white border border-green-200 rounded-lg">
              <h3 className="text-lg font-medium text-green-900 mb-2">AI-Tuned Ad</h3>
              <p className="text-2xl font-bold text-green-600 mb-2">$20/mo</p>
              <p className="text-green-800 mb-4">
                One dynamically tuned advertisement that uses AI to adapt to its context for maximum impact.
              </p>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• AI-powered content optimization</li>
                <li>• Contextual adaptation for relevance</li>
                <li>• Advanced analytics and reporting</li>
                <li>• Maximum engagement potential</li>
              </ul>
            </div>
          </div>
        </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Create New Ad Form */}
      <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Ad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={newAd.name}
              onChange={(e) => setNewAd(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
              placeholder="Enter ad name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bid Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newAd.bidPrice}
              onChange={(e) => setNewAd(prev => ({ ...prev, bidPrice: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={createAd}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Ad
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Content
          </label>
          <textarea
            value={newAd.promptContent}
            onChange={(e) => setNewAd(prev => ({ ...prev, promptContent: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical text-slate-800 placeholder-slate-400"
            placeholder="Enter prompt content here..."
          />
        </div>
      </div>

      {/* Existing Ads */}
      <div className="space-y-6">
        {ads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No ads found. Create your first ad above.</p>
          </div>
        ) : (
          ads.map(ad => (
            <div key={ad.id} className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Ad Entry</h3>
                <button
                  onClick={() => deleteAd(ad.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={ad.name}
                    onChange={(e) => updateAd(ad.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bid Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ad.bidPrice}
                    onChange={(e) => updateAd(ad.id, 'bidPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID
                  </label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 text-sm">
                    {ad.id}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Content
                </label>
                <textarea
                  value={ad.promptContent}
                  onChange={(e) => updateAd(ad.id, 'promptContent', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical text-slate-800 placeholder-slate-400"
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
