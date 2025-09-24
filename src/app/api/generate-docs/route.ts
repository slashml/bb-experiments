import { NextRequest, NextResponse } from 'next/server';
import { Stagehand } from '@browserbasehq/stagehand';
import {
  HomepageDataSchema,
  AuthFlowDataSchema,
  FeatureDataSchema,
  SessionProgress,
  TaskProgress,
  CompleteDocumentation
} from '../../../lib/schemas';
import { sessionStore } from '../../../lib/session-store';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  let stagehand: Stagehand | null = null;

  try {
    const { platformName, platformUrl } = await request.json();

    if (!platformName || !platformUrl) {
      return NextResponse.json({
        success: false,
        error: 'Platform name and URL are required'
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(platformUrl);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format'
      }, { status: 400 });
    }

    console.log(`[SaaS Docs] Starting documentation generation for: ${platformName} (${platformUrl})`);

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Initialize session progress
    const sessionProgress: SessionProgress = {
      sessionId,
      platformName,
      platformUrl,
      status: 'initializing',
      tasks: [
        {
          taskId: 'homepage',
          taskName: 'Homepage Analysis',
          status: 'pending',
          progress: 0,
          screenshots: [],
          startTime: new Date().toISOString()
        },
        {
          taskId: 'auth',
          taskName: 'Authentication Flow Discovery',
          status: 'pending',
          progress: 0,
          screenshots: [],
          startTime: new Date().toISOString()
        },
        {
          taskId: 'features',
          taskName: 'Feature Exploration',
          status: 'pending',
          progress: 0,
          screenshots: [],
          startTime: new Date().toISOString()
        }
      ],
      overallProgress: 0,
      startTime: new Date().toISOString()
    };

    sessionStore.setSession(sessionId, sessionProgress);

    // Start background processing
    processDocumentationGeneration(sessionId, platformName, platformUrl);

    return NextResponse.json({
      success: true,
      sessionId
    });

  } catch (error) {
    console.error('[SaaS Docs] Failed to start documentation generation:', error);

    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The page took too long to load.';
        statusCode = 408;
      } else if (error.message.includes('402')) {
        errorMessage = 'Browserbase account limit reached. Please upgrade your plan.';
        statusCode = 402;
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Unauthorized. Please check your Browserbase API credentials.';
        statusCode = 401;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}

async function processDocumentationGeneration(sessionId: string, platformName: string, platformUrl: string) {
  let stagehand: Stagehand | null = null;

  try {
    // Update session to running
    const session = sessionStore.getSession(sessionId)!;
    session.status = 'running';
    sessionStore.setSession(sessionId, session);

    console.log(`[SaaS Docs] ${sessionId}: Initializing Stagehand...`);

    // Initialize Stagehand with Browserbase
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY,
      enableStealth: true,
      headless: false, // Keep visible for demo
      modelName: "gpt-4o"
    });

    await stagehand.init();
    console.log(`[SaaS Docs] ${sessionId}: Stagehand initialized successfully`);

    // Get live view URL
    const liveViewUrl = `https://www.browserbase.com/sessions/${(stagehand as any).sessionId}`;
    session.liveViewUrl = liveViewUrl;
    sessionStore.setSession(sessionId, session);

    // Task 1: Homepage Analysis
    const homepageData = await analyzeHomepage(stagehand, sessionId, platformUrl);

    // Task 2: Authentication Flow Discovery
    const authData = await exploreAuthFlow(stagehand, sessionId, platformUrl);

    // Task 3: Feature Discovery
    const featureData = await discoverFeatures(stagehand, sessionId, platformUrl);

    // Generate comprehensive documentation
    const documentation = await generateCompleteDocumentation(
      sessionId,
      platformName,
      homepageData,
      authData,
      featureData,
      session
    );

    // Store documentation
    sessionStore.setDocumentation(sessionId, documentation);

    // Update session to completed
    session.status = 'completed';
    session.overallProgress = 100;
    sessionStore.setSession(sessionId, session);

    console.log(`[SaaS Docs] ${sessionId}: Documentation generation completed successfully`);

  } catch (error) {
    console.error(`[SaaS Docs] ${sessionId}: Documentation generation failed:`, error);

    const session = sessionStore.getSession(sessionId);
    if (session) {
      session.status = 'failed';
      sessionStore.setSession(sessionId, session);
    }
  } finally {
    // Clean up Stagehand
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (closeError) {
        console.error(`[SaaS Docs] ${sessionId}: Error closing Stagehand:`, closeError);
      }
    }
  }
}

async function analyzeHomepage(stagehand: Stagehand, sessionId: string, url: string) {
  console.log(`[SaaS Docs] ${sessionId}: Starting homepage analysis...`);

  const session = sessionStore.getSession(sessionId)!;
  const homepageTask = session.tasks.find(t => t.taskId === 'homepage')!;

  homepageTask.status = 'in_progress';
  homepageTask.currentAction = 'Navigating to homepage...';
  homepageTask.progress = 10;
  session.currentTask = 'Homepage Analysis';
  session.overallProgress = 10;
  sessionStore.setSession(sessionId, session);

  try {
    // Navigate to homepage
    await stagehand.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    console.log(`[SaaS Docs] ${sessionId}: Navigated to ${url}`);

    // Take initial screenshot
    homepageTask.currentAction = 'Taking initial screenshot...';
    homepageTask.progress = 30;
    sessionStore.setSession(sessionId, session);

    const screenshotBuffer = await stagehand.page.screenshot({
      fullPage: false,
      type: 'png'
    });
    const screenshotBase64 = screenshotBuffer.toString('base64');
    const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;
    homepageTask.screenshots.push(screenshotDataUrl);

    // Use Stagehand to analyze homepage content
    homepageTask.currentAction = 'Analyzing homepage content with AI...';
    homepageTask.progress = 60;
    sessionStore.setSession(sessionId, session);

    console.log(`[SaaS Docs] ${sessionId}: Extracting homepage data...`);

    const homepageData = await stagehand.page.extract({
      instruction: `Extract comprehensive information about this SaaS platform's homepage. Focus on:
      - Platform name and main value proposition
      - Key features highlighted on the homepage
      - Pricing information if visible
      - Sign-up and authentication options
      - Target audience or use cases mentioned
      - Any customer testimonials visible`,
      schema: HomepageDataSchema
    });

    console.log(`[SaaS Docs] ${sessionId}: Homepage data extracted:`, homepageData);

    homepageTask.status = 'completed';
    homepageTask.progress = 100;
    homepageTask.endTime = new Date().toISOString();
    session.overallProgress = 33;
    sessionStore.setSession(sessionId, session);

    return homepageData;

  } catch (error) {
    console.error(`[SaaS Docs] ${sessionId}: Homepage analysis failed:`, error);
    homepageTask.status = 'error';
    homepageTask.error = error instanceof Error ? error.message : 'Unknown error';
    sessionStore.setSession(sessionId, session);

    // Return fallback data
    return {
      platformName: "Unknown Platform",
      valueProposition: "Could not extract value proposition",
      keyFeatures: [],
      pricingTiers: [],
      signupOptions: []
    };
  }
}

async function exploreAuthFlow(stagehand: Stagehand, sessionId: string, url: string) {
  console.log(`[SaaS Docs] ${sessionId}: Starting authentication flow exploration...`);

  const session = sessionStore.getSession(sessionId)!;
  const authTask = session.tasks.find(t => t.taskId === 'auth')!;

  authTask.status = 'in_progress';
  authTask.currentAction = 'Looking for sign-up/login options...';
  authTask.progress = 10;
  session.currentTask = 'Authentication Flow Discovery';
  session.overallProgress = 45;
  sessionStore.setSession(sessionId, session);

  try {
    // Look for sign-up or login buttons using Stagehand AI
    console.log(`[SaaS Docs] ${sessionId}: Using AI to find auth elements...`);

    authTask.currentAction = 'AI searching for authentication elements...';
    authTask.progress = 30;
    sessionStore.setSession(sessionId, session);

    try {
      // Try to find and observe sign-up/login elements
      await stagehand.page.act('look for sign up, login, or get started buttons on this page');

      authTask.currentAction = 'Found auth elements, analyzing...';
      authTask.progress = 60;
      sessionStore.setSession(sessionId, session);

      // Take screenshot of current state
      const screenshotBuffer = await stagehand.page.screenshot({
        fullPage: false,
        type: 'png'
      });
      const screenshotBase64 = screenshotBuffer.toString('base64');
      const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;
      authTask.screenshots.push(screenshotDataUrl);

      // Extract auth flow information
      const authData = await stagehand.page.extract({
        instruction: `Analyze the authentication and sign-up options on this page. Look for:
        - Sign-up process steps and required fields
        - Available social login options (Google, GitHub, etc.)
        - Login methods available
        - Whether email verification is required
        - Two-factor authentication options
        - Forgot password functionality`,
        schema: AuthFlowDataSchema
      });

      console.log(`[SaaS Docs] ${sessionId}: Auth data extracted:`, authData);

      authTask.status = 'completed';
      authTask.progress = 100;
      authTask.endTime = new Date().toISOString();
      session.overallProgress = 66;
      sessionStore.setSession(sessionId, session);

      return authData;

    } catch (actError) {
      console.log(`[SaaS Docs] ${sessionId}: Could not find auth elements with AI, using fallback analysis`);

      // Fallback: analyze current page for auth information
      const authData = await stagehand.page.extract({
        instruction: `Analyze this page for any visible authentication-related information such as sign-up forms, login links, or auth options.`,
        schema: AuthFlowDataSchema
      });

      authTask.status = 'completed';
      authTask.progress = 100;
      authTask.endTime = new Date().toISOString();
      session.overallProgress = 66;
      sessionStore.setSession(sessionId, session);

      return authData;
    }

  } catch (error) {
    console.error(`[SaaS Docs] ${sessionId}: Auth flow exploration failed:`, error);
    authTask.status = 'error';
    authTask.error = error instanceof Error ? error.message : 'Unknown error';
    sessionStore.setSession(sessionId, session);

    // Return fallback data
    return {
      signupProcess: {
        steps: [],
        requiredFields: [],
        socialLogins: [],
        verificationRequired: false
      },
      loginProcess: {
        loginOptions: [],
        forgotPasswordFlow: false,
        twoFactorAuth: false
      }
    };
  }
}

async function discoverFeatures(stagehand: Stagehand, sessionId: string, url: string) {
  console.log(`[SaaS Docs] ${sessionId}: Starting feature discovery...`);

  const session = sessionStore.getSession(sessionId)!;
  const featureTask = session.tasks.find(t => t.taskId === 'features')!;

  featureTask.status = 'in_progress';
  featureTask.currentAction = 'Exploring navigation and features...';
  featureTask.progress = 10;
  session.currentTask = 'Feature Exploration';
  session.overallProgress = 78;
  sessionStore.setSession(sessionId, session);

  try {
    // Analyze navigation and main features
    featureTask.currentAction = 'AI analyzing page structure and navigation...';
    featureTask.progress = 40;
    sessionStore.setSession(sessionId, session);

    // Use Stagehand to explore the page structure
    await stagehand.page.act('scroll down slowly to see more content and features');

    // Take screenshot after scrolling
    const screenshotBuffer = await stagehand.page.screenshot({
      fullPage: false,
      type: 'png'
    });
    const screenshotBase64 = screenshotBuffer.toString('base64');
    const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;
    featureTask.screenshots.push(screenshotDataUrl);

    featureTask.currentAction = 'Extracting feature information...';
    featureTask.progress = 70;
    sessionStore.setSession(sessionId, session);

    const featureData = await stagehand.page.extract({
      instruction: `Analyze this SaaS platform's features and navigation. Extract:
      - Main navigation sections and menu items
      - Sidebar navigation if present
      - Core features and their descriptions
      - Any integrations mentioned
      - API access information
      - Mobile app availability
      - Footer links and additional features`,
      schema: FeatureDataSchema
    });

    console.log(`[SaaS Docs] ${sessionId}: Feature data extracted:`, featureData);

    // Take a full page screenshot
    const fullPageScreenshot = await stagehand.page.screenshot({
      fullPage: true,
      type: 'png'
    });
    const fullPageBase64 = fullPageScreenshot.toString('base64');
    const fullPageDataUrl = `data:image/png;base64,${fullPageBase64}`;
    featureTask.screenshots.push(fullPageDataUrl);

    featureTask.status = 'completed';
    featureTask.progress = 100;
    featureTask.endTime = new Date().toISOString();
    session.overallProgress = 90;
    sessionStore.setSession(sessionId, session);

    return featureData;

  } catch (error) {
    console.error(`[SaaS Docs] ${sessionId}: Feature discovery failed:`, error);
    featureTask.status = 'error';
    featureTask.error = error instanceof Error ? error.message : 'Unknown error';
    sessionStore.setSession(sessionId, session);

    // Return fallback data
    return {
      navigation: {
        mainSections: [],
        sidebar: [],
        footer: []
      },
      coreFeatures: [],
      integrations: [],
      apiAccess: false,
      mobileApp: false
    };
  }
}

async function generateCompleteDocumentation(
  sessionId: string,
  platformName: string,
  homepageData: any,
  authData: any,
  featureData: any,
  session: SessionProgress
): Promise<CompleteDocumentation> {

  console.log(`[SaaS Docs] ${sessionId}: Generating complete documentation...`);

  const sections = [
    {
      title: `${platformName} Overview`,
      content: `# ${homepageData.platformName || platformName}

${homepageData.valueProposition || 'Modern SaaS platform with comprehensive features.'}

## Key Features
${homepageData.keyFeatures.map((feature: string) => `- ${feature}`).join('\n')}

## Target Audience
${homepageData.targetAudience || 'Professional teams and individuals looking for efficient workflow solutions.'}

## Pricing
${homepageData.pricingTiers.length > 0
  ? homepageData.pricingTiers.map((tier: string) => `- ${tier}`).join('\n')
  : 'Pricing information available on the platform website.'}`,
      screenshots: session.tasks.find(t => t.taskId === 'homepage')?.screenshots || [],
      actionItems: [
        'Review feature set alignment with business needs',
        'Evaluate pricing tier suitability',
        'Consider integration requirements'
      ]
    },
    {
      title: 'Authentication & Access',
      content: `# Authentication Setup

## Sign-up Process
${authData.signupProcess.steps.length > 0
  ? `Steps:\n${authData.signupProcess.steps.map((step: string) => `1. ${step}`).join('\n')}`
  : 'Standard sign-up process available.'}

## Required Information
${authData.signupProcess.requiredFields.length > 0
  ? authData.signupProcess.requiredFields.map((field: string) => `- ${field}`).join('\n')
  : '- Email address\n- Password'}

## Login Options
${authData.signupProcess.socialLogins.length > 0
  ? `Available social logins:\n${authData.signupProcess.socialLogins.map((login: string) => `- ${login}`).join('\n')}`
  : 'Email and password login'}

## Security Features
${authData.loginProcess.twoFactorAuth ? '- Two-factor authentication supported' : '- Standard password authentication'}
${authData.loginProcess.forgotPasswordFlow ? '\n- Password recovery available' : ''}
${authData.signupProcess.verificationRequired ? '\n- Email verification required' : ''}`,
      screenshots: session.tasks.find(t => t.taskId === 'auth')?.screenshots || [],
      actionItems: [
        'Set up authentication method',
        'Configure security settings',
        'Test login process'
      ]
    },
    {
      title: 'Features & Navigation',
      content: `# Platform Features

## Navigation Structure
${featureData.navigation.mainSections.length > 0
  ? `Main sections:\n${featureData.navigation.mainSections.map((section: string) => `- ${section}`).join('\n')}`
  : 'Intuitive navigation structure with main sections for core functionality.'}

${featureData.navigation.sidebar?.length
  ? `\n### Sidebar Navigation\n${featureData.navigation.sidebar.map((item: string) => `- ${item}`).join('\n')}`
  : ''}

## Core Features
${featureData.coreFeatures.length > 0
  ? featureData.coreFeatures.map((feature: any) =>
      `### ${feature.name}\n${feature.description}${feature.category ? ` (${feature.category})` : ''}`
    ).join('\n\n')
  : 'Comprehensive feature set designed for productivity and collaboration.'}

## Integrations
${featureData.integrations?.length
  ? featureData.integrations.map((integration: string) => `- ${integration}`).join('\n')
  : 'Various third-party integrations available.'}

## Additional Capabilities
${featureData.apiAccess ? '- API access available for developers' : ''}
${featureData.mobileApp ? '\n- Mobile applications available' : ''}`,
      screenshots: session.tasks.find(t => t.taskId === 'features')?.screenshots || [],
      actionItems: [
        'Explore core features relevant to use case',
        'Set up necessary integrations',
        'Customize navigation preferences'
      ]
    }
  ];

  const totalScreenshots = sections.reduce((total, section) => total + section.screenshots.length, 0);

  const documentation: CompleteDocumentation = {
    platformName: homepageData.platformName || platformName,
    generatedAt: new Date().toISOString(),
    sessionId,
    sections,
    summary: {
      totalScreenshots,
      keyInsights: [
        `${platformName} offers ${homepageData.keyFeatures.length || 'multiple'} key features for users`,
        `Authentication supports ${authData.signupProcess.socialLogins.length || 'standard'} login methods`,
        `Platform includes ${featureData.coreFeatures.length || 'several'} core features`,
        authData.loginProcess.twoFactorAuth ? 'Two-factor authentication available for enhanced security' : 'Standard security measures in place',
        featureData.apiAccess ? 'API access available for custom integrations' : 'Web-based interface for primary usage'
      ],
      recommendedNextSteps: [
        'Create account and complete onboarding process',
        'Explore key features relevant to your use case',
        'Configure integrations with existing tools',
        'Set up team access and permissions if applicable',
        'Review documentation and support resources'
      ]
    }
  };

  return documentation;
}

// Helper function to get session progress
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const session = sessionStore.getSession(sessionId);
  const documentation = sessionStore.getDocumentation(sessionId);

  return NextResponse.json({
    session,
    documentation
  });
}