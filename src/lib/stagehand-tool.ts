import { Stagehand } from '@browserbasehq/stagehand';
import { tool } from '@anthropic-ai/claude-code';
import { z } from 'zod';

// Define the tool for browsing websites with Stagehand
export const stagehandBrowseTool = tool(
  'stagehand_browse',
  'Browse a website using Stagehand to extract information for documentation',
  {
    url: z.string().describe('The URL to browse and analyze'),
    task: z.string().describe('What information to extract (e.g., "extract main features", "find getting started info")')
  },
  async (args) => {
    let stagehand: Stagehand | null = null;

    try {
      // Initialize Stagehand
      stagehand = new Stagehand({
        env: "BROWSERBASE",
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        modelApiKey: process.env.OPENAI_API_KEY,
        enableStealth: true,
        headless: true
      });

      await stagehand.init();
      console.log(`[Stagehand Tool] Initialized successfully`);

      // Navigate to the URL
      await stagehand.page.goto(args.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      console.log(`[Stagehand Tool] Navigated to ${args.url}`);

      // Wait for page to stabilize
      await stagehand.page.waitForTimeout(3000);

      // Use Stagehand to extract information based on the task
      const extractedData = await stagehand.page.extract({
        instruction: `${args.task}. Extract comprehensive information about this website including:
        - Main purpose/description of the application
        - Key features and capabilities
        - Getting started information
        - How to use the platform
        - Any pricing or signup information
        - Technical details if available

        Return structured information that would be useful for creating documentation.`,
        schema: z.object({
          name: z.string().describe('Application or service name'),
          description: z.string().describe('What this application/service does'),
          mainFeatures: z.array(z.string()).describe('Key features and capabilities'),
          gettingStarted: z.string().describe('How users can get started'),
          usageInstructions: z.array(z.string()).describe('Step-by-step usage instructions'),
          technicalDetails: z.string().optional().describe('Technical information if available'),
          pricingInfo: z.string().optional().describe('Pricing or subscription information'),
          additionalInfo: z.string().optional().describe('Any other relevant information')
        })
      });

      console.log(`[Stagehand Tool] Successfully extracted data from ${args.url}`);

      // Take a screenshot for reference
      const screenshot = await stagehand.page.screenshot({
        fullPage: false,
        type: 'png'
      });

      await stagehand.close();

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            url: args.url,
            extractedData,
            screenshotTaken: true,
            success: true
          }, null, 2)
        }],
        isError: false
      };

    } catch (error) {
      console.error(`[Stagehand Tool] Error: ${error}`);

      if (stagehand) {
        try {
          await stagehand.close();
        } catch (closeError) {
          console.error(`[Stagehand Tool] Error closing: ${closeError}`);
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            url: args.url,
            error: error instanceof Error ? error.message : String(error),
            success: false
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);