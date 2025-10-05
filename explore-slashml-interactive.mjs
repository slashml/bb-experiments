#!/usr/bin/env node

import { Stagehand } from '@browserbasehq/stagehand';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sessionDir = '/Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/generated/session_1758745263342_jvuuhkkao4b';
const targetUrl = 'https://v1.slashml.com';

// Ensure session directory exists
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// Log function for better tracking
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function exploreSlashML() {
  let stagehand = null;

  try {
    log('🚀 Starting interactive exploration of SlashML');

    // Initialize Stagehand
    log('🔧 Initializing Stagehand...');
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY,
      enableStealth: true,
      headless: false // Keep visible for interactive exploration
    });

    await stagehand.init();
    log('✅ Stagehand initialized successfully');

    // Navigate to the website
    log(`🌐 Navigating to ${targetUrl}...`);
    await stagehand.page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for page to stabilize
    await stagehand.page.waitForTimeout(3000);
    log(`📍 Successfully loaded ${targetUrl}`);

    // Step 1: Take initial screenshot
    log('📸 Taking initial homepage screenshot...');
    const step1Screenshot = await stagehand.page.screenshot({
      fullPage: false,
      type: 'png'
    });
    fs.writeFileSync(path.join(sessionDir, '01-homepage-initial.png'), step1Screenshot);
    log('✅ Initial screenshot saved');

    // Step 2: Extract page information
    log('🔍 Analyzing homepage content...');
    try {
      const pageInfo = await stagehand.page.extract({
        instruction: "Extract comprehensive information about this homepage including the main value proposition, key features, navigation options, and any call-to-action buttons",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            mainHeading: { type: "string" },
            description: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            navigationItems: { type: "array", items: { type: "string" } },
            ctaButtons: { type: "array", items: { type: "string" } },
            authOptions: { type: "array", items: { type: "string" } }
          }
        }
      });

      fs.writeFileSync(
        path.join(sessionDir, '01-homepage-analysis.json'),
        JSON.stringify(pageInfo, null, 2)
      );
      log('✅ Homepage analysis saved');
      console.log('Homepage Analysis:', JSON.stringify(pageInfo, null, 2));
    } catch (error) {
      log(`⚠️ Homepage analysis failed: ${error.message}`);
    }

    // Step 3: Look for authentication options
    log('🔐 Looking for authentication options...');
    try {
      await stagehand.page.act({
        action: "observe",
        instruction: "Find any sign up, sign in, login, or get started buttons on this page"
      });

      // Try to click on authentication
      await stagehand.page.act({
        action: "click",
        instruction: "Click on the sign up, sign in, or get started button"
      });

      await stagehand.page.waitForTimeout(3000);

      // Take screenshot of auth page
      log('📸 Taking authentication page screenshot...');
      const authScreenshot = await stagehand.page.screenshot({
        fullPage: false,
        type: 'png'
      });
      fs.writeFileSync(path.join(sessionDir, '02-authentication-page.png'), authScreenshot);

      const currentUrl = stagehand.page.url();
      log(`📍 Authentication page URL: ${currentUrl}`);

      // Extract auth page info
      const authPageInfo = await stagehand.page.extract({
        instruction: "Extract information about this authentication page including available login methods, signup options, and any forms",
        schema: {
          type: "object",
          properties: {
            pageType: { type: "string" },
            loginMethods: { type: "array", items: { type: "string" } },
            signupOptions: { type: "array", items: { type: "string" } },
            formFields: { type: "array", items: { type: "string" } },
            socialAuth: { type: "array", items: { type: "string" } }
          }
        }
      });

      fs.writeFileSync(
        path.join(sessionDir, '02-auth-page-analysis.json'),
        JSON.stringify(authPageInfo, null, 2)
      );
      log('✅ Authentication page analysis saved');
      console.log('Auth Page Analysis:', JSON.stringify(authPageInfo, null, 2));

    } catch (error) {
      log(`⚠️ Authentication exploration failed: ${error.message}`);
    }

    // Step 4: Try to explore without authentication
    log('🔍 Exploring public content...');
    try {
      // Go back to homepage
      await stagehand.page.goto(targetUrl);
      await stagehand.page.waitForTimeout(2000);

      // Try to scroll and explore content
      await stagehand.page.act({
        action: "scroll",
        instruction: "Scroll down slowly to see more content"
      });

      await stagehand.page.waitForTimeout(2000);

      // Take screenshot after scrolling
      const scrollScreenshot = await stagehand.page.screenshot({
        fullPage: false,
        type: 'png'
      });
      fs.writeFileSync(path.join(sessionDir, '03-homepage-scrolled.png'), scrollScreenshot);
      log('📸 Scrolled content screenshot saved');

      // Take full page screenshot
      const fullPageScreenshot = await stagehand.page.screenshot({
        fullPage: true,
        type: 'png'
      });
      fs.writeFileSync(path.join(sessionDir, '04-homepage-fullpage.png'), fullPageScreenshot);
      log('📸 Full page screenshot saved');

    } catch (error) {
      log(`⚠️ Content exploration failed: ${error.message}`);
    }

    // Step 5: Create exploration summary
    log('📝 Creating exploration summary...');
    const explorationSummary = {
      targetUrl,
      explorationTimestamp: new Date().toISOString(),
      sessionDir,
      steps: [
        {
          step: 1,
          action: "Homepage initial view",
          screenshot: "01-homepage-initial.png",
          analysis: "01-homepage-analysis.json"
        },
        {
          step: 2,
          action: "Authentication page exploration",
          screenshot: "02-authentication-page.png",
          analysis: "02-auth-page-analysis.json"
        },
        {
          step: 3,
          action: "Content scrolling",
          screenshot: "03-homepage-scrolled.png"
        },
        {
          step: 4,
          action: "Full page capture",
          screenshot: "04-homepage-fullpage.png"
        }
      ],
      notes: [
        "Interactive exploration completed",
        "Screenshots captured at each step",
        "Content analysis extracted where possible",
        "Authentication flow identified"
      ]
    };

    fs.writeFileSync(
      path.join(sessionDir, 'exploration-summary.json'),
      JSON.stringify(explorationSummary, null, 2)
    );

    log('✅ Exploration summary saved');
    log('🎉 Interactive exploration completed successfully!');

    // Keep browser open for manual exploration
    log('🖥️  Browser kept open for manual exploration. Press Ctrl+C to close when done.');

    // Wait indefinitely to keep browser open
    await new Promise(resolve => {
      process.on('SIGINT', resolve);
      console.log('Browser is ready for manual exploration...');
    });

  } catch (error) {
    log(`❌ Exploration failed: ${error.message}`);
    console.error('Full error:', error);
  } finally {
    if (stagehand) {
      log('🔧 Cleaning up Stagehand...');
      await stagehand.close();
      log('✅ Stagehand closed');
    }
  }
}

// Run the exploration
exploreSlashML().catch(console.error);