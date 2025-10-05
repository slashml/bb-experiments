const { StagehandExplorer } = require('./src/lib/stagehand-explorer.ts');
const path = require('path');

async function exploreSlashML() {
  const sessionDir = '/Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/generated/session_1758744939672_idtdm22yxg';
  const targetUrl = 'https://v1.slashml.com';

  console.log('🚀 Starting interactive exploration of SlashML...');
  console.log(`Session directory: ${sessionDir}`);
  console.log(`Target URL: ${targetUrl}\n`);

  const explorer = new StagehandExplorer(sessionDir);

  try {
    // Step 1: Initialize
    console.log('📋 Step 1: Initializing Stagehand...');
    await explorer.initialize();
    console.log('✅ Stagehand initialized successfully\n');

    // Step 2: Navigate and take initial screenshot
    console.log('📋 Step 2: Navigate to homepage and take initial screenshot...');
    const tasks = [
      {
        action: 'navigate',
        description: 'Navigate to SlashML homepage',
        params: { url: targetUrl }
      },
      {
        action: 'wait',
        description: 'Wait for page to load completely',
        params: { waitTime: 3000 }
      },
      {
        action: 'screenshot',
        description: 'Take initial homepage screenshot',
        params: { filename: '01-homepage-initial.png', fullPage: true }
      }
    ];

    let results = await explorer.executeTasks(tasks);
    console.log('✅ Initial navigation completed\n');

    // Step 3: Analyze homepage for authentication options
    console.log('📋 Step 3: Look for authentication buttons...');
    const authTasks = [
      {
        action: 'act',
        description: 'Find and hover over sign up or login buttons',
        params: { instruction: 'look for sign up, login, get started, or authentication buttons on the page' }
      },
      {
        action: 'screenshot',
        description: 'Screenshot after finding auth options',
        params: { filename: '02-auth-options-found.png', fullPage: false }
      }
    ];

    results = await explorer.executeTasks(authTasks);
    console.log('✅ Authentication analysis completed\n');

    // Step 4: Try to access authentication flow
    console.log('📋 Step 4: Attempt to access authentication...');
    const clickAuthTasks = [
      {
        action: 'act',
        description: 'Click on sign up or get started button',
        params: { instruction: 'click on the sign up, get started, or main call-to-action button' }
      },
      {
        action: 'wait',
        description: 'Wait for auth page to load',
        params: { waitTime: 3000 }
      },
      {
        action: 'screenshot',
        description: 'Screenshot of authentication page',
        params: { filename: '03-auth-page.png', fullPage: false }
      }
    ];

    results = await explorer.executeTasks(clickAuthTasks);
    console.log('✅ Authentication page accessed\n');

    // Step 5: Explore authentication options
    console.log('📋 Step 5: Analyze authentication methods...');
    const authMethodsTasks = [
      {
        action: 'act',
        description: 'Look for different authentication methods',
        params: { instruction: 'identify all available authentication methods like Google, GitHub, email, etc.' }
      },
      {
        action: 'screenshot',
        description: 'Screenshot of auth methods',
        params: { filename: '04-auth-methods.png', fullPage: false, focusElement: 'form, .auth-form, .login-form, .signup-form' }
      }
    ];

    results = await explorer.executeTasks(authMethodsTasks);
    console.log('✅ Authentication methods analyzed\n');

    // Step 6: Try Google/GitHub auth (common for developer tools)
    console.log('📋 Step 6: Attempt social authentication...');
    const socialAuthTasks = [
      {
        action: 'act',
        description: 'Try to click on Google or GitHub authentication',
        params: { instruction: 'click on Google sign in or GitHub sign in button if available' }
      },
      {
        action: 'wait',
        description: 'Wait for auth provider redirect',
        params: { waitTime: 4000 }
      },
      {
        action: 'screenshot',
        description: 'Screenshot after auth provider click',
        params: { filename: '05-auth-provider-redirect.png', fullPage: false }
      }
    ];

    results = await explorer.executeTasks(socialAuthTasks);
    console.log('✅ Social auth attempt completed\n');

    // Step 7: Explore any accessible features without full auth
    console.log('📋 Step 7: Explore available features...');
    const featureExplorationTasks = [
      {
        action: 'act',
        description: 'Navigate back or find demo/trial features',
        params: { instruction: 'go back to main page or look for demo, try it, or trial features' }
      },
      {
        action: 'wait',
        description: 'Wait for navigation',
        params: { waitTime: 2000 }
      },
      {
        action: 'screenshot',
        description: 'Screenshot of main features',
        params: { filename: '06-main-features.png', fullPage: false }
      },
      {
        action: 'act',
        description: 'Scroll to see more content',
        params: { instruction: 'scroll down slowly to see more features and content' }
      },
      {
        action: 'screenshot',
        description: 'Screenshot after scrolling',
        params: { filename: '07-features-scrolled.png', fullPage: false }
      }
    ];

    results = await explorer.executeTasks(featureExplorationTasks);
    console.log('✅ Feature exploration completed\n');

    // Step 8: Take final comprehensive screenshots
    console.log('📋 Step 8: Final comprehensive documentation...');
    const finalTasks = [
      {
        action: 'act',
        description: 'Scroll to top of page',
        params: { instruction: 'scroll to the very top of the page' }
      },
      {
        action: 'screenshot',
        description: 'Final full-page screenshot',
        params: { filename: '08-final-fullpage.png', fullPage: true }
      }
    ];

    results = await explorer.executeTasks(finalTasks);
    console.log('✅ Final documentation completed\n');

    // Get current URL for reference
    const finalUrl = await explorer.getCurrentUrl();
    console.log(`🔍 Final URL: ${finalUrl}`);

    console.log('\n🎉 Interactive exploration completed successfully!');
    console.log(`📁 Screenshots saved to: ${sessionDir}`);
    console.log('📝 Ready for documentation analysis...\n');

  } catch (error) {
    console.error('❌ Exploration failed:', error);
  } finally {
    // Step 9: Close Stagehand
    console.log('📋 Step 9: Cleaning up...');
    await explorer.close();
    console.log('✅ Stagehand closed successfully');
  }
}

// Run the exploration
exploreSlashML().catch(console.error);