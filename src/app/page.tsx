'use client';

import { useState, useEffect, useRef } from 'react';
import UrlInput from '../components/UrlInput';
import ScreenshotViewer from '../components/ScreenshotViewer';
import { ScreenshotStatus } from '../lib/types';

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<ScreenshotStatus>({
    status: 'idle'
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status.status === 'complete' || status.status === 'error') {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [status.status]);

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

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div ref={scrollContainerRef} className="h-full max-w-4xl mx-auto px-4 py-8 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SaaS Landing Page Screenshot Tool
          </h1>
          <p className="text-gray-600">
            Enter a SaaS product URL and capture a full-page screenshot of their landing page
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
            
            <div className="mt-6 text-center">
              <button
                onClick={captureScreenshot}
                disabled={!canStart}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Capturing Screenshot...' : 'Capture Screenshot'}
              </button>
              
              {!canStart && !processing && (
                <p className="text-sm text-gray-500 mt-2">
                  Please enter a valid URL to continue
                </p>
              )}
            </div>
          </div>

          {/* Screenshot Viewer Section */}
          <ScreenshotViewer status={status} />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 border-t pt-8">
          <p>
            Built with Next.js and Playwright for automated SaaS landing page screenshots.
          </p>
        </footer>
      </div>
    </div>
  );
}
