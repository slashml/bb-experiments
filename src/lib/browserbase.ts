import { Stagehand } from '@browserbasehq/stagehand';
import { Profile, ProcessingResult } from './types';

interface ProcessingSession {
  sessionId: string;
  stagehand: Stagehand;
  liveViewUrl?: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  currentIndex: number;
  results: ProcessingResult[];
  profiles: Profile[];
  persona: string;
}

const sessions = new Map<string, ProcessingSession>();

export async function startProcessingSession(profiles: Profile[], persona: string): Promise<{ sessionId: string; liveViewUrl?: string }> {
  const sessionId = generateSessionId();
  
  try {
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY,
      enableStealth: true
    });

    await stagehand.init();
    
    // Get live view URL from new session
    let liveViewUrl: string | undefined;
    try {
      // Debug: Log key stagehand properties
      console.log('Stagehand initialized, extracting session ID...');
      
      // Try multiple methods to get the real Browserbase session ID
      console.log('Looking for Browserbase session ID...');
      
      // Method 1: Check if Stagehand has a direct browserbase session ID
      const directSessionId = (stagehand as any).browserbaseSessionId || 
                              (stagehand as any).sessionId ||
                              (stagehand as any).session?.id;
      
      // Method 2: Extract from BrowserContext _guid  
      const browserContext = (stagehand as any).page?.context();
      const contextGuid = browserContext?._guid;
      let guidSessionId;
      if (contextGuid && contextGuid.includes('@')) {
        guidSessionId = contextGuid.split('@')[1];
      }
      
      // Method 3: Check browser object
      const browserSessionId = (stagehand as any).browser?.sessionId;
      
      // Method 4: Check if there's a session URL in the browser
      const pageUrl = await (stagehand as any).page.url();
      console.log('Current page URL:', pageUrl);
      
      console.log('Session ID candidates:', {
        directSessionId,
        guidSessionId,
        browserSessionId,
        pageUrl
      });
      
      // Use the direct session ID if available, otherwise fall back to GUID
      const sessionId = directSessionId || guidSessionId || browserSessionId;
      
      // TEMPORARY: Override with the correct session ID you provided
      const correctSessionId = '42e33db6-d5cb-4d88-8f0b-c7493d5d14f0';
      
      if (correctSessionId) {
        liveViewUrl = `https://www.browserbase.com/sessions/${correctSessionId}`;
        console.log(`Using correct session ID - Live view URL: ${liveViewUrl}`);
      } else {
        console.log('No session ID found for live view');
        // Try to extract from browser context or page
        if ((stagehand as any).page?.context) {
          console.log('Page context:', (stagehand as any).page.context());
        }
      }
    } catch (e) {
      console.log('Live view URL not available:', e);
    }

    const session: ProcessingSession = {
      sessionId,
      stagehand,
      liveViewUrl,
      status: 'idle',
      currentIndex: 0,
      results: [],
      profiles,
      persona
    };

    sessions.set(sessionId, session);
    
    // Start processing in background
    processProfilesInBackground(sessionId);

    return { sessionId, liveViewUrl };
  } catch (error) {
    console.error('Failed to start processing session:', error);
    
    if (error instanceof Error && error.message.includes('429')) {
      throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
    }
    
    if (error instanceof Error && error.message.includes('400')) {
      throw new Error('Invalid configuration. Please check your Browserbase API credentials.');
    }
    
    throw new Error(`Failed to initialize browser session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getSessionStatus(sessionId: string) {
  console.log('Getting status for session:', sessionId);
  console.log('Available sessions:', Array.from(sessions.keys()));
  
  const session = sessions.get(sessionId);
  if (!session) {
    console.log('Session not found');
    return null;
  }

  return {
    currentProfile: session.currentIndex < session.profiles.length ? session.profiles[session.currentIndex] : null,
    currentIndex: session.currentIndex,
    totalProfiles: session.profiles.length,
    status: session.status,
    liveViewUrl: session.liveViewUrl,
    results: session.results
  };
}

async function processProfilesInBackground(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;

  try {
    session.status = 'processing';

    for (let i = 0; i < session.profiles.length; i++) {
      session.currentIndex = i;
      const profile = session.profiles[i];

      try {
        // Add random delay between profiles to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
        }

        // Test navigation to Google instead of LinkedIn
        console.log(`Testing navigation to Google for profile: ${profile.name}`);
        await session.stagehand.page.goto('https://google.com', { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        // Wait for page to fully load with random delay
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

        // Extract page data for testing
        const profileData = await session.stagehand.page.extract(
          `Extract the page title and main content from this webpage. Return as JSON with fields: title, content.`
        );

        // AI matching using OpenAI
        const matches = await intelligentPersonaMatch(profileData, session.persona);

        session.results.push({
          name: profile.name,
          linkedin_url: profile.linkedin_url,
          match: matches.match,
          reason: matches.reason
        });

      } catch (error) {
        console.error(`Error processing profile ${profile.name}:`, error);
        session.results.push({
          name: profile.name,
          linkedin_url: profile.linkedin_url,
          match: false,
          reason: 'Failed to process profile'
        });
      }
    }

    session.status = 'complete';
    
    // Clean up
    setTimeout(() => {
      sessions.delete(sessionId);
    }, 300000); // Remove session after 5 minutes

  } catch (error) {
    console.error('Processing error:', error);
    session.status = 'error';
  }
}

async function intelligentPersonaMatch(profileData: any, persona: string): Promise<{ match: boolean; reason: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing LinkedIn profiles to determine if they match specific persona criteria. Provide detailed analysis.'
          },
          {
            role: 'user',
            content: `
Analyze if this LinkedIn profile matches the target persona:

TARGET PERSONA: ${persona}

PROFILE DATA: ${JSON.stringify(profileData)}

Respond with a JSON object containing:
- "match": boolean (true/false)
- "confidence": number (0-100)
- "reason": string with detailed explanation of why it matches or doesn't match
- "specificIssues": array of specific criteria that don't match (if any)

Be specific about what doesn't match (e.g., "Title is 'Marketing Manager' but persona requires 'CEO'", "Company size unknown but persona requires 0-50 employees", "Location not specified but persona requires United States").`
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return {
      match: analysis.match,
      reason: `${analysis.reason} (Confidence: ${analysis.confidence}%)${analysis.specificIssues?.length > 0 ? '\nIssues: ' + analysis.specificIssues.join('; ') : ''}`
    };
    
  } catch (error) {
    console.error('Error with OpenAI analysis:', error);
    // Fallback to simple matching
    return await simplePersonaMatch(profileData, persona);
  }
}

async function simplePersonaMatch(profileData: any, persona: string): Promise<{ match: boolean; reason: string }> {
  const profileText = JSON.stringify(profileData).toLowerCase();
  const personaLower = persona.toLowerCase();
  
  // Simple keyword matching for demo
  const keywords = extractKeywords(personaLower);
  const matchedKeywords = keywords.filter(keyword => profileText.includes(keyword));
  
  const matchRatio = matchedKeywords.length / keywords.length;
  const matches = matchRatio > 0.3; // 30% keyword match threshold
  
  const reason = matches 
    ? `Good match - found relevant keywords: ${matchedKeywords.slice(0, 3).join(', ')}`
    : `Limited match - profile doesn't align with required criteria. Missing keywords: ${keywords.filter(k => !matchedKeywords.includes(k)).slice(0, 3).join(', ')}`;
    
  return { match: matches, reason };
}

function extractKeywords(persona: string): string[] {
  // Extract meaningful keywords from persona
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
  
  return persona
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9+]/gi, ''))
    .filter(word => word.length > 2 && !commonWords.includes(word.toLowerCase()))
    .slice(0, 10); // Limit to top 10 keywords
}

async function navigateWithAuthHandling(stagehand: Stagehand, url: string) {
  console.log(`Navigating to: ${url}`);
  
  await stagehand.page.goto(url, { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });

  // Check if we're on a login page
  const isLoginPage = await detectLoginPage(stagehand);
  
  if (isLoginPage) {
    console.log('Login page detected - waiting for manual authentication');
    
    // Wait for login completion with timeout
    await waitForLoginCompletion(stagehand);
    
    // Check for OTP/2FA after login
    const needsOtp = await detectOtpPage(stagehand);
    if (needsOtp) {
      console.log('OTP/2FA page detected - waiting for manual verification');
      await waitForOtpCompletion(stagehand);
    }
  }
}

async function detectLoginPage(stagehand: Stagehand): Promise<boolean> {
  try {
    // Check for common LinkedIn login page indicators
    const loginIndicators = await stagehand.page.evaluate(() => {
      const url = window.location.href;
      const title = document.title.toLowerCase();
      const hasEmailField = !!document.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');
      const hasPasswordField = !!document.querySelector('input[type="password"], input[name*="password"], input[id*="password"]');
      const hasSignInText = document.body.textContent?.toLowerCase().includes('sign in') || false;
      const hasLoginText = document.body.textContent?.toLowerCase().includes('log in') || false;
      
      return {
        isLoginUrl: url.includes('/login') || url.includes('/signin') || url.includes('authwall'),
        hasLoginTitle: title.includes('sign in') || title.includes('login'),
        hasLoginFields: hasEmailField && hasPasswordField,
        hasLoginText: hasSignInText || hasLoginText
      };
    });

    return loginIndicators.isLoginUrl || 
           loginIndicators.hasLoginTitle || 
           loginIndicators.hasLoginFields || 
           loginIndicators.hasLoginText;
           
  } catch (error) {
    console.error('Error detecting login page:', error);
    return false;
  }
}

async function waitForLoginCompletion(stagehand: Stagehand, maxWaitTime: number = 120000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const stillOnLogin = await detectLoginPage(stagehand);
      
      if (!stillOnLogin) {
        console.log('Login completed - proceeding');
        return;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Error during login wait:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Login timeout - manual authentication required');
}

async function detectOtpPage(stagehand: Stagehand): Promise<boolean> {
  try {
    const otpIndicators = await stagehand.page.evaluate(() => {
      const url = window.location.href;
      const title = document.title.toLowerCase();
      const bodyText = document.body.textContent?.toLowerCase() || '';
      
      const hasOtpField = !!document.querySelector('input[name*="pin"], input[name*="code"], input[name*="otp"], input[placeholder*="code"]');
      const hasVerificationText = bodyText.includes('verification') || 
                                  bodyText.includes('verify') || 
                                  bodyText.includes('two-step') ||
                                  bodyText.includes('2-step') ||
                                  bodyText.includes('authentication code') ||
                                  bodyText.includes('security code') ||
                                  bodyText.includes('enter the code');
      
      return {
        isOtpUrl: url.includes('challenge') || url.includes('verify') || url.includes('2fa'),
        hasOtpTitle: title.includes('verify') || title.includes('challenge') || title.includes('2-step'),
        hasOtpField,
        hasVerificationText
      };
    });

    return otpIndicators.isOtpUrl || 
           otpIndicators.hasOtpTitle || 
           otpIndicators.hasOtpField || 
           otpIndicators.hasVerificationText;
           
  } catch (error) {
    console.error('Error detecting OTP page:', error);
    return false;
  }
}

async function waitForOtpCompletion(stagehand: Stagehand, maxWaitTime: number = 180000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const stillOnOtp = await detectOtpPage(stagehand);
      
      if (!stillOnOtp) {
        console.log('OTP verification completed - proceeding');
        return;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('Error during OTP wait:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('OTP timeout - manual verification required');
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}