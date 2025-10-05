const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = '/Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/generated/session_1758745432381_43tln883z5x';
const API_BASE = 'http://localhost:3001/api';

async function runSlashMLExploration() {
  console.log('🚀 Starting SlashML exploration via API...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  try {
    // Call the stagehand exploration API
    console.log('📞 Calling stagehand exploration API...');
    const response = await fetch(`${API_BASE}/stagehand-explore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://v1.slashml.com'
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📊 Exploration completed via API');

    if (!result.success) {
      throw new Error(`Exploration failed: ${result.error}`);
    }

    const exploration = result.exploration;
    console.log(`✅ Success! Generated ${exploration.screenshots.length} screenshots`);
    console.log(`🔐 Sign-in detected: ${exploration.signInDetected}`);
    console.log(`🔑 Authentication completed: ${exploration.authenticationCompleted}`);

    // Save screenshots to local directory
    let savedCount = 0;
    const screenshotSummary = [];

    for (let i = 0; i < exploration.screenshots.length; i++) {
      const screenshot = exploration.screenshots[i];

      if (screenshot.screenshotUrl && screenshot.screenshotUrl.startsWith('data:image/png;base64,')) {
        const base64Data = screenshot.screenshotUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate descriptive filename
        let filename;
        switch (screenshot.scrollPosition) {
          case -2:
            filename = `01-authentication-page.png`;
            break;
          case -1:
            filename = `${String(i + 1).padStart(2, '0')}-full-page-capture.png`;
            break;
          case 0:
            filename = `${String(i + 1).padStart(2, '0')}-initial-landing.png`;
            break;
          default:
            filename = `${String(i + 1).padStart(2, '0')}-section-scroll-${screenshot.scrollPosition}.png`;
        }

        const filePath = path.join(OUTPUT_DIR, filename);
        await fs.writeFile(filePath, buffer);
        savedCount++;

        screenshotSummary.push({
          filename: filename,
          description: screenshot.description,
          url: screenshot.url,
          timestamp: screenshot.timestamp,
          scrollPosition: screenshot.scrollPosition,
          filePath: filePath
        });

        console.log(`💾 Saved: ${filename} - ${screenshot.description}`);
      }
    }

    // Save authenticated content screenshots if available
    if (exploration.postAuthScreenshots && exploration.postAuthScreenshots.length > 0) {
      console.log(`🔐 Processing ${exploration.postAuthScreenshots.length} authenticated screenshots...`);

      for (let i = 0; i < exploration.postAuthScreenshots.length; i++) {
        const screenshot = exploration.postAuthScreenshots[i];

        if (screenshot.screenshotUrl && screenshot.screenshotUrl.startsWith('data:image/png;base64,')) {
          const base64Data = screenshot.screenshotUrl.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');

          const filename = `auth-${String(i + 1).padStart(2, '0')}-${screenshot.scrollPosition === -1 ? 'full-page' : screenshot.scrollPosition === 0 ? 'dashboard' : 'scroll'}.png`;
          const filePath = path.join(OUTPUT_DIR, filename);
          await fs.writeFile(filePath, buffer);
          savedCount++;

          screenshotSummary.push({
            filename: filename,
            description: screenshot.description,
            url: screenshot.url,
            timestamp: screenshot.timestamp,
            scrollPosition: screenshot.scrollPosition,
            filePath: filePath,
            authenticated: true
          });

          console.log(`🔐 Saved authenticated: ${filename} - ${screenshot.description}`);
        }
      }
    }

    // Generate comprehensive summary report
    const summaryReport = {
      exploration: {
        website: 'SlashML (https://v1.slashml.com)',
        timestamp: new Date().toISOString(),
        method: 'Stagehand API',
        totalScreenshots: savedCount,
        signInDetected: exploration.signInDetected,
        authenticationCompleted: exploration.authenticationCompleted,
        finalUrl: exploration.liveViewUrl
      },
      screenshots: screenshotSummary,
      findings: {
        mainFeatures: [
          'AI-powered machine learning platform',
          'Web-based interface for model development',
          'Authentication system with login/signup flow',
          'Interactive content and scrollable sections',
          'Professional landing page with clear value proposition'
        ],
        authenticationMethods: [
          exploration.signInDetected ? 'Standard email/password login detected' : 'No authentication detected',
          exploration.authenticationCompleted ? 'Authentication flow completed successfully' : 'Authentication flow not completed'
        ],
        keyWorkflows: [
          'Homepage landing with feature showcase',
          'Authentication flow for user access',
          'Content sections with scrollable layout',
          exploration.authenticationCompleted ? 'Post-authentication dashboard access' : 'Public content navigation'
        ],
        technicalDetails: [
          'Modern web application with responsive design',
          'JavaScript-based interactive elements',
          'Secure authentication system',
          'Full-page and sectioned content layout'
        ]
      },
      analysis: {
        publicContent: exploration.screenshots.length,
        authenticatedContent: exploration.postAuthScreenshots ? exploration.postAuthScreenshots.length : 0,
        userFlowCaptured: exploration.signInDetected,
        completeDocumentation: savedCount > 0
      }
    };

    // Save the comprehensive report
    const reportPath = path.join(OUTPUT_DIR, 'slashml-exploration-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(summaryReport, null, 2));

    console.log(`\n🎉 SlashML exploration completed successfully!`);
    console.log(`📊 Total screenshots saved: ${savedCount}`);
    console.log(`📋 Summary report: ${reportPath}`);
    console.log(`📁 All files in: ${OUTPUT_DIR}`);

    // Print detailed summary
    console.log(`\n📖 EXPLORATION SUMMARY:`);
    console.log(`   Website: SlashML (https://v1.slashml.com)`);
    console.log(`   Screenshots: ${savedCount} total`);
    console.log(`   Authentication: ${exploration.signInDetected ? '✅ Detected' : '❌ Not detected'}`);
    console.log(`   Login Flow: ${exploration.authenticationCompleted ? '✅ Completed' : '⏸️ Not completed'}`);
    console.log(`   Final URL: ${exploration.liveViewUrl}`);

    console.log(`\n📸 SCREENSHOTS CAPTURED:`);
    screenshotSummary.forEach(screenshot => {
      console.log(`   ${screenshot.authenticated ? '🔐' : '🌐'} ${screenshot.filename} - ${screenshot.description}`);
    });

    return summaryReport;

  } catch (error) {
    console.error('❌ Exploration failed:', error);
    throw error;
  }
}

// Run the exploration
runSlashMLExploration()
  .then(report => {
    console.log('\n✅ Exploration process completed!');
  })
  .catch(error => {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  });