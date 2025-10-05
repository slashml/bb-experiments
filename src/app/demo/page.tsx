'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_PLATFORMS } from '../../lib/platforms';
import { PlatformConfig, SessionProgress } from '../../lib/schemas';
import PlatformSelector from './components/PlatformSelector';
import LiveProgress from './components/LiveProgress';
import DocumentationViewer from './components/DocumentationViewer';

export default function DemoPage() {
  const searchParams = useSearchParams();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState<any>(null);

  const startDocumentation = useCallback(async (platform: PlatformConfig) => {
    setSelectedPlatform(platform);
    setIsGenerating(true);
    setSessionProgress(null);
    setDocumentation(null);

    try {
      const response = await fetch('/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: platform.name,
          platformUrl: platform.url
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to start documentation generation: ${response.statusText}`);
      }

      const { sessionId } = await response.json();

      // Start listening to progress updates
      const eventSource = new EventSource(`/api/task-progress?sessionId=${sessionId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle keepalive messages
          if (data.type === 'keepalive') {
            console.log(`[Demo] Keepalive for session: ${data.sessionId}`);
            return;
          }

          // Handle progress updates
          const progress: SessionProgress = data;
          setSessionProgress(progress);

          if (progress.status === 'completed' && progress.overallProgress === 100) {
            console.log('[Demo] Documentation generation completed');
            eventSource.close();
            setIsGenerating(false);
            fetchDocumentation(sessionId);
          } else if (progress.status === 'failed') {
            console.log('[Demo] Documentation generation failed');
            eventSource.close();
            setIsGenerating(false);
            // Show error to user but don't throw console.error in browser
            setSessionProgress(prev => prev ? { ...prev, status: 'failed' } : null);
          }
        } catch (parseError) {
          console.warn('[Demo] Failed to parse SSE message:', event.data, parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.warn('[Demo] EventSource connection error, retrying...', error);
        eventSource.close();

        // Don't immediately fail, give it a moment then check status
        setTimeout(() => {
          checkSessionStatus(sessionId);
        }, 2000);
      };

    } catch (error) {
      console.error('Error starting documentation generation:', error);
      setIsGenerating(false);
    }
  }, []);

  const fetchDocumentation = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/documentation/${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        setDocumentation(result.documentation);
      }
    } catch (error) {
      console.error('Error fetching documentation:', error);
    }
  };

  const checkSessionStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/generate-docs?sessionId=${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.session) {
          setSessionProgress(result.session);

          if (result.session.status === 'completed') {
            setIsGenerating(false);
            if (result.documentation) {
              setDocumentation(result.documentation);
            } else {
              fetchDocumentation(sessionId);
            }
          } else if (result.session.status === 'failed') {
            setIsGenerating(false);
          }
        }
      }
    } catch (error) {
      console.warn('Error checking session status:', error);
      setIsGenerating(false);
    }
  };

  const resetDemo = () => {
    setSelectedPlatform(null);
    setSessionProgress(null);
    setIsGenerating(false);
    setDocumentation(null);
  };

  // Check for URL parameter on component mount
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      // Extract domain name for platform name
      try {
        const urlObj = new URL(urlParam);
        const domain = urlObj.hostname.replace('www.', '');
        const platformName = domain.split('.')[0] || domain;

        const customPlatform: PlatformConfig = {
          name: platformName.charAt(0).toUpperCase() + platformName.slice(1),
          url: urlParam,
          description: `Custom platform analysis for ${domain}`,
          complexity: "Medium",
          estimatedTime: "3-5 minutes"
        };

        // Automatically start documentation generation
        startDocumentation(customPlatform);
      } catch (error) {
        console.error('Invalid URL provided:', error);
      }
    }
  }, [searchParams, startDocumentation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🤖 SaaS Docs Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered documentation generator for any website using Browserbase + Stagehand
          </p>
          <p className="text-sm text-purple-600 mt-2 font-semibold">
            Live Demo for AI Tinkerers Montreal
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedPlatform && !isGenerating && !documentation && (
            <motion.div
              key="platform-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <PlatformSelector
                platforms={DEMO_PLATFORMS}
                onSelectPlatform={startDocumentation}
                isGenerating={isGenerating}
              />
            </motion.div>
          )}

          {(isGenerating || sessionProgress) && (
            <motion.div
              key="live-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LiveProgress
                platform={selectedPlatform!}
                progress={sessionProgress}
                onReset={resetDemo}
              />
            </motion.div>
          )}

          {documentation && (
            <motion.div
              key="documentation-viewer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DocumentationViewer
                documentation={documentation}
                sessionProgress={sessionProgress}
                onReset={resetDemo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 text-center text-sm text-gray-500 border-t pt-8"
        >
          <p>
            Built with Next.js, Stagehand AI, and Browserbase • {new Date().getFullYear()} AI Tinkerers Montreal
          </p>
        </motion.footer>
      </div>
    </div>
  );
}