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

    console.log(`[Stagehand] Starting exploration for: ${url}`);

    // Initialize Stagehand with Browserbase
    stagehand = new Stagehand({
      env: "BROWSERBASE", // Use Browserbase environment
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY, // For AI features
      enableStealth: true,
      headless: false // Keep browser visible for user interactions
    });

    await stagehand.init();
    console.log('[Stagehand] Successfully initialized');

    // Navigate to the URL
    await stagehand.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    console.log(`[Stagehand] Navigated to ${url}`);

    // Wait for page to stabilize
    await stagehand.page.waitForTimeout(3000);

    const screenshots: ScreenshotResult[] = [];

    // Take initial screenshot using Stagehand's page
    console.log('[Stagehand] Taking initial screenshot...');
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
      description: 'Stagehand initial capture - Landing page view'
    });

    // Check for authentication elements first
    let signInDetected = false;
    let authenticationCompleted = false;
    const postAuthScreenshots: ScreenshotResult[] = [];

    console.log('[Stagehand] Checking for authentication elements...');
    try {
      // Use AI to detect login/signin elements
      await stagehand.page.act('find and click the sign in, login, or get started button');
      signInDetected = true;
      console.log('[Stagehand] AI found and clicked authentication element');

      // Wait for authentication page to load
      await stagehand.page.waitForTimeout(3000);

      // Take screenshot of auth page
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
        description: 'Authentication page - Please complete login manually'
      });

      // Wait for user authentication
      console.log('[Stagehand] Waiting for user to complete authentication...');
      const authResult = await waitForAuthentication(stagehand);

      if (authResult.success) {
        authenticationCompleted = true;
        console.log(`[Stagehand] Authentication completed! Current URL: ${stagehand.page.url()}`);

        // Capture authenticated content
        await captureAuthenticatedContent(stagehand, postAuthScreenshots);
      } else {
        console.log('[Stagehand] Authentication timed out, continuing with public content...');
      }

    } catch (authError) {
      console.log('[Stagehand] No authentication elements found or auth failed, continuing with public exploration:', authError);
    }

    // Use Stagehand's observe method to understand the page
    console.log('[Stagehand] Using AI to observe page elements...');
    try {
      const pageObservation = await stagehand.page.act('scroll down slowly to see more content');
      console.log('[Stagehand] Page observation completed');

      // Take screenshot after AI scroll
      await stagehand.page.waitForTimeout(2000);
      screenshotBuffer = await stagehand.page.screenshot({
        fullPage: false,
        type: 'png'
      });
      screenshotBase64 = screenshotBuffer.toString('base64');
      screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

      screenshots.push({
        url,
        screenshotUrl: screenshotDataUrl,
        timestamp: new Date().toISOString(),
        success: true,
        scrollPosition: 1,
        description: 'Stagehand AI-guided scroll - Content after scrolling'
      });
    } catch (error) {
      console.log('[Stagehand] AI observation failed, continuing with manual approach:', error);
    }

    // Use Stagehand to extract page information
    console.log('[Stagehand] Extracting page structure...');
    try {
      const pageData = await stagehand.page.extract('Extract the main content areas, navigation, and important sections of this webpage');
      console.log('[Stagehand] Page data extracted:', pageData);

      // Take a few more intelligent screenshots based on page structure
      const scrollPositions = [0.3, 0.6, 0.9];
      const totalHeight = await stagehand.page.evaluate(() => document.body.scrollHeight);

      for (let i = 0; i < scrollPositions.length; i++) {
        const scrollY = Math.floor(totalHeight * scrollPositions[i]);

        await stagehand.page.evaluate((y) => {
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, scrollY);

        await stagehand.page.waitForTimeout(2000);

        screenshotBuffer = await stagehand.page.screenshot({
          fullPage: false,
          type: 'png'
        });
        screenshotBase64 = screenshotBuffer.toString('base64');
        screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

        screenshots.push({
          url,
          screenshotUrl: screenshotDataUrl,
          timestamp: new Date().toISOString(),
          success: true,
          scrollPosition: scrollY,
          description: `Stagehand intelligent section ${i + 2} - ${Math.round(scrollPositions[i] * 100)}% down page`
        });
      }

    } catch (error) {
      console.log('[Stagehand] Page extraction failed:', error);
    }

    // Take final full-page screenshot
    console.log('[Stagehand] Taking full-page screenshot...');
    const fullPageScreenshot = await stagehand.page.screenshot({
      fullPage: true,
      type: 'png'
    });
    const fullPageBase64 = fullPageScreenshot.toString('base64');
    const fullPageDataUrl = `data:image/png;base64,${fullPageBase64}`;

    screenshots.push({
      url,
      screenshotUrl: fullPageDataUrl,
      timestamp: new Date().toISOString(),
      success: true,
      scrollPosition: -1,
      description: 'Stagehand complete page capture - Full page overview'
    });

    const result: ExplorationResult = {
      url,
      screenshots,
      timestamp: new Date().toISOString(),
      success: true,
      signInDetected,
      authenticationCompleted,
      postAuthScreenshots,
      liveViewUrl: stagehand.page.url()
    };

    console.log(`[Stagehand] Exploration completed with ${screenshots.length} screenshots`);

    // Clean up
    await stagehand.close();

    return NextResponse.json({
      success: true,
      exploration: result,
      method: 'stagehand'
    });

  } catch (error) {
    console.error('[Stagehand] Exploration failed:', error);

    // Ensure stagehand is closed
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (closeError) {
        console.error('[Stagehand] Error closing stagehand:', closeError);
      }
    }

    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The page took too long to load.';
        statusCode = 408;
      } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Could not resolve domain. Please check the URL.';
        statusCode = 404;
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
      method: 'stagehand'
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
        console.log('[Stagehand] Authentication success detected');
        return { success: true, finalUrl: currentUrl };
      }

      // Wait before next check
      await stagehand.page.waitForTimeout(5000);

    } catch (error) {
      console.log('[Stagehand] Error during authentication wait:', error);
      await stagehand.page.waitForTimeout(5000);
    }
  }

  return { success: false, error: 'Authentication timeout' };
}

async function captureAuthenticatedContent(stagehand: Stagehand, postAuthScreenshots: ScreenshotResult[]) {
  const currentUrl = stagehand.page.url();

  // Take initial authenticated screenshot
  console.log('[Stagehand] Capturing authenticated content...');
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
    description: '🔐 Authenticated dashboard - Main view after login'
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
      description: '🔐 Authenticated content - AI-guided scroll view'
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
      description: '🔐 Complete authenticated page - Full authenticated view'
    });

  } catch (error) {
    console.log('[Stagehand] Error capturing additional authenticated content:', error);
  }
}