import { NextRequest, NextResponse } from 'next/server';
import { Stagehand } from '@browserbasehq/stagehand';
import { ExplorationResult, ScreenshotResult } from '../../../lib/types';

export async function POST(request: NextRequest) {
  let stagehand: Stagehand | null = null;

  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'URL is required and must be a string'
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format'
      }, { status: 400 });
    }

    console.log(`[Stagehand Sign-In] Starting sign-in exploration for: ${url}`);

    // Initialize Stagehand with Browserbase (non-headless for user interaction)
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY,
      enableStealth: true,
      headless: false // Keep visible for user authentication
    });

    await stagehand.init();
    console.log('[Stagehand Sign-In] Successfully initialized');

    // Navigate to the URL
    await stagehand.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    console.log(`[Stagehand Sign-In] Navigated to ${url}`);

    // Wait for page to stabilize
    await stagehand.page.waitForTimeout(3000);

    const screenshots: ScreenshotResult[] = [];
    const postAuthScreenshots: ScreenshotResult[] = [];
    let signInDetected = false;
    let authenticationCompleted = false;

    // Take initial screenshot
    console.log('[Stagehand Sign-In] Taking initial screenshot...');
    let screenshotBuffer = await stagehand.page.screenshot({
      fullPage: false,
      type: 'png'
    });
    let screenshotBase64 = screenshotBuffer.toString('base64');
    let screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

    screenshots.push({
      url,
      screenshotUrl: screenshotDataUrl,
      timestamp: new Date().toISOString(),
      success: true,
      scrollPosition: 0,
      description: 'Stagehand initial view - Before sign-in detection'
    });

    // Use Stagehand's AI to observe and find sign-in elements
    console.log('[Stagehand Sign-In] Using AI to observe page for sign-in options...');
    try {
      const pageObservation = await stagehand.page.observe();
      console.log('[Stagehand Sign-In] Page observation completed');

      // Use Stagehand's AI to look for and click sign-in
      console.log('[Stagehand Sign-In] Attempting to find and click sign-in...');
      try {
        await stagehand.page.act('find and click the sign in or login button');
        signInDetected = true;
        console.log('[Stagehand Sign-In] AI successfully found and clicked sign-in');

        // Wait for navigation or login page to load
        await stagehand.page.waitForTimeout(3000);

        // Take screenshot after clicking sign-in
        screenshotBuffer = await stagehand.page.screenshot({
          fullPage: false,
          type: 'png'
        });
        screenshotBase64 = screenshotBuffer.toString('base64');
        screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

        screenshots.push({
          url: stagehand.page.url(),
          screenshotUrl: screenshotDataUrl,
          timestamp: new Date().toISOString(),
          success: true,
          scrollPosition: -2,
          description: 'Stagehand AI sign-in click - Login page after AI found sign-in'
        });

        // Wait for user authentication
        console.log('[Stagehand Sign-In] Waiting for user to complete authentication...');
        const authResult = await waitForAuthentication(stagehand);

        if (authResult.success) {
          authenticationCompleted = true;
          console.log(`[Stagehand Sign-In] Authentication completed! Current URL: ${stagehand.page.url()}`);

          // Wait for authenticated page to load
          await stagehand.page.waitForTimeout(5000);

          // Use Stagehand AI to capture authenticated content
          await captureAuthenticatedContent(stagehand, postAuthScreenshots);
        } else {
          console.log('[Stagehand Sign-In] Authentication timed out or failed');

          // Take final screenshot showing current state
          screenshotBuffer = await stagehand.page.screenshot({
            fullPage: false,
            type: 'png'
          });
          screenshotBase64 = screenshotBuffer.toString('base64');
          screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

          screenshots.push({
            url: stagehand.page.url(),
            screenshotUrl: screenshotDataUrl,
            timestamp: new Date().toISOString(),
            success: true,
            scrollPosition: -4,
            description: 'Stagehand authentication timeout - Current page state'
          });
        }

      } catch (signInError) {
        console.log('[Stagehand Sign-In] AI could not find sign-in element:', signInError);
        signInDetected = false;

        // Try manual fallback approach
        console.log('[Stagehand Sign-In] Trying manual sign-in detection...');
        const manualSignInFound = await tryManualSignInDetection(stagehand);

        if (manualSignInFound) {
          signInDetected = true;
        } else {
          // No sign-in found, proceed with regular exploration
          console.log('[Stagehand Sign-In] No sign-in detected, proceeding with regular exploration...');
          await performRegularExploration(stagehand, screenshots, url);
        }
      }

    } catch (observeError) {
      console.log('[Stagehand Sign-In] Page observation failed:', observeError);

      // Fallback to regular exploration
      await performRegularExploration(stagehand, screenshots, url);
    }

    // Get live view URL from Stagehand session
    let liveViewUrl: string | undefined;
    try {
      // Extract session ID from Stagehand for live view
      liveViewUrl = stagehand.page.url();
    } catch {
      liveViewUrl = url;
    }

    const result: ExplorationResult = {
      url,
      screenshots,
      timestamp: new Date().toISOString(),
      success: true,
      signInDetected,
      authenticationCompleted,
      postAuthScreenshots,
      liveViewUrl
    };

    console.log(`[Stagehand Sign-In] Exploration completed - Sign-in: ${signInDetected}, Auth: ${authenticationCompleted}`);

    // Clean up
    await stagehand.close();

    return NextResponse.json({
      success: true,
      exploration: result,
      method: 'stagehand-signin'
    });

  } catch (error) {
    console.error('[Stagehand Sign-In] Exploration failed:', error);

    // Ensure stagehand is closed
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (closeError) {
        console.error('[Stagehand Sign-In] Error closing stagehand:', closeError);
      }
    }

    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The page took too long to load.';
        statusCode = 408;
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait before trying again.';
        statusCode = 429;
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Unauthorized. Please check your Browserbase API credentials.';
        statusCode = 401;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      method: 'stagehand-signin'
    }, { status: statusCode });
  }
}

async function waitForAuthentication(stagehand: Stagehand, maxWaitTime: number = 300000) {
  const startTime = Date.now();
  const initialUrl = stagehand.page.url();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const currentUrl = stagehand.page.url();

      // Check if we're no longer on a login page
      const isStillOnLogin = await stagehand.page.evaluate(() => {
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const bodyText = document.body.textContent?.toLowerCase() || '';

        const isLoginPage = url.includes('login') || url.includes('signin') || url.includes('auth') ||
                           title.includes('login') || title.includes('sign in') ||
                           bodyText.includes('enter your password') || bodyText.includes('sign in');

        return isLoginPage;
      });

      // Check for authentication success indicators
      const authSuccess = await stagehand.page.evaluate(() => {
        const url = window.location.href.toLowerCase();
        const bodyText = document.body.textContent?.toLowerCase() || '';

        return url.includes('dashboard') || url.includes('/app') || url.includes('/home') ||
               bodyText.includes('welcome') || bodyText.includes('dashboard') ||
               !!document.querySelector('a[href*="logout"], .logout, [data-testid*="logout"]');
      });

      if (!isStillOnLogin && (currentUrl !== initialUrl || authSuccess)) {
        console.log('[Stagehand Sign-In] Authentication success detected');
        return { success: true, finalUrl: currentUrl };
      }

      // Wait before next check
      await stagehand.page.waitForTimeout(5000);

    } catch (error) {
      console.log('[Stagehand Sign-In] Error during authentication wait:', error);
      await stagehand.page.waitForTimeout(5000);
    }
  }

  return { success: false, error: 'Authentication timeout' };
}

async function captureAuthenticatedContent(stagehand: Stagehand, postAuthScreenshots: ScreenshotResult[]) {
  const currentUrl = stagehand.page.url();

  // Take initial authenticated screenshot
  console.log('[Stagehand Sign-In] Capturing authenticated content...');
  let screenshotBuffer = await stagehand.page.screenshot({
    fullPage: false,
    type: 'png'
  });
  let screenshotBase64 = screenshotBuffer.toString('base64');
  let screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

  postAuthScreenshots.push({
    url: currentUrl,
    screenshotUrl: screenshotDataUrl,
    timestamp: new Date().toISOString(),
    success: true,
    scrollPosition: 0,
    description: '🔐 Stagehand authenticated dashboard - Main view after login'
  });

  // Use Stagehand AI to explore authenticated content
  try {
    await stagehand.page.act('scroll down to see more content');
    await stagehand.page.waitForTimeout(3000);

    screenshotBuffer = await stagehand.page.screenshot({
      fullPage: false,
      type: 'png'
    });
    screenshotBase64 = screenshotBuffer.toString('base64');
    screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

    postAuthScreenshots.push({
      url: currentUrl,
      screenshotUrl: screenshotDataUrl,
      timestamp: new Date().toISOString(),
      success: true,
      scrollPosition: 1,
      description: '🔐 Stagehand authenticated content - AI-guided scroll view'
    });

    // Take full page authenticated screenshot
    const fullPageScreenshot = await stagehand.page.screenshot({
      fullPage: true,
      type: 'png'
    });
    const fullPageBase64 = fullPageScreenshot.toString('base64');
    const fullPageDataUrl = `data:image/png;base64,${fullPageBase64}`;

    postAuthScreenshots.push({
      url: currentUrl,
      screenshotUrl: fullPageDataUrl,
      timestamp: new Date().toISOString(),
      success: true,
      scrollPosition: -1,
      description: '🔐 Stagehand complete authenticated page - Full authenticated view'
    });

  } catch (error) {
    console.log('[Stagehand Sign-In] Error capturing additional authenticated content:', error);
  }
}

async function tryManualSignInDetection(stagehand: Stagehand): Promise<boolean> {
  try {
    // Simple manual detection as fallback
    const signInExists = await stagehand.page.evaluate(() => {
      const selectors = [
        'a[href*="login"], a[href*="signin"], a[href*="sign-in"]',
        'button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")',
        '.signin, .login, .sign-in'
      ];

      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            (element as HTMLElement).click();
            return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    });

    if (signInExists) {
      await stagehand.page.waitForTimeout(3000);
      return true;
    }

    return false;
  } catch (error) {
    console.log('[Stagehand Sign-In] Manual sign-in detection failed:', error);
    return false;
  }
}

async function performRegularExploration(stagehand: Stagehand, screenshots: ScreenshotResult[], originalUrl: string) {
  try {
    // Take a few scrolled screenshots
    const totalHeight = await stagehand.page.evaluate(() => document.body.scrollHeight);
    const scrollPositions = [0.3, 0.6, 0.9];

    for (let i = 0; i < scrollPositions.length; i++) {
      const scrollY = Math.floor(totalHeight * scrollPositions[i]);

      await stagehand.page.evaluate((y) => {
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, scrollY);

      await stagehand.page.waitForTimeout(2000);

      const screenshotBuffer = await stagehand.page.screenshot({
        fullPage: false,
        type: 'png'
      });
      const screenshotBase64 = screenshotBuffer.toString('base64');
      const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

      screenshots.push({
        url: originalUrl,
        screenshotUrl: screenshotDataUrl,
        timestamp: new Date().toISOString(),
        success: true,
        scrollPosition: scrollY,
        description: `Stagehand regular exploration - Section ${i + 2} (${Math.round(scrollPositions[i] * 100)}% down)`
      });
    }

    // Full page screenshot
    const fullPageScreenshot = await stagehand.page.screenshot({
      fullPage: true,
      type: 'png'
    });
    const fullPageBase64 = fullPageScreenshot.toString('base64');
    const fullPageDataUrl = `data:image/png;base64,${fullPageBase64}`;

    screenshots.push({
      url: originalUrl,
      screenshotUrl: fullPageDataUrl,
      timestamp: new Date().toISOString(),
      success: true,
      scrollPosition: -1,
      description: 'Stagehand complete page - Full page overview'
    });

  } catch (error) {
    console.log('[Stagehand Sign-In] Error in regular exploration:', error);
  }
}