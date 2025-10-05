require('dotenv').config();
const { Stagehand } = require('@browserbasehq/stagehand');
const fs = require('fs').promises;
const path = require('path');

async function exploreSlashML() {
  // Session directory
  const sessionDir = '/Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/generated/session_1758745278118_8sm5z9eea52';

  // Ensure session directory exists
  await fs.mkdir(sessionDir, { recursive: true });

  let stagehand = null;
  let screenshotCounter = 0;

  async function takeScreenshot(description, fullPage = false) {
    screenshotCounter++;
    const filename = `${screenshotCounter.toString().padStart(2, '0')}-${description.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    const screenshotPath = path.join(sessionDir, filename);

    const screenshot = await stagehand.page.screenshot({
      fullPage: fullPage,
      type: 'png'
    });

    await fs.writeFile(screenshotPath, screenshot);
    console.log(`📸 Screenshot saved: ${filename}`);
    console.log(`   Description: ${description}`);
    console.log(`   Path: ${screenshotPath}`);
    console.log(`   Current URL: ${stagehand.page.url()}\n`);

    return screenshotPath;
  }

  try {
    console.log('🚀 Starting SlashML exploration with Stagehand...');

    // Initialize Stagehand
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY || null, // Optional for basic operations
      enableStealth: true,
      headless: false // Keep visible so user can interact
    });

    await stagehand.init();
    console.log('✅ Stagehand initialized successfully\n');

    // Step 1: Navigate to SlashML
    console.log('🌐 Step 1: Navigating to SlashML...');
    await stagehand.page.goto('https://v1.slashml.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await stagehand.page.waitForTimeout(3000);
    await takeScreenshot('Homepage initial view');

    // Step 2: Look for authentication
    console.log('🔍 Step 2: Looking for authentication options...');
    try {
      await stagehand.page.act('find any login, sign in, sign up, or get started buttons on this page');
      await stagehand.page.waitForTimeout(2000);
      await takeScreenshot('After finding auth options');

      // Step 3: Try to click authentication
      console.log('👆 Step 3: Attempting to click authentication...');
      await stagehand.page.act('click on the sign in, login, or get started button');
      await stagehand.page.waitForTimeout(5000);
      await takeScreenshot('Authentication page or modal');

    } catch (error) {
      console.log('⚠️  Could not find or click authentication:', error.message);
      await takeScreenshot('No auth found - exploring current page');
    }

    // Step 4: Explore current page content
    console.log('🔎 Step 4: Exploring current page content...');
    try {
      await stagehand.page.act('scroll down slowly to see more content on the page');
      await stagehand.page.waitForTimeout(3000);
      await takeScreenshot('After scrolling to see content');

      // Step 5: Try to find and use main features
      console.log('🎯 Step 5: Looking for main features...');
      await stagehand.page.act('look for and click on the main feature or most prominent action button on this page');
      await stagehand.page.waitForTimeout(4000);
      await takeScreenshot('After clicking main feature');

    } catch (error) {
      console.log('⚠️  Error exploring content:', error.message);
    }

    // Step 6: Take final screenshots
    console.log('📷 Step 6: Taking final documentation screenshots...');
    await takeScreenshot('Current viewport final view', false);
    await takeScreenshot('Full page final view', true);

    console.log('🏁 EXPLORATION COMPLETED!');
    console.log(`📁 Session directory: ${sessionDir}`);
    console.log(`🌐 Final URL: ${stagehand.page.url()}`);
    console.log(`📸 Total screenshots taken: ${screenshotCounter}`);

    // Keep browser open for manual exploration if needed
    console.log('\n⏳ Browser will stay open for 60 seconds for manual exploration...');
    console.log('   You can manually interact with the page if needed.');
    await stagehand.page.waitForTimeout(60000);

  } catch (error) {
    console.error('❌ Exploration failed:', error);

    if (stagehand) {
      try {
        await takeScreenshot('Error state final screenshot');
      } catch (screenshotError) {
        console.log('Could not take error screenshot:', screenshotError.message);
      }
    }

  } finally {
    if (stagehand) {
      await stagehand.close();
      console.log('🔒 Stagehand session closed');
    }
  }
}

// Check for required environment variables
const requiredEnvVars = ['BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.log('⚠️  OpenAI API key not found - AI features may be limited');
}

// Run the exploration
exploreSlashML().catch(console.error);