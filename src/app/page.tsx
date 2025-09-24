'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Home() {
  const [isHovering, setIsHovering] = useState<string | null>(null);

  const features = [
    {
      id: 'ai-automation',
      icon: '🤖',
      title: 'AI-Powered Automation',
      description: 'Stagehand AI intelligently navigates and analyzes SaaS platforms',
      details: ['Smart element detection', 'Autonomous page exploration', 'Natural language instructions']
    },
    {
      id: 'real-time',
      icon: '⚡',
      title: 'Real-Time Progress',
      description: 'Watch AI work in real-time with live progress tracking and screenshots',
      details: ['Live browser view', 'Progress visualization', 'Screenshot gallery']
    },
    {
      id: 'structured-docs',
      icon: '📋',
      title: 'Structured Documentation',
      description: 'Generate comprehensive docs with organized sections and insights',
      details: ['Markdown export', 'Shareable URLs', 'Professional formatting']
    }
  ];

  const platforms = [
    { name: 'Notion', color: 'from-gray-700 to-gray-900' },
    { name: 'Linear', color: 'from-blue-500 to-purple-600' },
    { name: 'Airtable', color: 'from-yellow-400 to-orange-500' },
    { name: 'Figma', color: 'from-pink-400 to-red-500' },
    { name: 'Stripe', color: 'from-indigo-500 to-blue-600' },
    { name: 'Vercel', color: 'from-black to-gray-700' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6"
          >
            <span className="text-4xl">🚀</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            SaaS Docs Generator
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8">
            AI-powered documentation generator for SaaS platforms using
            <span className="font-semibold text-purple-600"> Browserbase + Stagehand</span>
          </p>

          <p className="text-purple-600 font-semibold mb-8">
            🎯 Live Demo for AI Tinkerers Montreal
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/demo"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              ✨ Try the Demo
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="relative bg-white rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all cursor-pointer"
              onMouseEnter={() => setIsHovering(feature.id)}
              onMouseLeave={() => setIsHovering(null)}
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: isHovering === feature.id ? 1 : 0,
                  height: isHovering === feature.id ? 'auto' : 0
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="space-y-1">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-purple-600 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Supported Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Demo Platforms
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className={`bg-gradient-to-r ${platform.color} text-white p-4 rounded-lg font-semibold text-center shadow-lg hover:scale-105 transition-transform`}
              >
                {platform.name}
              </motion.div>
            ))}
          </div>
          <p className="text-gray-600 mt-6">
            Choose any platform in the demo to see AI generate comprehensive documentation
          </p>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white rounded-xl p-8 shadow-lg border border-purple-100 mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Select Platform', desc: 'Choose a SaaS platform to analyze' },
              { step: '2', title: 'AI Navigation', desc: 'Stagehand AI explores the platform intelligently' },
              { step: '3', title: 'Real-time Progress', desc: 'Watch live screenshots and progress updates' },
              { step: '4', title: 'Get Documentation', desc: 'Download or share the generated docs' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-12 shadow-xl"
        >
          <h2 className="text-4xl font-bold mb-4">
            Ready to See AI in Action?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Experience the future of automated documentation generation
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/demo"
              className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-lg shadow-lg hover:bg-gray-50 transition-all"
            >
              🚀 Launch Demo
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 border-t pt-8">
          <p className="mb-2">
            Built with Next.js, Stagehand AI, and Browserbase
          </p>
          <p>
            {new Date().getFullYear()} AI Tinkerers Montreal Demo
          </p>
        </footer>
      </div>
    </div>
  );
}