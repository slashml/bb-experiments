'use client';

import { ScreenshotStatus } from '../lib/types';

interface ScreenshotViewerProps {
  status: ScreenshotStatus;
}

export default function ScreenshotViewer({ status }: ScreenshotViewerProps) {
  if (status.status === 'idle') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Screenshot Results</h2>
      
      {status.status === 'loading' && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Capturing screenshot...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments as we load the page and capture a full screenshot
          </p>
        </div>
      )}


      {status.status === 'complete' && status.result?.success && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">URL:</span> {status.result.url}
            </p>
            <p className="text-sm text-gray-500">
              Captured at {new Date(status.result.timestamp).toLocaleString()}
            </p>
          </div>
          
          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <img
              src={status.result.screenshotUrl}
              alt={`Screenshot of ${status.result.url}`}
              className="w-full h-auto max-w-full"
            />
          </div>
          
          <div className="flex justify-center">
            <a
              href={status.result.screenshotUrl}
              download={`screenshot-${new Date(status.result.timestamp).toISOString().split('T')[0]}.png`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Screenshot
            </a>
          </div>
        </div>
      )}

      {status.status === 'error' && status.result && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.766 0L3.048 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Screenshot Failed
          </h3>
          <p className="text-gray-600 mb-4">
            {status.result.error || 'An unknown error occurred while capturing the screenshot'}
          </p>
          {status.result.error?.includes('billing') && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>💡 Billing Issue:</strong> This appears to be a Browserbase billing limit. 
                Please check your <a href="https://browserbase.com" target="_blank" rel="noopener noreferrer" className="underline">Browserbase dashboard</a> 
                to verify your account status and billing.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            <span className="font-medium">URL:</span> {status.result.url}
          </p>
        </div>
      )}
    </div>
  );
}