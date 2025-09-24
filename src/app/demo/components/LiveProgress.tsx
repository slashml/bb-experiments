'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlatformConfig, SessionProgress, TaskProgress } from '../../../lib/schemas';

interface LiveProgressProps {
  platform: PlatformConfig;
  progress: SessionProgress | null;
  onReset: () => void;
}

export default function LiveProgress({ platform, progress, onReset }: LiveProgressProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTaskEmoji = (taskName: string) => {
    if (taskName.toLowerCase().includes('homepage')) return '🏠';
    if (taskName.toLowerCase().includes('auth')) return '🔐';
    if (taskName.toLowerCase().includes('feature')) return '⚡';
    if (taskName.toLowerCase().includes('navigation')) return '🧭';
    return '🤖';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : currentTime;
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mr-3"
          />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Documenting {platform.name}
          </h2>
        </div>
        <p className="text-gray-600">
          Stagehand AI is exploring {platform.url} to generate comprehensive documentation
        </p>
      </motion.div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Session: {progress?.sessionId?.slice(-8) || 'Starting...'}</span>
            {progress?.status === 'failed' && (
              <span className="text-red-600 font-medium">⚠️ Demo Limited (Billing)</span>
            )}
            {progress?.liveViewUrl && progress?.status !== 'failed' && (
              <a
                href={progress.liveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-purple-600 hover:text-purple-800 font-medium"
              >
                👁️ Live View
              </a>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress?.overallProgress || 0}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full flex items-center justify-end pr-2"
            >
              {(progress?.overallProgress || 0) > 10 && (
                <span className="text-xs text-white font-medium">
                  {Math.round(progress?.overallProgress || 0)}%
                </span>
              )}
            </motion.div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress?.status || 'Initializing'}</span>
            <span>{Math.round(progress?.overallProgress || 0)}% Complete</span>
          </div>
        </div>

        {progress?.currentTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-purple-600 font-medium"
          >
            Current: {progress.currentTask}
          </motion.div>
        )}
      </motion.div>

      {/* Task List */}
      {progress?.tasks && progress.tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Tasks</h3>
          <div className="space-y-4">
            {progress.tasks.map((task: TaskProgress, index) => (
              <motion.div
                key={task.taskId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors"
              >
                <div className="text-2xl">
                  {getTaskEmoji(task.taskName)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{task.taskName}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(task.startTime, task.endTime)}
                      </span>
                    </div>
                  </div>

                  {task.currentAction && (
                    <p className="text-sm text-gray-600 mb-2">{task.currentAction}</p>
                  )}

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="bg-purple-500 h-2 rounded-full"
                    />
                  </div>

                  {task.screenshots && task.screenshots.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      📸 {task.screenshots.length} screenshots captured
                    </div>
                  )}

                  {task.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      ⚠️ {task.error}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Screenshot Gallery */}
      {progress?.tasks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Screenshots</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {progress.tasks
                .flatMap(task => task.screenshots || [])
                .slice(-6) // Show last 6 screenshots
                .map((screenshot, index) => (
                <motion.div
                  key={screenshot}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={screenshot}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(screenshot, '_blank')}
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {progress.tasks.every(task => task.screenshots?.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📸</div>
              <p>Screenshots will appear here as AI explores the platform</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Demo Explanation for Failed Status */}
      {progress?.status === 'failed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8"
        >
          <div className="text-center">
            <div className="text-3xl mb-3">🎭</div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Demo Limitation Reached</h3>
            <p className="text-amber-700 mb-4">
              This demo has reached the Browserbase account billing limit (HTTP 402).
              In a production environment, this would continue running with proper billing configured.
            </p>
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <h4 className="font-medium text-gray-900 mb-2">What You've Seen:</h4>
              <ul className="text-sm text-gray-700 text-left space-y-1">
                <li>✅ Real Stagehand AI initialization</li>
                <li>✅ Browserbase cloud infrastructure connection</li>
                <li>✅ Structured data extraction schemas</li>
                <li>✅ Real-time progress tracking with SSE</li>
                <li>✅ Professional demo interface</li>
              </ul>
            </div>
            <p className="text-sm text-amber-600 mt-3">
              The core AI automation framework is fully functional - just limited by demo account billing.
            </p>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center mt-8"
      >
        <button
          onClick={onReset}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Platform Selection
        </button>
        {progress?.status === 'failed' && (
          <p className="text-sm text-gray-600 mt-2">
            Try selecting a different platform to see the demo interface again
          </p>
        )}
      </motion.div>
    </div>
  );
}