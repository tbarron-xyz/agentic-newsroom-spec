'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Reporter {
  id: string;
  beats: string[];
  prompt: string;
}

export default function ReportersPage() {
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReporter, setEditingReporter] = useState<Reporter | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReporter, setNewReporter] = useState({ beats: [] as string[], prompt: '' });

  // Fetch reporters on component mount
  useEffect(() => {
    fetchReporters();
  }, []);

  const fetchReporters = async () => {
    try {
      const response = await fetch('/api/reporters');
      if (response.ok) {
        const data = await response.json();
        setReporters(data);
      } else {
        setMessage('Failed to load reporters');
      }
    } catch (error) {
      setMessage('Error loading reporters');
      console.error('Error fetching reporters:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReporter = async (reporter: Reporter) => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`/api/reporters/${reporter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beats: reporter.beats,
          prompt: reporter.prompt
        }),
      });

      if (response.ok) {
        setMessage('Reporter updated successfully!');
        setEditingReporter(null);
        setTimeout(() => setMessage(''), 3000);
        fetchReporters(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to update reporter');
      }
    } catch (error) {
      setMessage('Error updating reporter');
      console.error('Error updating reporter:', error);
    } finally {
      setSaving(false);
    }
  };

  const createReporter = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reporters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReporter),
      });

      if (response.ok) {
        setMessage('Reporter created successfully!');
        setShowCreateForm(false);
        setNewReporter({ beats: [], prompt: '' });
        setTimeout(() => setMessage(''), 3000);
        fetchReporters(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to create reporter');
      }
    } catch (error) {
      setMessage('Error creating reporter');
      console.error('Error creating reporter:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteReporter = async (reporterId: string) => {
    if (!confirm('Are you sure you want to delete this reporter?')) {
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`/api/reporters/${reporterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Reporter deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
        fetchReporters(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to delete reporter');
      }
    } catch (error) {
      setMessage('Error deleting reporter');
      console.error('Error deleting reporter:', error);
    } finally {
      setSaving(false);
    }
  };

  const addBeat = (reporter: Reporter, beat: string) => {
    if (beat.trim() && !reporter.beats.includes(beat.trim())) {
      const updatedReporter = {
        ...reporter,
        beats: [...reporter.beats, beat.trim()]
      };
      setReporters(reporters.map(r => r.id === reporter.id ? updatedReporter : r));
      if (editingReporter?.id === reporter.id) {
        setEditingReporter(updatedReporter);
      }
    }
  };

  const removeBeat = (reporter: Reporter, beatToRemove: string) => {
    const updatedReporter = {
      ...reporter,
      beats: reporter.beats.filter(beat => beat !== beatToRemove)
    };
    setReporters(reporters.map(r => r.id === reporter.id ? updatedReporter : r));
    if (editingReporter?.id === reporter.id) {
      setEditingReporter(updatedReporter);
    }
  };

  const addNewBeat = (beat: string) => {
    if (beat.trim() && !newReporter.beats.includes(beat.trim())) {
      setNewReporter({
        ...newReporter,
        beats: [...newReporter.beats, beat.trim()]
      });
    }
  };

  const removeNewBeat = (beatToRemove: string) => {
    setNewReporter({
      ...newReporter,
      beats: newReporter.beats.filter(beat => beat !== beatToRemove)
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Reporter Management
            </h1>
            <p className="text-slate-600 text-lg">
              Manage reporters, their beats, and writing prompts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              ← Back to Editor
            </Link>
          </div>
        </div>

        {/* Create New Reporter Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{showCreateForm ? 'Cancel' : 'Create New Reporter'}</span>
          </button>
        </div>

        {/* Create Reporter Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 space-y-6">
            <h2 className="text-2xl font-semibold text-slate-800">Create New Reporter</h2>

            {/* Beats Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Beats</h3>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {newReporter.beats.map((beat, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {beat}
                      <button
                        onClick={() => removeNewBeat(beat)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a beat (e.g., Technology, Politics)"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNewBeat((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addNewBeat(input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Writing Prompt</h3>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <textarea
                  value={newReporter.prompt}
                  onChange={(e) => setNewReporter({ ...newReporter, prompt: e.target.value })}
                  placeholder="Enter the reporter's writing guidelines and prompt..."
                  className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-400"
                  rows={4}
                />
              <p className="text-sm text-slate-500 mt-2">
                Define the reporter's writing guidelines and prompt.
              </p>
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-end">
              <button
                onClick={createReporter}
                disabled={saving}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Create Reporter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="mb-6 px-6 py-4 rounded-lg text-center font-medium ${
            message.includes('successfully')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }">
            {message}
          </div>
        )}

        {/* Reporters List */}
        <div className="space-y-6">
          {reporters.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Reporters Found</h3>
              <p className="text-slate-600">Create your first reporter to get started.</p>
            </div>
          ) : (
            reporters.map((reporter) => (
              <div key={reporter.id} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">
                        Reporter {reporter.id.split('_')[2] || reporter.id}
                      </h3>
                      <p className="text-slate-600">{reporter.beats.length} beat{reporter.beats.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/articles?reporterId=${reporter.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>View Articles</span>
                    </Link>
                    <button
                      onClick={() => setEditingReporter(editingReporter?.id === reporter.id ? null : reporter)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingReporter?.id === reporter.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      onClick={() => deleteReporter(reporter.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Beats Display */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">Beats</h4>
                  <div className="flex flex-wrap gap-2">
                    {reporter.beats.map((beat, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {beat}
                        {editingReporter?.id === reporter.id && (
                          <button
                            onClick={() => removeBeat(reporter, beat)}
                            className="ml-2 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {reporter.beats.length === 0 && (
                      <span className="text-slate-500 italic">No beats assigned</span>
                    )}
                  </div>
                </div>

                {/* Prompt Display */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">Writing Prompt</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    {reporter.prompt ? (
                      <p className="text-slate-700 whitespace-pre-wrap">{reporter.prompt}</p>
                    ) : (
                      <p className="text-slate-500 italic">No prompt set</p>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {editingReporter?.id === reporter.id && (
                  <div className="border-t border-slate-200 pt-6 space-y-6">
                    <h4 className="text-lg font-semibold text-slate-800">Edit Reporter</h4>

                    {/* Add Beat Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Add Beat</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Add a new beat"
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addBeat(reporter, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addBeat(reporter, input.value);
                            input.value = '';
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Edit Prompt */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Writing Prompt</label>
                      <textarea
                        value={editingReporter.prompt}
                        onChange={(e) => setEditingReporter({ ...editingReporter, prompt: e.target.value })}
                        className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingReporter(null)}
                        className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveReporter(editingReporter)}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500">
          <p>AI Newsroom Reporter Management Panel</p>
        </div>
      </div>
    </div>
  );
}
