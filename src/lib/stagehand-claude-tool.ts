import { tool } from '@anthropic-ai/claude-code';
import { z } from 'zod';
import { StagehandExplorer } from './stagehand-explorer';
import path from 'path';

// Global explorer instance to maintain state across tool calls
let globalExplorer: StagehandExplorer | null = null;
let globalSessionDir: string | null = null;

// Initialize Stagehand tool for Claude Code SDK
export const stagehandTool = tool(
  'stagehand_action',
  'Execute a single Stagehand action (navigate, act, screenshot, type, wait) and return results',
  {
    action: z.enum(['navigate', 'act', 'screenshot', 'wait', 'type', 'evaluate', 'initialize', 'close']),
    description: z.string().describe('Clear description of what this action does'),
    params: z.object({
      url: z.string().optional().describe('URL for navigate action'),
      instruction: z.string().optional().describe('Instruction for act action'),
      waitTime: z.number().optional().describe('Wait time in milliseconds'),
      filename: z.string().optional().describe('Filename for screenshot'),
      fullPage: z.boolean().optional().describe('Take full page screenshot (default: false)'),
      focusElement: z.string().optional().describe('CSS selector to focus screenshot around'),
      selector: z.string().optional().describe('CSS selector for type action'),
      text: z.string().optional().describe('Text to type'),
      code: z.string().optional().describe('JavaScript code to evaluate'),
      sessionDir: z.string().optional().describe('Session directory for initialize action')
    }).optional()
  },
  async (args) => {
    try {
      console.log(`[Stagehand Tool] Executing action: ${args.action}`);

      // Handle initialization
      if (args.action === 'initialize') {
        if (!args.params?.sessionDir) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ error: 'Session directory required for initialization', success: false }, null, 2)
            }],
            isError: true
          };
        }

        globalSessionDir = args.params.sessionDir;
        globalExplorer = new StagehandExplorer(globalSessionDir);
        await globalExplorer.initialize();

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              message: 'Stagehand initialized successfully',
              sessionDir: globalSessionDir,
              success: true
            }, null, 2)
          }],
          isError: false
        };
      }

      // Handle close
      if (args.action === 'close') {
        if (globalExplorer) {
          await globalExplorer.close();
          globalExplorer = null;
          globalSessionDir = null;
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              message: 'Stagehand closed successfully',
              success: true
            }, null, 2)
          }],
          isError: false
        };
      }

      // Check if explorer is initialized
      if (!globalExplorer) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Stagehand not initialized. Use action: "initialize" first.',
              success: false
            }, null, 2)
          }],
          isError: true
        };
      }

      // Create task for the explorer
      const task = {
        action: args.action,
        description: args.description,
        params: args.params || {}
      };

      // Execute the task
      const result = await globalExplorer.executeTasks([task]);
      const taskResult = result[0];

      // If screenshot was taken, include the path for Claude to analyze
      if (taskResult.screenshotPath) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              ...taskResult,
              screenshotPath: taskResult.screenshotPath,
              message: `Action completed: ${args.description}`,
              currentUrl: taskResult.currentUrl,
              nextStepPrompt: `Screenshot saved at ${taskResult.screenshotPath}. Analyze this image to determine the next exploration step.`
            }, null, 2)
          }],
          isError: false
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            ...taskResult,
            message: `Action completed: ${args.description}`,
            currentUrl: taskResult.currentUrl
          }, null, 2)
        }],
        isError: !taskResult.success
      };

    } catch (error) {
      console.error(`[Stagehand Tool] Error: ${error}`);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            success: false
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Export the tool for use in Claude Code SDK
export const stagehandTools = [stagehandTool];