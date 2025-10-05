import { NextRequest, NextResponse } from 'next/server';
import { Stagehand } from '@browserbasehq/stagehand';

export async function POST(request: NextRequest) {
  let stagehand: Stagehand | null = null;

  try {
    const { url } = await request.json();
    const targetUrl = url || 'https://v1.slashml.com';

    console.log(`[Simple Test] Starting test for: ${targetUrl}`);

    // Initialize Stagehand with Browserbase
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY,
      enableStealth: true,
      headless: false
    });

    await stagehand.init();
    console.log('[Simple Test] Stagehand initialized successfully');

    // Navigate to the URL
    await stagehand.page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log(`[Simple Test] Navigated to ${targetUrl}`);

    // Try to get the session ID using the correct Browserbase SDK approach
    let sessionId: string | undefined;
    let liveViewUrl: string | undefined;
    let debugInfo: any = {};

    try {
      // Method 1: Check if we can access the Browserbase client directly
      const browserbaseClient = (stagehand as any).browserbaseClient;
      if (browserbaseClient) {
        console.log('[Simple Test] Found browserbaseClient');
        debugInfo.hasBrowserbaseClient = true;
      } else {
        console.log('[Simple Test] No browserbaseClient found');
        debugInfo.hasBrowserbaseClient = false;
      }

      // Method 2: Try to get session from browser context
      if (stagehand.context) {
        const pages = await stagehand.context.pages();
        if (pages.length > 0) {
          const page = pages[0];
          // Check if we can get session info from the browser
          const browserWSEndpoint = (stagehand as any).browser?.wsEndpoint?.();
          if (browserWSEndpoint) {
            console.log('[Simple Test] Browser WS Endpoint:', browserWSEndpoint);
            debugInfo.wsEndpoint = browserWSEndpoint;

            // Extract session ID from WebSocket URL
            const sessionMatch = browserWSEndpoint.match(/sessions\/([a-zA-Z0-9-]+)/);
            if (sessionMatch) {
              sessionId = sessionMatch[1];
              console.log('[Simple Test] Extracted session ID:', sessionId);
            }
          }
        }
      }

      // Method 3: Try to use Browserbase SDK directly if available
      if (sessionId) {
        try {
          // Import Browserbase SDK
          const { Browserbase } = await import('@browserbasehq/sdk');
          const bb = new Browserbase({
            apiKey: process.env.BROWSERBASE_API_KEY!
          });

          console.log('[Simple Test] Attempting to get live view URL for session:', sessionId);

          // Get live view URL using the correct SDK method
          const debugLinks = await bb.sessions.debug(sessionId);
          console.log('[Simple Test] Debug links:', debugLinks);

          liveViewUrl = debugLinks.debuggerFullscreenUrl;
          debugInfo.debugLinks = debugLinks;

        } catch (sdkError) {
          console.log('[Simple Test] SDK error:', sdkError);
          debugInfo.sdkError = sdkError instanceof Error ? sdkError.message : String(sdkError);

          // Fallback: construct URL manually if we have the session ID
          if (sessionId) {
            const orgId = process.env.BROWSERBASE_ORG_ID;
            const projectId = process.env.BROWSERBASE_PROJECT_ID;
            if (orgId && projectId) {
              liveViewUrl = `https://www.browserbase.com/orgs/${orgId}/${projectId}/sessions/${sessionId}`;
              debugInfo.fallbackUrl = true;
            }
          }
        }
      }

    } catch (error) {
      console.log('[Simple Test] Error getting session info:', error);
      debugInfo.extractionError = error instanceof Error ? error.message : String(error);
    }

    // Take a screenshot to verify it's working
    const screenshot = await stagehand.page.screenshot({
      fullPage: false,
      type: 'png'
    });
    const screenshotBase64 = screenshot.toString('base64');

    // Clean up
    await stagehand.close();

    const result = {
      success: true,
      sessionId,
      liveViewUrl,
      url: targetUrl,
      screenshotDataUrl: `data:image/png;base64,${screenshotBase64}`,
      debugInfo,
      timestamp: new Date().toISOString()
    };

    console.log('[Simple Test] Test completed successfully');
    console.log('[Simple Test] Session ID:', sessionId);
    console.log('[Simple Test] Live View URL:', liveViewUrl);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Simple Test] Test failed:', error);

    // Ensure stagehand is closed
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (closeError) {
        console.error('[Simple Test] Error closing stagehand:', closeError);
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}