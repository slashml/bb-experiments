const fs = require('fs').promises;
const path = require('path');

// Import the StagehandExplorer
const { StagehandExplorer } = require('./src/lib/stagehand-explorer.ts');

const OUTPUT_DIR = '/Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/generated/session_1758745432381_43tln883z5x';
const SLASHML_URL = 'https://v1.slashml.com';

async function comprehensiveSlashMLExploration() {
  console.log('🚀 Starting comprehensive SlashML website exploration...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  const explorer = new StagehandExplorer(OUTPUT_DIR);
  let explorationResults = [];
  let screenshotCount = 0;

  try {
    // Initialize Stagehand
    console.log('🔧 Initializing Stagehand...');
    await explorer.initialize();

    // Phase 1: Homepage Exploration
    console.log('\n📖 Phase 1: Homepage Exploration');
    const homepageTasks = [
      {
        action: 'navigate',
        description: 'Navigate to SlashML homepage',
        params: { url: SLASHML_URL }
      },
      {
        action: 'wait',
        description: 'Wait for page to fully load',
        params: { waitTime: 5000 }
      },
      {
        action: 'screenshot',
        description: 'Take full-page homepage screenshot',
        params: {
          filename: `01-homepage-full-page.png`,
          fullPage: true
        }
      },
      {
        action: 'screenshot',
        description: 'Take homepage hero section screenshot',
        params: {
          filename: `02-homepage-hero-section.png`,
          fullPage: false
        }
      }
    ];

    const homepageResults = await explorer.executeTasks(homepageTasks);
    explorationResults.push(...homepageResults);
    screenshotCount += homepageResults.filter(r => r.screenshotPath).length;

    // Phase 2: Navigation and Key Sections
    console.log('\n🧭 Phase 2: Navigation and Key Sections Exploration');
    const navigationTasks = [
      {
        action: 'act',
        description: 'Look for and explore main navigation menu',
        params: { instruction: 'find the main navigation menu and identify key sections' }
      },
      {
        action: 'screenshot',
        description: 'Capture navigation area',
        params: {
          filename: `03-navigation-menu.png`,
          fullPage: false,
          focusElement: 'nav, header, .navbar, .navigation, .menu'
        }
      },
      {
        action: 'act',
        description: 'Scroll to explore features section',
        params: { instruction: 'scroll down slowly to find the main features or key value propositions' }
      },
      {
        action: 'screenshot',
        description: 'Capture features section',
        params: {
          filename: `04-features-section.png`,
          fullPage: false
        }
      },
      {
        action: 'act',
        description: 'Look for pricing or product information',
        params: { instruction: 'find and navigate to pricing, products, or service offerings section' }
      },
      {
        action: 'screenshot',
        description: 'Capture pricing/product section',
        params: {
          filename: `05-pricing-products.png`,
          fullPage: false
        }
      }
    ];

    const navigationResults = await explorer.executeTasks(navigationTasks);
    explorationResults.push(...navigationResults);
    screenshotCount += navigationResults.filter(r => r.screenshotPath).length;

    // Phase 3: Authentication Flow Exploration
    console.log('\n🔐 Phase 3: Authentication Flow Exploration');
    const authTasks = [
      {
        action: 'act',
        description: 'Find and click on login/sign up button',
        params: { instruction: 'find and click on login, sign up, sign in, or get started button' }
      },
      {
        action: 'wait',
        description: 'Wait for authentication page to load',
        params: { waitTime: 3000 }
      },
      {
        action: 'screenshot',
        description: 'Capture authentication page',
        params: {
          filename: `06-authentication-page.png`,
          fullPage: true
        }
      },
      {
        action: 'screenshot',
        description: 'Focus on login form',
        params: {
          filename: `07-login-form-focus.png`,
          fullPage: false,
          focusElement: 'form, .login-form, .auth-form, .signin-form'
        }
      },
      {
        action: 'act',
        description: 'Look for alternative authentication methods',
        params: { instruction: 'identify any social login options, SSO, or alternative authentication methods' }
      },
      {
        action: 'screenshot',
        description: 'Capture auth methods',
        params: {
          filename: `08-auth-methods.png`,
          fullPage: false
        }
      }
    ];

    const authResults = await explorer.executeTasks(authTasks);
    explorationResults.push(...authResults);
    screenshotCount += authResults.filter(r => r.screenshotPath).length;

    // Phase 4: Documentation and Getting Started
    console.log('\n📚 Phase 4: Documentation and Getting Started');
    const docTasks = [
      {
        action: 'act',
        description: 'Navigate back to homepage',
        params: { instruction: 'go back to the main homepage' }
      },
      {
        action: 'act',
        description: 'Look for documentation or getting started guide',
        params: { instruction: 'find and click on documentation, getting started, help, or guide links' }
      },
      {
        action: 'wait',
        description: 'Wait for documentation to load',
        params: { waitTime: 3000 }
      },
      {
        action: 'screenshot',
        description: 'Capture documentation page',
        params: {
          filename: `09-documentation-page.png`,
          fullPage: true
        }
      },
      {
        action: 'act',
        description: 'Explore tutorials or onboarding',
        params: { instruction: 'look for tutorials, quick start guide, or onboarding flow' }
      },
      {
        action: 'screenshot',
        description: 'Capture getting started content',
        params: {
          filename: `10-getting-started.png`,
          fullPage: false
        }
      }
    ];

    const docResults = await explorer.executeTasks(docTasks);
    explorationResults.push(...docResults);
    screenshotCount += docResults.filter(r => r.screenshotPath).length;

    // Phase 5: Deep Feature Exploration
    console.log('\n🔍 Phase 5: Deep Feature Exploration');
    const featureTasks = [
      {
        action: 'act',
        description: 'Navigate to explore platform features',
        params: { instruction: 'find and explore the main platform features, tools, or capabilities' }
      },
      {
        action: 'screenshot',
        description: 'Capture platform features',
        params: {
          filename: `11-platform-features.png`,
          fullPage: true
        }
      },
      {
        action: 'act',
        description: 'Look for demo or interactive elements',
        params: { instruction: 'find any demo, interactive elements, or try-it-now features' }
      },
      {
        action: 'screenshot',
        description: 'Capture demo/interactive content',
        params: {
          filename: `12-demo-interactive.png`,
          fullPage: false
        }
      },
      {
        action: 'act',
        description: 'Explore footer and additional links',
        params: { instruction: 'scroll to footer and explore additional links like about, contact, support' }
      },
      {
        action: 'screenshot',
        description: 'Capture footer and additional sections',
        params: {
          filename: `13-footer-additional.png`,
          fullPage: false,
          focusElement: 'footer, .footer'
        }
      }
    ];

    const featureResults = await explorer.executeTasks(featureTasks);
    explorationResults.push(...featureResults);
    screenshotCount += featureResults.filter(r => r.screenshotPath).length;

    // Phase 6: Final Complete Capture
    console.log('\n📸 Phase 6: Final Complete Capture');
    const finalTasks = [
      {
        action: 'navigate',
        description: 'Return to homepage for final capture',
        params: { url: SLASHML_URL }
      },
      {
        action: 'wait',
        description: 'Wait for complete page load',
        params: { waitTime: 5000 }
      },
      {
        action: 'screenshot',
        description: 'Final complete homepage screenshot',
        params: {
          filename: `14-final-complete-homepage.png`,
          fullPage: true
        }
      }
    ];

    const finalResults = await explorer.executeTasks(finalTasks);
    explorationResults.push(...finalResults);
    screenshotCount += finalResults.filter(r => r.screenshotPath).length;

    // Generate comprehensive exploration report
    const currentUrl = await explorer.getCurrentUrl();
    const report = generateExplorationReport(explorationResults, screenshotCount, currentUrl);

    // Save report to file
    const reportPath = path.join(OUTPUT_DIR, 'slashml-exploration-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n✅ Comprehensive SlashML exploration completed!`);
    console.log(`📊 Total screenshots taken: ${screenshotCount}`);
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log(`📁 All files saved in: ${OUTPUT_DIR}`);

    return report;

  } catch (error) {
    console.error('❌ Exploration failed:', error);
    throw error;
  } finally {
    await explorer.close();
  }
}

function generateExplorationReport(results, screenshotCount, finalUrl) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const screenshots = results.filter(r => r.screenshotPath);

  return {
    exploration: {
      website: 'SlashML (https://v1.slashml.com)',
      timestamp: new Date().toISOString(),
      totalTasks: results.length,
      successfulTasks: successful.length,
      failedTasks: failed.length,
      screenshotsGenerated: screenshotCount,
      finalUrl: finalUrl
    },
    phases: {
      'Phase 1': 'Homepage Exploration - Initial navigation and full-page capture',
      'Phase 2': 'Navigation and Key Sections - Menu exploration and feature identification',
      'Phase 3': 'Authentication Flow - Login/signup process documentation',
      'Phase 4': 'Documentation and Getting Started - Help and onboarding content',
      'Phase 5': 'Deep Feature Exploration - Platform capabilities and demos',
      'Phase 6': 'Final Complete Capture - Comprehensive final screenshots'
    },
    screenshots: screenshots.map(s => ({
      filename: path.basename(s.screenshotPath || ''),
      description: s.data,
      path: s.screenshotPath
    })),
    taskResults: results.map(r => ({
      success: r.success,
      description: r.data,
      error: r.error,
      url: r.currentUrl,
      screenshotTaken: !!r.screenshotPath
    })),
    summary: {
      mainFeatures: 'To be extracted from exploration results',
      authenticationMethods: 'To be documented from authentication flow',
      keyWorkflows: 'To be identified from navigation patterns',
      technicalDetails: 'To be compiled from page analysis'
    }
  };
}

// Execute the exploration
comprehensiveSlashMLExploration()
  .then(report => {
    console.log('🎉 Exploration completed successfully!');
    console.log('📋 Summary:', JSON.stringify(report.exploration, null, 2));
  })
  .catch(error => {
    console.error('💥 Exploration failed:', error);
    process.exit(1);
  });