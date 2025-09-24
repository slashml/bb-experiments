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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Choose a SaaS Platform to Document
        </h2>
        <p className="text-gray-600">
          Select a platform and watch AI automatically generate comprehensive documentation
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
              selectedPlatform?.name === platform.name
                ? 'border-purple-500 bg-purple-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedPlatform(platform)}
            onMouseEnter={() => setIsHovering(platform.name)}
            onMouseLeave={() => setIsHovering(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Complexity indicator */}
            <div className="absolute top-3 right-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(platform.complexity)}`}>
                {getComplexityEmoji(platform.complexity)} {platform.complexity}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {platform.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {platform.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>⏱️ {platform.estimatedTime}</span>
                <span>{platform.url.replace('https://', '').replace('www.', '')}</span>
              </div>
            </div>

            {platform.specialFeatures && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Key Features:</p>
                <div className="flex flex-wrap gap-1">
                  {platform.specialFeatures.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {platform.specialFeatures.length > 3 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{platform.specialFeatures.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovering === platform.name ? 1 : 0 }}
              className="absolute inset-0 bg-purple-500 bg-opacity-5 rounded-xl pointer-events-none"
            />
          </motion.div>
        ))}
      </div>

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