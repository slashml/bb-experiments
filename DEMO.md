# SaaS Documentation Generator Demo

## Overview
This project demonstrates an AI-powered documentation generator that uses the Claude Code SDK to interactively explore websites and generate comprehensive Mintlify documentation. The system combines web automation, AI analysis, and structured documentation generation.

## API Endpoint: `/api/docs-agent`

### Architecture Overview
The system creates an AI-powered documentation agent that uses the Claude Code SDK to interactively explore websites and generate comprehensive Mintlify documentation.

### POST Request Flow

#### 1. Request Input (`src/app/api/docs-agent/route.ts` lines 4-6)
```typescript
const { prompt, sessionId, websiteData } = await request.json();
```
- **`prompt`**: User instruction for what kind of documentation to generate
- **`sessionId`**: Optional session identifier (auto-generated if not provided)
- **`websiteData`**: Contains the target website URL and metadata

#### 2. DocsAgent Creation (`route.ts` line 23)
```typescript
const agent = await DocsAgent.create(finalSessionId, websiteData);
```
Creates a new `DocsAgent` instance with:
- **Template path**: `docs/template-example/trysolid-docs` (Mintlify template)
- **Output path**: `docs/generated/{sessionId}` (where docs will be saved)

## DocsAgent Class Architecture (`src/lib/docs-agent.ts`)

### Core Components

#### 1. Minimal Website Exploration (lines 40-55)
- Uses Stagehand to capture 3-4 key screenshots
- Focuses on homepage, login page, and main features
- Falls back to mock data if exploration fails

#### 2. Claude Code SDK Integration (lines 57-108)
The heart of the system - a comprehensive 150+ line prompt that instructs Claude exactly how to generate docs.

### The Master Prompt (lines 58-108)
This is the critical component that ensures accurate documentation generation:

```typescript
const claudePrompt = `${prompt}

IMPORTANT: Create documentation ONLY based on what you can actually see in the exploration screenshots.

## CRITICAL RULES:
- DO NOT create fake or generic content
- DO NOT make assumptions about features not visible in screenshots
- USE ONLY information visible in the captured images
- If no screenshots captured, create minimal documentation stating "Screenshots not available"

## Required Files:
1. **mint.json** - Basic configuration
2. **favicon.svg** - Copy from template
3. **getting-started.mdx** - Based ONLY on visible homepage content. MUST include the hero section image (01-homepage-hero.png) at the top of the getting started guide
4. **features.mdx** - Based ONLY on features visible in screenshots
5. **pricing.mdx** - Based ONLY on pricing info visible in screenshots
6. **authentication.mdx** - Based ONLY on login elements visible in screenshots

## Instructions:

**STEP 1: Copy favicon.svg** from template: /Users/faizank/workspace/experiments/live_projects/slashml/active/codegen/bb-experiment/docs/template-example/trysolid-docs/favicon.svg

**STEP 2: Analyze Screenshots First**
- Read each screenshot file to understand what's actually visible
- Extract only the information you can see
- Do NOT make up features, pricing, or processes

**STEP 3: Create Documentation Based on Visual Evidence**
- **getting-started.mdx**: Use ONLY the homepage content visible in screenshots. MUST include hero section image with markdown:

"<img src="/images/01-homepage-hero.png" alt="Homepage Hero Section" />"

- **features.mdx**: Document ONLY features you can see in the images
- **pricing.mdx**: Include ONLY pricing information visible in screenshots
- **authentication.mdx**: Document ONLY login/signup elements you can see

**STEP 4: Handle Missing Information**
- If login page not captured: State "Login process screenshots not available"
- If pricing not visible: State "Pricing information not visible in current screenshots"
- If features not clear: Document only what's clearly visible

## Project Info:
- Name: ${this.websiteData?.name || 'App'}
- URL: ${this.websiteData?.url || 'Unknown'}
- Output: ${this.outputPath}

REMEMBER: Quality over quantity. Better to have accurate documentation of what's actually visible than fake comprehensive content.`;
```

#### 3. Claude Code SDK Execution (lines 113-141)

```typescript
const queryResult = query({
  prompt: claudePrompt,
  options: {
    cwd: process.cwd(),
    additionalDirectories: [this.templatePath, path.dirname(this.outputPath)],
    permissionMode: 'acceptEdits', // Auto-accept file edits
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'] // Basic file operations only
  }
});
```

**Key Parameters**:
- **`permissionMode: 'acceptEdits'`**: Automatically accepts Claude's file modifications
- **`allowedTools`**: Restricts Claude to file operations only (no web access)
- **`additionalDirectories`**: Gives Claude access to template and output folders

#### 4. Result Streaming (lines 124-141)
The system streams Claude's responses in real-time:
- **`assistant` messages**: Claude's thinking and explanations
- **`result` messages**: Final success/failure status
- Accumulates all responses into `finalResult`

## Stagehand Integration

### Custom Stagehand Tool (`src/lib/stagehand-claude-tool.ts`)
Creates a custom Claude Code tool that wraps Stagehand actions:

```typescript
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
    // Tool implementation that manages Stagehand lifecycle
  }
);
```

**Features**:
- **Global state management**: Maintains Stagehand instance across multiple tool calls
- **Action types**: navigate, screenshot, act, type, wait, evaluate, initialize, close
- **Error handling**: Graceful fallbacks when web automation fails
- **Screenshot integration**: Automatically saves and references images

### Stagehand Explorer (`src/lib/stagehand-explorer.ts`)
The `StagehandExplorer` class manages the actual browser automation:

#### Key Methods:
- **`initialize()`**: Sets up Stagehand with Browserbase
- **`executeTasks(tasks)`**: Runs a sequence of exploration tasks
- **`navigate(url)`**: Navigates to a URL
- **`screenshot(filename, options)`**: Takes screenshots
- **`act(instruction)`**: Performs AI-powered actions
- **`close()`**: Cleans up browser resources

#### Exploration Strategy (lines 214-284):
```typescript
const allTasks = [
  // Step 1: Navigate and wait
  {
    action: 'navigate' as const,
    description: 'Navigate to homepage',
    params: { url }
  },
  {
    action: 'wait' as const,
    description: 'Wait for page to fully load',
    params: { waitTime: 5000 }
  },

  // Step 2: Take multiple homepage screenshots
  {
    action: 'screenshot' as const,
    description: 'Take full homepage screenshot',
    params: { filename: '01-homepage-full.png', fullPage: true }
  },
  {
    action: 'screenshot' as const,
    description: 'Take viewport screenshot',
    params: { filename: '02-homepage-viewport.png', fullPage: false }
  },

  // Step 3: Scroll and capture more content
  {
    action: 'evaluate' as const,
    description: 'Scroll to middle of page',
    params: { code: 'window.scrollTo(0, window.innerHeight * 0.5)' }
  },
  // ... more exploration steps
];
```

## Validation & Output (`docs-agent.ts` lines 144-151)

The system validates generated documentation:
- **Required files check**: Ensures `mint.json`, MDX files exist
- **Content validation**: Checks files aren't empty
- **Screenshot inventory**: Lists captured images
- **Error reporting**: Detailed success/failure feedback

```typescript
private async validateGeneratedDocs(): Promise<DocsValidationResult> {
  const result: DocsValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Required files for section-based structure
  const requiredFiles = [
    'mint.json',
    'favicon.svg',
    'getting-started.mdx',
    'features.mdx',
    'pricing.mdx',
    'authentication.mdx'
  ];

  // Validation logic...
}
```

## File Storage System (`src/lib/file-storage.ts`)

### Mintlify Documentation Generation
The system now generates Mintlify-compatible documentation for each session:

```
docs/generated/{sessionId}/
├── mint.json                 # Mintlify configuration
├── favicon.svg               # Site icon
├── index.mdx                 # Overview/landing page
├── quick-start.mdx           # Getting started guide
├── features.mdx              # Features and capabilities
└── images/                   # Screenshot files
    ├── auth-screenshot-1.png
    ├── feature-screenshot-1.png
    └── ...
```

### Key Features:
1. **Mintlify-compatible structure** - Ready to be deployed with Mintlify
2. **Automatic MDX generation** - Creates proper MDX files with frontmatter
3. **Image extraction** - Converts base64 screenshots to PNG files
4. **Navigation structure** - Organized into "Get Started" and "Features" sections
5. **Responsive layout** - Uses Mintlify components like `<CardGroup>`, `<Steps>`, etc.

## API Response Format

### Success Response
```json
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "result": "Documentation generated successfully for session session_1234567890_abc123\nOutput directory: docs/generated/session_1234567890_abc123\nClaude Code Result: [detailed results]\nValidation result: PASSED",
  "outputPath": "docs/generated/session_1234567890_abc123",
  "message": "Documentation generated successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Detailed error message"
}
```

## GET Endpoint (`/api/docs-agent?sessionId={id}`)

Allows checking if documentation exists for a session:

```json
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "outputPath": "docs/generated/session_1234567890_abc123",
  "files": [
    {
      "name": "mint.json",
      "isDirectory": false,
      "path": "docs/generated/session_1234567890_abc123/mint.json"
    },
    {
      "name": "images",
      "isDirectory": true,
      "path": "docs/generated/session_1234567890_abc123/images"
    }
    // ... more files
  ],
  "message": "Documentation found"
}
```

## Landing Page Flow

The system now has a simplified user experience:

### Landing Page (`/`)
- **Clean, minimal design** with just a URL input field
- **Real-time URL validation** with visual feedback
- **"Analyze" button** that becomes active when valid URL is entered
- **Enter key support** for quick submission
- **Routes to** `/demo?url={encoded_url}` when analyze is clicked

### Demo Page (`/demo`)
- **Automatically detects URL parameter** from landing page
- **Extracts domain name** to create a platform name
- **Immediately starts documentation generation** without showing platform selector
- **Maintains all existing functionality** (live progress, documentation viewer, etc.)

## Key Technologies Used

### 1. Claude Code SDK (`@anthropic-ai/claude-code`)
- **`query()`**: Main function to execute AI tasks with file system access
- **`tool()`**: Creates custom tools that Claude can use
- **Permission system**: Controls what Claude can access and modify
- **Streaming responses**: Real-time feedback from AI operations

### 2. Stagehand + Browserbase
- **Web automation**: Navigates and interacts with websites
- **Screenshot capture**: Takes visual evidence of website features
- **AI-powered actions**: Uses AI to find and interact with elements
- **Cloud browser**: Runs in Browserbase for scalability

### 3. Zod Schema Validation
- **Type safety**: Ensures data structure integrity
- **API validation**: Validates incoming requests
- **Tool parameter validation**: Ensures proper tool usage

### 4. Next.js API Routes
- **Serverless functions**: Handle documentation generation requests
- **File system access**: Read templates and write generated docs
- **Streaming responses**: Real-time progress updates

## System Architecture Benefits

This architecture brilliantly combines:

1. **Stagehand** for live website exploration and visual evidence collection
2. **Claude Code SDK** for intelligent file generation with file system access
3. **Custom prompting** to ensure accuracy and prevent AI hallucination
4. **Mintlify framework** for professional documentation output
5. **Validation systems** to ensure quality output

The result is **AI-generated documentation that's grounded in actual visual evidence** rather than assumptions, making it significantly more accurate and useful than traditional approaches.

## Demo Usage

1. **Visit the landing page** and enter any website URL
2. **Click "Analyze Website"** to start the process
3. **Watch live progress** as the AI explores the site
4. **Review generated documentation** in Mintlify format
5. **Access files** in `docs/generated/{sessionId}/` folder

The system generates professional-quality documentation that can be immediately deployed with Mintlify or used as a starting point for further customization.