'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimpleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting simple Browserbase test...');

      const response = await fetch('/api/simple-browserbase-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://v1.slashml.com'
        }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setResult(data);
    } catch (err) {
      console.error('Test failed:', err);
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
            Simple Browserbase Live View Test
          </h1>

          <div className="mb-4">
            <p className="text-gray-600">
              This test will create a Browserbase session, navigate to v1.slashml.com,
              and get the proper live view URL using the Browserbase SDK.
            </p>
          </div>

          <button
            onClick={runSimpleTest}
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Running Test...' : 'Run Simple Test'}
          </button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-green-800">Test Results</h3>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
                  <p><strong>Session ID:</strong> {result.sessionId || 'Not found'}</p>
                  <p><strong>URL Visited:</strong> {result.url}</p>
                </div>
              </div>

              {result.liveViewUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800">🔴 Live View (Working!)</h3>
                  <div className="mt-2">
                    <a
                      href={result.liveViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {result.liveViewUrl}
                    </a>
                    <p className="text-xs text-blue-600 mt-1">
                      Click to open live view in new tab
                    </p>
                  </div>
                </div>
              )}

              {result.debugInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Debug Info</h3>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                    {JSON.stringify(result.debugInfo, null, 2)}
                  </pre>
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
                  Creating session and getting live view URL...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}