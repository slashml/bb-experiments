'use client';

import { useState, useEffect, useRef } from 'react';
import UrlInput from '../components/UrlInput';
import ScreenshotViewer from '../components/ScreenshotViewer';
import ExplorationViewer from '../components/ExplorationViewer';
import { ScreenshotStatus, ExplorationStatus } from '../lib/types';

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'screenshot' | 'explore'>('explore');
  const [status, setStatus] = useState<ScreenshotStatus>({
    status: 'idle'
  });
  const [explorationStatus, setExplorationStatus] = useState<ExplorationStatus>({
    status: 'idle'
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status.status === 'complete' || status.status === 'error' ||
        explorationStatus.status === 'complete' || explorationStatus.status === 'error') {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [status.status, explorationStatus.status]);

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const canStart = url.trim().length > 0 && isValidUrl(url) && !processing;

  const captureScreenshot = async () => {
    if (!canStart) return;

    setProcessing(true);
    setStatus({ status: 'loading' });
    setExplorationStatus({ status: 'idle' }); // Reset exploration status

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          status: 'complete',
          result: result.screenshot
        });
      } else {
        setStatus({
          status: 'error',
          result: {
            url,
            screenshotUrl: '',
            timestamp: new Date().toISOString(),
            success: false,
            error: result.error || 'Failed to capture screenshot'
          }
        });
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      setStatus({
        status: 'error',
        result: {
          url,
          screenshotUrl: '',
          timestamp: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  const explorePage = async () => {
    if (!canStart) return;

    setProcessing(true);
    setExplorationStatus({ status: 'loading', currentStep: 'Initializing browser...' });
    setStatus({ status: 'idle' }); // Reset screenshot status

    try {
      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success) {
        setExplorationStatus({
          status: 'complete',
          result: result.exploration
        });
      } else {
        setExplorationStatus({
          status: 'error',
          result: {
            url,
            screenshots: [],
            timestamp: new Date().toISOString(),
            success: false,
            error: result.error || 'Failed to explore page'
          }
        });
      }
    } catch (error) {
      console.error('Failed to explore page:', error);
      setExplorationStatus({
        status: 'error',
        result: {
          url,
          screenshots: [],
          timestamp: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div ref={scrollContainerRef} className="h-full max-w-4xl mx-auto px-4 py-8 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SaaS Landing Page Explorer
          </h1>
          <p className="text-gray-600">
            Enter a SaaS product URL and either capture a single screenshot or explore the entire page autonomously
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <UrlInput
              onUrlChange={setUrl}
              disabled={processing}
            />

            {/* Mode Selection */}
            <div className="mt-6">
              <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('explore')}
                  disabled={processing}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'explore'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } disabled:cursor-not-allowed`}
                >
                  🔍 Autonomous Exploration
                </button>
                <button
                  onClick={() => setMode('screenshot')}
                  disabled={processing}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'screenshot'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } disabled:cursor-not-allowed`}
                >
                  📸 Single Screenshot
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              {mode === 'explore' ? (
                <div>
                  <button
                    onClick={explorePage}
                    disabled={!canStart}
                    className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? 'Exploring Page...' : '🚀 Explore Page Autonomously'}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Automatically scroll through the page and capture multiple screenshots
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    onClick={captureScreenshot}
                    disabled={!canStart}
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? 'Capturing Screenshot...' : '📸 Capture Single Screenshot'}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Take a single full-page screenshot
                  </p>
                </div>
              )}

              {!canStart && !processing && (
                <p className="text-sm text-gray-500 mt-3">
                  Please enter a valid URL to continue
                </p>
              )}
            </div>
          </div>

          {/* Results Section */}
          <ScreenshotViewer status={status} />
          <ExplorationViewer status={explorationStatus} />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 border-t pt-8">
          <p>
            Built with Next.js and Playwright for automated SaaS landing page exploration and screenshots.
          </p>
        </footer>
      </div>
    </div>
  );
}
