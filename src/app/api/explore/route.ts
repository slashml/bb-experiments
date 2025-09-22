import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { ExplorationResult, ScreenshotResult } from '../../../lib/types';

export async function POST(request: NextRequest) {
  let browser;

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

    // Launch browser with Playwright
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true,
      bypassCSP: true
    });

    const page = await context.newPage();

    // Navigate to the URL
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } catch {
      await page.goto(url, {
        waitUntil: 'load',
        timeout: 45000
      });
    }

    // Wait for initial content to load
    await page.waitForTimeout(3000);

    // Try to wait for network to be idle
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      console.log('Network not idle, proceeding with exploration');
    }

    const screenshots: ScreenshotResult[] = [];

    // Get total page height for scroll calculations
    const totalHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });

    const viewportHeight = 1080;
    const scrollStep = Math.floor(viewportHeight * 0.8); // 80% overlap for continuity
    const totalSteps = Math.ceil(totalHeight / scrollStep);

    // Take initial screenshot at top
    let screenshotBuffer = await page.screenshot({
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
      description: 'Landing page - Top of page'
    });

    // Scroll and capture screenshots
    for (let step = 1; step < totalSteps; step++) {
      const scrollPosition = step * scrollStep;

      // Scroll to position
      await page.evaluate((position) => {
        window.scrollTo({ top: position, behavior: 'smooth' });
      }, scrollPosition);

      // Wait for scroll to complete and content to load
      await page.waitForTimeout(2000);

      // Wait for any dynamic content that might load on scroll
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch {
        // Continue if network isn't idle
      }

      // Take screenshot
      screenshotBuffer = await page.screenshot({
        fullPage: false,
        type: 'png'
      });
      screenshotBase64 = screenshotBuffer.toString('base64');
      screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

      // Generate description based on scroll position
      let description = '';
      if (step === 1) {
        description = 'Content section - After hero/header';
      } else if (step < totalSteps / 2) {
        description = `Content section ${step} - Upper page content`;
      } else if (step < totalSteps * 0.8) {
        description = `Content section ${step} - Middle page content`;
      } else {
        description = `Content section ${step} - Lower page content`;
      }

      // Check if we're at the bottom
      const isAtBottom = scrollPosition + viewportHeight >= totalHeight - 100;
      if (isAtBottom) {
        description += ' (Bottom of page)';
      }

      screenshots.push({
        url,
        screenshotUrl: screenshotDataUrl,
        timestamp: new Date().toISOString(),
        success: true,
        scrollPosition,
        description
      });

      // If we've reached the bottom, break early
      if (isAtBottom) {
        break;
      }
    }

    // Take a final full-page screenshot for context
    const fullPageScreenshot = await page.screenshot({
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
      scrollPosition: -1, // Special marker for full page
      description: 'Complete page overview - Full page screenshot'
    });

    const result: ExplorationResult = {
      url,
      screenshots,
      timestamp: new Date().toISOString(),
      success: true,
      totalScrollHeight: totalHeight
    };

    // Clean up
    await context.close();
    await browser.close();

    return NextResponse.json({
      success: true,
      exploration: result
    });

  } catch (error) {
    console.error('Exploration failed:', error);

    // Ensure browser is closed even if there's an error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific Playwright errors
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The page took too long to load.';
        statusCode = 408;
      } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Could not resolve domain. Please check the URL.';
        statusCode = 404;
      } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Connection refused. The server might be down.';
        statusCode = 503;
      } else if (error.message.includes('Target page, context or browser has been closed')) {
        errorMessage = 'Browser session was closed unexpectedly.';
        statusCode = 500;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}