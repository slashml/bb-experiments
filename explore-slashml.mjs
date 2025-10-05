import { Stagehand } from '@browserbasehq/stagehand';
import { promises as fs } from 'fs';
import path from 'path';

const sessionDir = '/Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/generated/session_1758745432381_43tln883z5x';
const targetUrl = 'https://v1.slashml.com';

// Helper function for taking screenshots
async function takeScreenshot(stagehand, sessionDir, filename, description, fullPage = false) {
  try {
    console.log(`📸 Taking screenshot: ${description}`);

    const screenshot = await stagehand.page.screenshot({
      fullPage,
      type: 'png'
    });

    const screenshotPath = path.join(sessionDir, filename);
    await fs.writeFile(screenshotPath, screenshot);

    console.log(`✅ Screenshot saved: ${filename}\n`);
  } catch (error) {
    console.error(`❌ Failed to take screenshot ${filename}:`, error);
  }
}

async function exploreSlashML() {
  console.log('🚀 Starting interactive exploration of SlashML...');
  console.log(`Session directory: ${sessionDir}`);
  console.log(`Target URL: ${targetUrl}\n`);

  let stagehand = null;
  let screenshotCounter = 0;

  try {
    // Step 1: Initialize Stagehand
    console.log('📋 Step 1: Initializing Stagehand...');
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY,
      enableStealth: true,
      headless: true
    });

    await stagehand.init();
    console.log('✅ Stagehand initialized successfully\n');

    // Step 2: Navigate to homepage
    console.log('📋 Step 2: Navigate to SlashML homepage...');
    await stagehand.page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('✅ Navigated to homepage\n');

    // Wait for page to stabilize
    await stagehand.page.waitForTimeout(3000);

    // Take initial screenshot
    await takeScreenshot(stagehand, sessionDir, '01-homepage-initial.png', 'Homepage initial view', true);

    // Step 3: Analyze homepage for authentication
    console.log('📋 Step 3: Analyzing homepage for authentication options...');
    try {
      await stagehand.page.act('find and highlight any sign up, login, get started, or authentication buttons');
      await stagehand.page.waitForTimeout(2000);
      await takeScreenshot(stagehand, sessionDir, '02-auth-options-highlighted.png', 'Authentication options found');
    } catch (error) {
      console.log('Note: Could not find auth options automatically, continuing...');
    }

    // Step 4: Try to access authentication
    console.log('📋 Step 4: Attempting to access authentication...');
    try {
      await stagehand.page.act('click on the main sign up, get started, or call-to-action button');
      await stagehand.page.waitForTimeout(3000);
      await takeScreenshot(stagehand, sessionDir, '03-after-auth-click.png', 'After clicking authentication button');

      const currentUrl = stagehand.page.url();
      console.log(`Current URL after auth click: ${currentUrl}`);
    } catch (error) {
      console.log('Note: Could not access authentication automatically, continuing...');
    }

    // Step 5: Explore features section
    console.log('📋 Step 5: Exploring main features...');
    try {
      await stagehand.page.act('scroll down slowly to see the main features and content of the application');
      await stagehand.page.waitForTimeout(2000);
      await takeScreenshot(stagehand, sessionDir, '04-features-section.png', 'Main features section');
    } catch (error) {
      console.log('Note: Could not scroll to features automatically, taking manual screenshot...');
      await takeScreenshot(stagehand, sessionDir, '04-current-view.png', 'Current view');
    }

    // Step 6: Look for demo or trial options
    console.log('📋 Step 6: Looking for demo or trial options...');
    try {
      await stagehand.page.act('look for and click on any demo, try it, playground, or trial features');
      await stagehand.page.waitForTimeout(3000);
      await takeScreenshot(stagehand, sessionDir, '05-demo-or-trial.png', 'Demo or trial features');
    } catch (error) {
      console.log('Note: No demo/trial features found, continuing...');
    }

    // Step 7: Explore pricing or plans if available
    console.log('📋 Step 7: Looking for pricing information...');
    try {
      await stagehand.page.act('find and navigate to pricing, plans, or subscription information');
      await stagehand.page.waitForTimeout(2000);
      await takeScreenshot(stagehand, sessionDir, '06-pricing-info.png', 'Pricing information');
    } catch (error) {
      console.log('Note: No pricing info found, continuing...');
    }

    // Step 8: Try to understand the main value proposition
    console.log('📋 Step 8: Capturing main value proposition...');
    try {
      await stagehand.page.act('scroll to the top of the page to see the main headline and value proposition');
      await stagehand.page.waitForTimeout(2000);
      await takeScreenshot(stagehand, sessionDir, '07-value-proposition.png', 'Main value proposition');
    } catch (error) {
      console.log('Note: Could not navigate to top, taking current screenshot...');
      await takeScreenshot(stagehand, sessionDir, '07-current-final.png', 'Final view');
    }

    // Step 9: Final comprehensive screenshot
    console.log('📋 Step 9: Taking final comprehensive screenshot...');
    await takeScreenshot(stagehand, sessionDir, '08-final-fullpage.png', 'Final full page view', true);

    const finalUrl = stagehand.page.url();
    console.log(`🔍 Final URL: ${finalUrl}`);

    console.log('\n🎉 Interactive exploration completed successfully!');
    console.log(`📁 Screenshots saved to: ${sessionDir}`);
    console.log('📝 Ready for documentation analysis...\n');

    // List all screenshots taken
    console.log('📸 Screenshots captured:');
    const files = await fs.readdir(sessionDir);
    const pngFiles = files.filter(f => f.endsWith('.png')).sort();
    pngFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

  } catch (error) {
    console.error('❌ Exploration failed:', error);
  } finally {
    if (stagehand) {
      console.log('📋 Cleaning up...');
      await stagehand.close();
      console.log('✅ Stagehand closed successfully');
    }
  }

}

// Run the exploration
exploreSlashML().catch(console.error);