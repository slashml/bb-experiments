import { Stagehand } from '@browserbasehq/stagehand';
import { promises as fs } from 'fs';
import path from 'path';

export interface StagehandTask {
  action: 'navigate' | 'act' | 'screenshot' | 'wait' | 'evaluate' | 'type';
  description: string;
  params?: {
    url?: string;
    instruction?: string;
    waitTime?: number;
    filename?: string;
    fullPage?: boolean;
    code?: string;
    focusElement?: string; // CSS selector for focused screenshots
    selector?: string; // CSS selector for typing action
    text?: string; // Text to type
  };
}

export interface StagehandResult {
  success: boolean;
  data?: any;
  screenshotPath?: string;
  error?: string;
  currentUrl?: string;
}

export class StagehandExplorer {
  private stagehand: Stagehand | null = null;
  private sessionDir: string;
  private screenshotCounter = 0;

  constructor(sessionDir: string) {
    this.sessionDir = sessionDir;
  }

  async initialize(): Promise<void> {
    this.stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelApiKey: process.env.OPENAI_API_KEY,
      enableStealth: true,
      headless: true
    });

    await this.stagehand.init();
    console.log('[StagehandExplorer] Initialized successfully');
  }

  async executeTasks(tasks: StagehandTask[]): Promise<StagehandResult[]> {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    const results: StagehandResult[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`[StagehandExplorer] Executing task ${i + 1}/${tasks.length}: ${task.description}`);

      try {
        const result = await this.executeTask(task);
        results.push(result);

        // If task failed, break the chain
        if (!result.success) {
          console.log(`[StagehandExplorer] Task failed, stopping execution: ${result.error}`);
          break;
        }

      } catch (error) {
        console.error(`[StagehandExplorer] Task error: ${error}`);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        break;
      }
    }

    return results;
  }

  private async executeTask(task: StagehandTask): Promise<StagehandResult> {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    const currentUrl = this.stagehand.page.url();

    switch (task.action) {
      case 'navigate':
        if (!task.params?.url) {
          return { success: false, error: 'URL required for navigate action' };
        }

        await this.stagehand.page.goto(task.params.url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });

        return {
          success: true,
          currentUrl: this.stagehand.page.url(),
          data: `Navigated to ${task.params.url}`
        };

      case 'act':
        if (!task.params?.instruction) {
          return { success: false, error: 'Instruction required for act action' };
        }

        try {
          const result = await this.stagehand.page.act(task.params.instruction);
          return {
            success: true,
            currentUrl: this.stagehand.page.url(),
            data: result
          };
        } catch (error) {
          // Don't fail completely on act errors, just log them
          console.log(`[StagehandExplorer] Act failed but continuing: ${error}`);
          return {
            success: true,
            currentUrl: this.stagehand.page.url(),
            data: `Action attempted: ${task.params.instruction}`
          };
        }

      case 'screenshot':
        this.screenshotCounter++;
        const filename = task.params?.filename || `step-${this.screenshotCounter}-screenshot.png`;
        const fullPage = task.params?.fullPage === true; // Default to false for focused screenshots
        const focusElement = task.params?.focusElement;

        let screenshotOptions: any = {
          type: 'png',
          fullPage
        };

        // If focusElement is specified, try to get element bounds and crop
        if (focusElement && !fullPage) {
          try {
            // Try multiple selectors from the focusElement string
            const selectors = focusElement.split(',').map(s => s.trim());
            let elementFound = false;

            for (const selector of selectors) {
              try {
                const elementHandle = await this.stagehand.page.$(selector);
                if (elementHandle) {
                  const boundingBox = await elementHandle.boundingBox();
                  if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
                    // Add padding around the element for context
                    const padding = 50;
                    const viewport = await this.stagehand.page.evaluate(() => ({
                      width: window.innerWidth,
                      height: window.innerHeight
                    }));

                    const clipX = Math.max(0, Math.floor(boundingBox.x - padding));
                    const clipY = Math.max(0, Math.floor(boundingBox.y - padding));
                    const clipWidth = Math.min(
                      Math.floor(boundingBox.width + (padding * 2)),
                      viewport.width - clipX
                    );
                    const clipHeight = Math.min(
                      Math.floor(boundingBox.height + (padding * 2)),
                      viewport.height - clipY
                    );

                    // Ensure minimum dimensions
                    if (clipWidth >= 100 && clipHeight >= 100) {
                      screenshotOptions.clip = {
                        x: clipX,
                        y: clipY,
                        width: clipWidth,
                        height: clipHeight
                      };
                      elementFound = true;
                      console.log(`[StagehandExplorer] Found element with selector: ${selector}`);
                      break;
                    }
                  }
                  await elementHandle.dispose();
                }
              } catch (selectorError) {
                // Continue to next selector
                continue;
              }
            }

            if (!elementFound) {
              console.log(`[StagehandExplorer] No valid element found with selectors: ${focusElement}, taking viewport screenshot`);
              screenshotOptions = { type: 'png', fullPage: false };
            }
          } catch (error) {
            console.log(`[StagehandExplorer] Error finding focus element, taking viewport screenshot: ${error}`);
            screenshotOptions = { type: 'png', fullPage: false };
          }
        } else if (!fullPage) {
          // Default to viewport screenshot for focused captures
          screenshotOptions = { type: 'png', fullPage: false };
        }

        const screenshot = await this.stagehand.page.screenshot(screenshotOptions);

        const screenshotPath = path.join(this.sessionDir, filename);
        await fs.writeFile(screenshotPath, screenshot);

        return {
          success: true,
          screenshotPath,
          currentUrl: this.stagehand.page.url(),
          data: `Screenshot saved: ${filename} (${fullPage ? 'full-page' : focusElement ? `focused on ${focusElement}` : 'viewport'})`
        };

      case 'wait':
        const waitTime = task.params?.waitTime || 3000;
        await this.stagehand.page.waitForTimeout(waitTime);

        return {
          success: true,
          currentUrl: this.stagehand.page.url(),
          data: `Waited ${waitTime}ms`
        };

      case 'evaluate':
        if (!task.params?.code) {
          return { success: false, error: 'Code required for evaluate action' };
        }

        const evalResult = await this.stagehand.page.evaluate(task.params.code);

        return {
          success: true,
          currentUrl: this.stagehand.page.url(),
          data: evalResult
        };

      case 'type':
        if (!task.params?.selector || !task.params?.text) {
          return { success: false, error: 'Selector and text required for type action' };
        }

        try {
          // Wait for the element to be visible
          await this.stagehand.page.waitForSelector(task.params.selector, { timeout: 10000 });

          // Focus on the element and type
          await this.stagehand.page.focus(task.params.selector);
          await this.stagehand.page.type(task.params.selector, task.params.text);

          return {
            success: true,
            currentUrl: this.stagehand.page.url(),
            data: `Typed "${task.params.text}" into ${task.params.selector}`
          };
        } catch (error) {
          console.log(`[StagehandExplorer] Type action failed: ${error}`);
          return {
            success: false,
            error: `Failed to type into ${task.params.selector}: ${error instanceof Error ? error.message : String(error)}`
          };
        }

      default:
        return { success: false, error: `Unknown action: ${task.action}` };
    }
  }

  async getCurrentUrl(): Promise<string> {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }
    return this.stagehand.page.url();
  }

  async takeScreenshot(filename: string = 'current-screenshot.png'): Promise<string> {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    const screenshot = await this.stagehand.page.screenshot({
      fullPage: true,
      type: 'png'
    });

    const screenshotPath = path.join(this.sessionDir, filename);
    await fs.writeFile(screenshotPath, screenshot);

    return screenshotPath;
  }

  async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      console.log('[StagehandExplorer] Closed successfully');
    }
  }
}