'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { useEffect } from 'react';
import { CompleteDocumentation, SessionProgress } from '../../../lib/schemas';

interface DocumentationViewerProps {
  documentation: CompleteDocumentation;
  sessionProgress: SessionProgress | null;
  onReset: () => void;
}

export default function DocumentationViewer({
  documentation,
  sessionProgress,
  onReset
}: DocumentationViewerProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Generate QR code for sharing
    const shareUrl = `${window.location.origin}/docs/${documentation.sessionId}`;
    QRCode.toDataURL(shareUrl, { width: 200, margin: 1 }).then(setQrCodeUrl);
  }, [documentation.sessionId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const downloadDocumentation = () => {
    const content = `# ${documentation.platformName} Documentation
Generated on: ${new Date(documentation.generatedAt).toLocaleString()}
Session ID: ${documentation.sessionId}

${documentation.sections.map(section => `
## ${section.title}

${section.content}

${section.actionItems?.length ? `### Action Items:
${section.actionItems.map(item => `- ${item}`).join('\n')}` : ''}

---
`).join('\n')}

## Summary

**Key Insights:**
${documentation.summary.keyInsights.map(insight => `- ${insight}`).join('\n')}

**Recommended Next Steps:**
${documentation.summary.recommendedNextSteps.map(step => `- ${step}`).join('\n')}

**Screenshots:** ${documentation.summary.totalScreenshots} captured

Generated with AI using Stagehand + Browserbase
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentation.platformName.toLowerCase()}-docs.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Documentation Generated Successfully!
        </h2>
        <p className="text-gray-600">
          AI has analyzed {documentation.platformName} and generated comprehensive documentation
        </p>
        <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-500">
          <span>📄 {documentation.sections.length} sections</span>
          <span>📸 {documentation.summary.totalScreenshots} screenshots</span>
          <span>🕒 Generated {new Date(documentation.generatedAt).toLocaleTimeString()}</span>
        </div>
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={downloadDocumentation}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              📥 Download Markdown
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔗 Share
            </button>
            {sessionProgress?.replayUrl && (
              <a
                href={sessionProgress.replayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🎬 Session Replay
              </a>
            )}
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Generate Another
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Contents</h3>
            <nav className="space-y-2">
              {documentation.sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSection(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === index
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {section.title}
                </button>
              ))}
              <hr className="my-3" />
              <button
                onClick={() => setActiveSection(documentation.sections.length)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === documentation.sections.length
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Summary & Next Steps
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <AnimatePresence mode="wait">
              {activeSection < documentation.sections.length ? (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      {documentation.sections[activeSection].title}
                    </h1>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                      {documentation.sections[activeSection].content}
                    </div>
                  </div>

                  {/* Screenshots for this section */}
                  {documentation.sections[activeSection].screenshots.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Screenshots</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documentation.sections[activeSection].screenshots.map((screenshot, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={screenshot}
                              alt={`${documentation.sections[activeSection].title} screenshot ${idx + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(screenshot, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {documentation.sections[activeSection].actionItems &&
                   documentation.sections[activeSection].actionItems!.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h3>
                      <ul className="space-y-2">
                        {documentation.sections[activeSection].actionItems!.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Summary Section */
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Summary & Next Steps</h1>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Key Insights</h3>
                      <ul className="space-y-2">
                        {documentation.summary.keyInsights.map((insight, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-700">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Recommended Next Steps</h3>
                      <ul className="space-y-2">
                        {documentation.summary.recommendedNextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-500 mr-2">→</span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Documentation Stats</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {documentation.sections.length}
                          </div>
                          <div className="text-sm text-gray-600">Sections</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {documentation.summary.totalScreenshots}
                          </div>
                          <div className="text-sm text-gray-600">Screenshots</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {Math.floor(documentation.sections.reduce((total, section) =>
                              total + section.content.length, 0) / 100) / 10}k
                          </div>
                          <div className="text-sm text-gray-600">Characters</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-pink-600">100%</div>
                          <div className="text-sm text-gray-600">AI Generated</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                {activeSection + 1} of {documentation.sections.length + 1}
              </span>
              <button
                onClick={() => setActiveSection(Math.min(documentation.sections.length, activeSection + 1))}
                disabled={activeSection === documentation.sections.length}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Documentation</h3>

              {qrCodeUrl && (
                <div className="text-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Scan to view on mobile</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Share URL
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`${window.location.origin}/docs/${documentation.sessionId}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/docs/${documentation.sessionId}`)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}