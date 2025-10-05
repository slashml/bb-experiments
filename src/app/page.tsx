'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const router = useRouter();

  const handleUrlChange = (value: string) => {
    setUrl(value);

    // Basic URL validation
    try {
      new URL(value);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(value.length === 0); // Allow empty for no error styling
    }
  };

  const handleAnalyze = () => {
    if (isValidUrl && url) {
      // Navigate to demo page with the URL as a query parameter
      router.push(`/demo?url=${encodeURIComponent(url)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidUrl && url) {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6"
          >
            <span className="text-4xl">🚀</span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            SaaS Docs Generator
          </h1>

          <p className="text-xl text-gray-600 mb-12">
            AI-powered documentation generator using Browserbase + Stagehand
          </p>

          {/* URL Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter website URL (e.g., https://example.com)"
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                  url && !isValidUrl
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-purple-200 focus:border-purple-500 focus:ring-purple-100'
                }`}
              />
              {url && !isValidUrl && (
                <p className="text-red-500 text-sm mt-2 text-left">
                  Please enter a valid URL starting with http:// or https://
                </p>
              )}
            </div>

            <motion.button
              onClick={handleAnalyze}
              disabled={!isValidUrl || !url}
              whileHover={isValidUrl && url ? { scale: 1.05 } : {}}
              whileTap={isValidUrl && url ? { scale: 0.95 } : {}}
              className={`w-full px-8 py-4 font-bold text-lg rounded-xl shadow-lg transition-all ${
                isValidUrl && url
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {url && isValidUrl ? '🔍 Analyze Website' : '🔍 Analyze'}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}