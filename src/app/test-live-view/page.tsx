'use client';

import { useState } from 'react';

interface ExplorationResult {
  url: string;
  screenshots: Array<{
    url: string;
    screenshotUrl: string;
    timestamp: string;
    success: boolean;
    scrollPosition: number;
    description: string;
  }>;
  timestamp: string;
  success: boolean;
  signInDetected: boolean;
  authenticationCompleted: boolean;
  postAuthScreenshots: Array<any>;
  liveViewUrl?: string;
}

interface ApiResponse {
  success: boolean;
  exploration?: ExplorationResult;
  method: string;
  error?: string;
}

export default function TestLiveViewPage() {
  const [url, setUrl] = useState('https://v1.slashml.com');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExplore = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting exploration for:', url);

      const response = await fetch('/api/stagehand-explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data: ApiResponse = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setResult(data);
    } catch (err) {
      console.error('Exploration failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test Live View - Stagehand Explorer
          </h1>

          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                URL to explore
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <button
              onClick={handleExplore}
              disabled={isLoading || !url}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Exploring...' : 'Start Exploration'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-green-800">Exploration Results</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>URL:</strong> {result.exploration?.url}</p>
                  <p><strong>Method:</strong> {result.method}</p>
                  <p><strong>Success:</strong> {result.exploration?.success ? 'Yes' : 'No'}</p>
                  <p><strong>Screenshots taken:</strong> {result.exploration?.screenshots.length || 0}</p>
                  <p><strong>Sign-in detected:</strong> {result.exploration?.signInDetected ? 'Yes' : 'No'}</p>
                  <p><strong>Authentication completed:</strong> {result.exploration?.authenticationCompleted ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {result.exploration?.liveViewUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800">Live View</h3>
                  <div className="mt-2">
                    <a
                      href={result.exploration.liveViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {result.exploration.liveViewUrl}
                    </a>
                  </div>
                </div>
              )}

              {result.exploration?.screenshots && result.exploration.screenshots.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-4">Screenshots</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.exploration.screenshots.map((screenshot, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-white">
                        <p className="text-xs text-gray-600 mb-2">{screenshot.description}</p>
                        <img
                          src={screenshot.screenshotUrl}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-auto border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Scroll position: {screenshot.scrollPosition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Raw Response</h3>
                <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-sm text-blue-700">
                  Exploring website... This may take a few moments.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}