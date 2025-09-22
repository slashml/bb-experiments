'use client';

import { ExplorationStatus } from '../lib/types';

interface ExplorationViewerProps {
  status: ExplorationStatus;
}

export default function ExplorationViewer({ status }: ExplorationViewerProps) {
  if (status.status === 'idle') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Exploration Results</h2>

      {status.status === 'loading' && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Exploring page...</p>
          <p className="text-sm text-gray-500 mt-2">
            Taking screenshots while scrolling through the entire page
          </p>
          {status.currentStep && (
            <p className="text-sm text-blue-600 mt-2 font-medium">
              {status.currentStep}
            </p>
          )}
          {status.progress !== undefined && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(status.progress)}% complete</p>
            </div>
          )}
        </div>
      )}

      {status.status === 'complete' && status.result?.success && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">
                Exploration completed successfully!
              </p>
            </div>
            <div className="mt-2 text-sm text-green-700">
              <p><span className="font-medium">URL:</span> {status.result.url}</p>
              <p><span className="font-medium">Screenshots captured:</span> {status.result.screenshots.length}</p>
              <p><span className="font-medium">Total page height:</span> {status.result.totalScrollHeight}px</p>
              <p><span className="font-medium">Captured at:</span> {new Date(status.result.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Screenshots</h3>

            <div className="grid gap-6">
              {status.result.screenshots.map((screenshot, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {screenshot.description}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {screenshot.scrollPosition === -1
                            ? 'Full page overview'
                            : `Scroll position: ${screenshot.scrollPosition}px`
                          }
                        </p>
                      </div>
                      <a
                        href={screenshot.screenshotUrl}
                        download={`screenshot-${index + 1}-${new Date(screenshot.timestamp).toISOString().split('T')[0]}.png`}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                      >
                        <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <img
                      src={screenshot.screenshotUrl}
                      alt={screenshot.description}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              All screenshots are captured at 1920x1080 resolution and can be downloaded individually.
            </p>
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
            Exploration Failed
          </h3>
          <p className="text-gray-600 mb-4">
            {status.result.error || 'An unknown error occurred while exploring the page'}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-medium">URL:</span> {status.result.url}
          </p>
        </div>
      )}
    </div>
  );
}