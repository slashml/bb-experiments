'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlatformConfig } from '../../../lib/schemas';

interface PlatformSelectorProps {
  platforms: PlatformConfig[];
  onSelectPlatform: (platform: PlatformConfig) => void;
  isGenerating: boolean;
}

export default function PlatformSelector({ platforms, onSelectPlatform, isGenerating }: PlatformSelectorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSelect = (platform: PlatformConfig) => {
    if (isGenerating) return;
    setSelectedPlatform(platform);
    setUseCustomUrl(false);
  };

  const handleCustomUrlSubmit = () => {
    if (isGenerating) return;

    setUrlError('');

    if (!customUrl.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    let finalUrl = customUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (!validateUrl(finalUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    const customPlatform: PlatformConfig = {
      id: 'custom',
      name: new URL(finalUrl).hostname.replace('www.', ''),
      url: finalUrl,
      description: 'Custom platform provided by user',
      complexity: 'Medium',
      estimatedTime: '5-10 min'
    };

    setSelectedPlatform(customPlatform);
    setUseCustomUrl(true);
    setTimeout(() => onSelectPlatform(customPlatform), 300);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplexityEmoji = (complexity: string) => {
    switch (complexity) {
      case 'Low': return '🟢';
      case 'Medium': return '🟡';
      case 'High': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Custom URL Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border-2 border-purple-200 p-6 mb-8"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          🌐 Enter Your Own URL
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomUrlSubmit()}
              placeholder="https://example.com or example.com"
              className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                urlError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-purple-500'
              } focus:outline-none`}
              disabled={isGenerating}
            />
            {urlError && (
              <p className="text-red-600 text-sm mt-2">⚠️ {urlError}</p>
            )}
          </div>
          <button
            onClick={handleCustomUrlSubmit}
            disabled={isGenerating || !customUrl.trim()}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              customUrl.trim() && !isGenerating
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? '🔄' : '🚀 Analyze'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Enter any website URL - the AI will explore and document its features
        </p>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedPlatform ? 1 : 0.5 }}
        className="text-center"
      >
        <button
          onClick={() => selectedPlatform && onSelectPlatform(selectedPlatform)}
          disabled={!selectedPlatform || isGenerating}
          className={`px-8 py-4 rounded-lg font-bold text-white text-lg transition-all transform ${
            selectedPlatform && !isGenerating
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:scale-105'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting AI Documentation...
            </span>
          ) : selectedPlatform ? (
            `🚀 Generate ${selectedPlatform.name} Documentation`
          ) : (
            '👆 Select a Platform First'
          )}
        </button>

        {selectedPlatform && !isGenerating && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-gray-600 mt-3"
          >
            Estimated time: {selectedPlatform.estimatedTime} • Complexity: {selectedPlatform.complexity}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}