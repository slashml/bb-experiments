import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { ScreenshotResult } from '../../../lib/types';

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

    // Navigate to the URL with more flexible loading strategy
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
    } catch (error) {
      // If domcontentloaded fails, try with load
      await page.goto(url, { 
        waitUntil: 'load',
        timeout: 45000 
      });
    }

    // Wait for any dynamic content to load
    await page.waitForTimeout(5000);

    // Try to wait for network to be idle, but don't fail if it times out
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Network might be busy, continue anyway
      console.log('Network not idle, proceeding with screenshot');
    }

    // Take a full page screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'png'
    });

    // Convert buffer to base64 for easy transmission
    const screenshotBase64 = screenshotBuffer.toString('base64');
    const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

    const result: ScreenshotResult = {
      url,
      screenshotUrl: screenshotDataUrl,
      timestamp: new Date().toISOString(),
      success: true
    };

    // Clean up
    await context.close();
    await browser.close();

    return NextResponse.json({
      success: true,
      screenshot: result
    });

  } catch (error) {
    console.error('Screenshot capture failed:', error);
    
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