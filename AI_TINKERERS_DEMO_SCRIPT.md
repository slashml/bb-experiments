# Claude Code SDK Agent Architecture Demo
## AI Tinkerers Meetup: Building AI Agents That Can Code

---

## 🎯 **What We're Building (2 minutes)**

**"Today I'm going to show you how to build AI agents that can autonomously write code, create files, and complete complex tasks using the Claude Code SDK."**

### The Challenge:
- Traditional AI: Chat → Human executes
- **Our Solution**: AI Agent → Direct code execution → Task completion

### What This Specific Agent Does:
- **Input**: Website URL + Documentation request
- **Agent Actions**: Browse website, analyze content, write documentation files
- **Output**: Complete documentation site with markdown files, images, and configuration

---

## 🧠 **Claude Code SDK Fundamentals (8 minutes)**

### **Step 1: What is the Claude Code SDK? (3 minutes)**

**"Think of it as giving Claude superpowers - instead of just chatting, it can actually execute code and manipulate your system."**

```typescript
// Traditional AI Interaction
const response = await claude.chat("Create a file called hello.txt");
// Returns: "Here's how you would create that file..."
// Human still needs to execute

// Claude Code SDK
import { tool } from '@anthropic-ai/claude-code';
const writeFileTool = tool('write_file', 'Write content to a file', schema, handler);
// AI directly executes and creates the file
```

**Key Concepts**:
- **Tools**: Functions the AI can call directly
- **Agents**: AI that can use multiple tools to complete complex tasks
- **Autonomous Execution**: No human in the loop for task completion

### **Step 2: The Agent Entry Point (2 minutes)**

**Show the actual API endpoint that triggers our agent:**

```typescript
// src/app/api/docs-agent/route.ts
export async function POST(request: NextRequest) {
  const { prompt, websiteData } = await request.json();

  // This is where the magic happens - we invoke Claude as an agent
  const docsAgent = new DocsAgent(sessionDir, websiteData);
  const result = await docsAgent.generateDocs(prompt, websiteData);

  return NextResponse.json({ result });
}
```

**Key Point**: "This isn't just calling an AI API - we're launching an autonomous agent that will complete the entire task."

### **Step 3: Agent Architecture Deep Dive (3 minutes)**

```
HTTP Request → Agent Initialization → Tool Execution → Task Completion

🌐 POST /api/docs-agent
    ↓
🧠 Claude Code SDK Agent
    ├─ 🔧 Web Exploration Tool (Stagehand)
    ├─ 📝 File Creation Tool (Write/Read)
    ├─ 🔍 File Search Tool (Glob/Grep)
    └─ 📸 Screenshot Analysis Tool
    ↓
📚 Complete Documentation Site
```

**The Revolutionary Part**: "The agent decides which tools to use, in what order, and handles all the coordination autonomously."

---

## 🔧 **Code Walkthrough: Building the Agent (12 minutes)**

### **Step 1: Tool Definition - Web Exploration (4 minutes)**

**Show the Stagehand tool that gives Claude browser superpowers:**

```typescript
// src/lib/stagehand-claude-tool.ts
import { tool } from '@anthropic-ai/claude-code';

export const stagehandTool = tool(
  'stagehand_action',
  'Execute browser actions like navigate, screenshot, click',
  {
    action: z.enum(['navigate', 'act', 'screenshot', 'wait']),
    params: z.object({
      url: z.string().optional(),
      instruction: z.string().optional(),
      filename: z.string().optional()
    })
  },
  async (args) => {
    // This is where Claude can control a real browser
    const explorer = new StagehandExplorer(sessionDir);
    await explorer.initialize();

    const result = await explorer.executeTasks([{
      action: args.action,
      description: args.description,
      params: args.params
    }]);

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);
```

**Explain**: "This tool lets Claude control a real browser - navigate to pages, take screenshots, click buttons. It's like giving the AI hands and eyes."

### **Step 2: The Agent Implementation (4 minutes)**

**Show the core agent that orchestrates everything:**

```typescript
// src/lib/docs-agent.ts
export class DocsAgent {
  async generateDocs(prompt: string, websiteData: WebsiteData) {
    // Step 1: Build the AI prompt with constraints
    const claudePrompt = `${prompt}

IMPORTANT: Create documentation ONLY based on exploration screenshots.
CRITICAL RULES:
- USE ONLY information visible in captured images
- DO NOT create fake content
- MUST include hero section image in getting-started.mdx

## Available Tools:
- stagehand_action: Browse websites and take screenshots
- write_file: Create documentation files
- read_file: Read existing files
- glob_files: Search for files

Complete this task autonomously using the available tools.`;

    // Step 2: Initialize Claude with our custom tools
    const result = await claudeClient.sendMessage({
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: claudePrompt }],
      tools: [
        stagehandTool,      // Browser automation
        writeFileTool,      // File creation
        readFileTool,       // File reading
        globTool            // File search
      ]
    });

    return result;
  }
}
```

**Key Point**: "The agent gets a high-level prompt and autonomously decides which tools to use and in what sequence."

### **Step 3: Agent Execution Flow (4 minutes)**

**Show what happens when the agent runs:**

```typescript
// The agent's autonomous decision process:

// 1. Agent decides: "I need to explore the website first"
await stagehand_action({
  action: "initialize",
  params: { sessionDir: "/path/to/session" }
});

await stagehand_action({
  action: "navigate",
  params: { url: "https://v1.slashml.com" }
});

// 2. Agent decides: "I should take screenshots of key sections"
await stagehand_action({
  action: "screenshot",
  params: {
    filename: "01-homepage-hero.png",
    focusElement: "header, .hero-section"
  }
});

// 3. Agent decides: "Now I'll analyze the screenshot and write documentation"
const screenshotContent = await read_file({
  filePath: "/session/01-homepage-hero.png"
});

// 4. Agent creates documentation based on what it sees
await write_file({
  filePath: "/session/getting-started.mdx",
  content: `# Getting Started with SlashML

<img src="/images/01-homepage-hero.png" alt="SlashML Hero Section" />

Based on the homepage, SlashML is a platform that...`
});
```

**Explain**: "The agent makes these decisions autonomously - no predetermined script, just intelligent tool usage based on the task."

---

## 🚀 **Live Code Demo (8 minutes)**

### **Step 1: Show the API Endpoint (2 minutes)**

```bash
# Terminal 1: Start the app
cd bb-experiment
npm run dev
```

**Open the code and show the entry point:**

```typescript
// src/app/api/docs-agent/route.ts - This is where it all starts
export async function POST(request: NextRequest) {
  const { prompt, websiteData } = await request.json();

  console.log('[DocsAgent API] Starting documentation agent');

  // Launch autonomous agent
  const docsAgent = new DocsAgent(sessionDir, websiteData);
  const result = await docsAgent.generateDocs(prompt, websiteData);

  return NextResponse.json({ result });
}
```

### **Step 2: Trigger the Agent (3 minutes)**

```bash
# Terminal 2: The curl that starts everything
curl -X POST http://localhost:3002/api/docs-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate comprehensive documentation with screenshots",
    "websiteData": {
      "name": "SlashML",
      "url": "https://v1.slashml.com"
    }
  }'
```

**Watch the logs in Terminal 1:**
- `[DocsAgent] Starting documentation generation...`
- `[DocsAgent] Claude: I'll help you generate comprehensive documentation...`
- `[DocsAgent] Claude: Let me start by examining the website...`

**Explain**: "You're watching Claude think and make decisions in real-time."

### **Step 3: Show Agent Decision Making (3 minutes)**

**Open another terminal to watch files being created:**

```bash
# Terminal 3: Watch the agent create files
watch -n 1 "find docs/generated -name '*.png' -o -name '*.mdx' | tail -10"
```

**Point out in the logs:**
- `[DocsAgent] Claude: Now let me initialize Stagehand and begin exploration`
- `[DocsAgent] Claude: I'll take a screenshot of the hero section...`
- `[DocsAgent] Claude: Now I'll create the getting-started.mdx file...`

**Key Insight**: "Each of these lines represents an autonomous decision by Claude - it's not following a script, it's reasoning about what to do next."

---

## 🎯 **Key Agent Architecture Principles (5 minutes)**

### **1. Tool-First Design**
```typescript
// Instead of hard-coding functionality, we give Claude tools
const tools = [
  stagehandTool,    // "Claude, you can browse websites"
  writeFileTool,    // "Claude, you can create files"
  readFileTool,     // "Claude, you can read files"
  globTool          // "Claude, you can search for files"
];
```

### **2. Constraint-Based Prompting**
```typescript
const prompt = `CRITICAL RULES:
- DO NOT create fake content
- USE ONLY information visible in screenshots
- MUST include hero section image in getting started guide`;
```
**"We don't tell Claude HOW to do the task, we tell it WHAT the constraints are."**

### **3. Autonomous Task Decomposition**
**Traditional approach:**
```typescript
// Rigid step-by-step programming
step1_navigate();
step2_screenshot();
step3_analyze();
step4_write_docs();
```

**Agent approach:**
```typescript
// High-level goal, autonomous execution
"Generate documentation with screenshots" → Agent figures out the steps
```

---

## 🧠 **How This Changes Everything (3 minutes)**

### **Before Agents:**
1. **Developer writes specific code for each task**
2. **Maintenance nightmare** - every website change breaks the scraper
3. **Limited adaptability** - can only handle predetermined scenarios

### **With Claude Code SDK Agents:**
1. **High-level instructions** - "create documentation"
2. **Self-adapting** - agent figures out how to handle different websites
3. **Tool composition** - agent combines tools creatively to solve problems

### **The Paradigm Shift:**
```
Traditional: Code → Execute → Result
Agent: Intent → Reasoning → Tool Usage → Result
```

**"We've moved from programming WHAT to do, to teaching AI HOW to think about problems."**

---

## 🔮 **What You Can Build With This (4 minutes)**

### **Beyond Documentation - Agent Applications:**

1. **Code Review Agent**
   ```typescript
   "Review this PR and suggest improvements" →
   Agent: reads code, runs tests, writes review comments
   ```

2. **Bug Investigation Agent**
   ```typescript
   "Debug why users can't checkout" →
   Agent: analyzes logs, reproduces issue, suggests fixes
   ```

3. **Competitive Analysis Agent**
   ```typescript
   "Analyze competitor features" →
   Agent: browses competitors, screenshots features, writes analysis
   ```

4. **Data Migration Agent**
   ```typescript
   "Migrate user data from old system" →
   Agent: reads old format, transforms data, validates migration
   ```

### **The Common Pattern:**
```
High-Level Task + Tools + Constraints = Autonomous Agent
```

---

## 🎪 **Q&A and Next Steps (5 minutes)**

### **Try This Yourself:**

```bash
# 1. Clone the repo
git clone [your-repo-url]
cd bb-experiment

# 2. Install and setup
npm install
cp .env.example .env
# Add your API keys

# 3. Run your first agent
npm run dev
curl -X POST http://localhost:3002/api/docs-agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Document my website", "websiteData": {"name": "MyApp", "url": "https://yoursite.com"}}'
```

### **Key Files to Study:**
- `src/app/api/docs-agent/route.ts` - Agent entry point
- `src/lib/docs-agent.ts` - Agent implementation
- `src/lib/stagehand-claude-tool.ts` - Custom tool example

### **Resources:**
- **Claude Code SDK**: https://github.com/anthropics/claude-code
- **Stagehand**: https://github.com/browserbase/stagehand
- **This Demo**: [your-github-repo]

**"The future is agents that can code. Start building yours today!"**

---

## 💡 **Expected Questions & Answers**

**Q: "How do you prevent the agent from going rogue?"**
**A**: "Constraint-based prompting and tool limitations. The agent can only use the tools we give it, and we provide strict rules about what it can and can't do."

**Q: "What happens if the agent fails partway through?"**
**A**: "Show the error handling in the code - agents can recover, retry, or fail gracefully with useful error messages."

**Q: "How much does this cost to run?"**
**A**: "Claude API calls (~$0.01-0.10 per request) + Browserbase (~$0.05 per session). Much cheaper than hiring a human documentarian."

**Q: "Can this work with private/authenticated sites?"**
**A**: "Yes! Stagehand can handle login flows. The agent can autonomously fill forms and navigate authenticated sections."

**Total Demo Time: ~30 minutes**
