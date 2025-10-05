const { StagehandExplorer } = require('./src/lib/stagehand-explorer');
const { promises: fs } = require('fs');
const path = require('path');

async function exploreSlashML() {
  // Session directory
  const sessionDir = '/Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/generated/session_1758745432381_43tln883z5x';

  // Ensure session directory exists
  await fs.mkdir(sessionDir, { recursive: true });

  const explorer = new StagehandExplorer(sessionDir);

  try {
    console.log('🚀 Initializing Stagehand Explorer...');
    await explorer.initialize();

    // Step-by-step exploration tasks
    const explorationTasks = [
      {
        action: 'navigate',
        description: 'Navigate to SlashML homepage',
        params: { url: 'https://v1.slashml.com' }
      },
      {
        action: 'screenshot',
        description: 'Take initial homepage screenshot',
        params: { filename: '01-homepage-initial.png', fullPage: false }
      },
      {
        action: 'act',
        description: 'Look for authentication options on the page',
        params: { instruction: 'find any login, sign in, sign up, or get started buttons on the page' }
      },
      {
        action: 'screenshot',
        description: 'Screenshot after identifying auth options',
        params: { filename: '02-auth-options-identified.png', fullPage: false }
      },
      {
        action: 'act',
        description: 'Click on sign in or login button',
        params: { instruction: 'click on the sign in, login, or get started button' }
      },
      {
        action: 'wait',
        description: 'Wait for page to load after clicking',
        params: { waitTime: 3000 }
      },
      {
        action: 'screenshot',
        description: 'Screenshot of authentication page',
        params: { filename: '03-auth-page.png', fullPage: false }
      }
    ];

    console.log(`📋 Executing ${explorationTasks.length} exploration tasks...`);

    const results = await explorer.executeTasks(explorationTasks);

    // Log results
    console.log('\n📊 EXPLORATION RESULTS:');
    results.forEach((result, index) => {
      console.log(`\nTask ${index + 1}: ${explorationTasks[index].description}`);
      console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
      if (result.data) {
        console.log(`Data: ${result.data}`);
      }
      if (result.screenshotPath) {
        console.log(`Screenshot: ${result.screenshotPath}`);
      }
      if (result.currentUrl) {
        console.log(`URL: ${result.currentUrl}`);
      }
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    });

    console.log('\n🎯 MANUAL AUTHENTICATION PHASE');
    console.log('The browser should now be showing an authentication page.');
    console.log('Please manually complete the authentication process in the browser.');
    console.log('The script will wait for you to complete login...');

    // Wait for manual authentication (simulated with a longer wait)
    await explorer.executeTasks([
      {
        action: 'wait',
        description: 'Wait for manual authentication',
        params: { waitTime: 60000 } // 1 minute wait
      },
      {
        action: 'screenshot',
        description: 'Screenshot after authentication',
        params: { filename: '04-post-auth.png', fullPage: false }
      },
      {
        action: 'act',
        description: 'Explore main features after authentication',
        params: { instruction: 'scroll down to see the main features and interface of the application' }
      },
      {
        action: 'screenshot',
        description: 'Screenshot of main application features',
        params: { filename: '05-main-features.png', fullPage: false }
      },
      {
        action: 'act',
        description: 'Try to use one main feature',
        params: { instruction: 'click on the first main feature or action button you can find' }
      },
      {
        action: 'screenshot',
        description: 'Screenshot of feature in use',
        params: { filename: '06-feature-usage.png', fullPage: false }
      },
      {
        action: 'screenshot',
        description: 'Final full-page screenshot',
        params: { filename: '07-final-fullpage.png', fullPage: true }
      }
    ]);

    const currentUrl = await explorer.getCurrentUrl();
    console.log(`\n🏁 EXPLORATION COMPLETED!`);
    console.log(`Final URL: ${currentUrl}`);
    console.log(`Session directory: ${sessionDir}`);
    console.log(`Check the session directory for all screenshots and documentation.`);

  } catch (error) {
    console.error('❌ Exploration failed:', error);
  } finally {
    await explorer.close();
    console.log('🔒 Stagehand session closed.');
  }
}

// Run the exploration
exploreSlashML().catch(console.error);