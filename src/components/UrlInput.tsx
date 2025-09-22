'use client';

import { useState } from 'react';

interface UrlInputProps {
  onUrlChange: (url: string) => void;
  disabled?: boolean;
}

export default function UrlInput({ onUrlChange, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
      setError('');
      return false;
    }

    try {
      const parsedUrl = new URL(urlString);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setError('URL must use HTTP or HTTPS protocol');
        return false;
      }
      setError('');
      return true;
    } catch {
      setError('Please enter a valid URL');
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    validateUrl(value);
    onUrlChange(value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && !pastedText.startsWith('http')) {
      const fullUrl = `https://${pastedText}`;
      setUrl(fullUrl);
      validateUrl(fullUrl);
      onUrlChange(fullUrl);
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
          SaaS Product URL
        </label>
        <input
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder="https://example.com"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Enter the URL of a SaaS product landing page to capture a full-page screenshot.</p>
        <p className="mt-1">
          <strong>Examples:</strong> https://slack.com, https://notion.so, https://stripe.com
        </p>
      </div>
    </div>
  );
}