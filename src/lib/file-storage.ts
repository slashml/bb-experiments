import { promises as fs } from 'fs';
import path from 'path';
import { CompleteDocumentation } from './schemas';

export class FileDocumentationStorage {
  private docsDir: string;

  constructor(baseDir: string = 'docs/generated') {
    this.docsDir = path.resolve(baseDir);
  }

  async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.docsDir);
    } catch {
      await fs.mkdir(this.docsDir, { recursive: true });
    }
  }

  async saveDocumentation(sessionId: string, documentation: CompleteDocumentation): Promise<void> {
    await this.ensureDirectoryExists();

    // Create session-specific directory for Mintlify docs
    const sessionDir = path.join(this.docsDir, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Create images subdirectory
    const imagesDir = path.join(sessionDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // Save original JSON format
    const filePath = path.join(this.docsDir, `${sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(documentation, null, 2));

    // Save Mintlify documentation
    await this.saveMintlifyDocs(sessionDir, documentation);
  }

  async getDocumentation(sessionId: string): Promise<CompleteDocumentation | null> {
    try {
      const filePath = path.join(this.docsDir, `${sessionId}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content) as CompleteDocumentation;
    } catch {
      return null;
    }
  }

  async deleteDocumentation(sessionId: string): Promise<void> {
    try {
      const jsonPath = path.join(this.docsDir, `${sessionId}.json`);
      const sessionDir = path.join(this.docsDir, sessionId);

      await Promise.all([
        fs.unlink(jsonPath).catch(() => {}),
        this.deleteDirectory(sessionDir).catch(() => {})
      ]);
    } catch {
      // Ignore errors if files don't exist
    }
  }

  private async deleteDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
  }

  async listDocumentation(): Promise<Array<{ sessionId: string; platformName: string; generatedAt: string }>> {
    await this.ensureDirectoryExists();

    try {
      const files = await fs.readdir(this.docsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const docs = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const sessionId = path.basename(file, '.json');
            const doc = await this.getDocumentation(sessionId);
            return doc ? {
              sessionId,
              platformName: doc.platformName,
              generatedAt: doc.generatedAt
            } : null;
          } catch {
            return null;
          }
        })
      );

      return docs.filter(doc => doc !== null) as Array<{ sessionId: string; platformName: string; generatedAt: string }>;
    } catch {
      return [];
    }
  }

  private async saveMintlifyDocs(sessionDir: string, documentation: CompleteDocumentation): Promise<void> {
    // Generate mint.json configuration
    const mintConfig = this.generateMintConfig(documentation);
    await fs.writeFile(path.join(sessionDir, 'mint.json'), JSON.stringify(mintConfig, null, 2));

    // Save MDX files for each section
    await this.createIndexMDX(sessionDir, documentation);
    await this.createQuickStartMDX(sessionDir, documentation);
    await this.createFeatureMDX(sessionDir, documentation);

    // Save screenshots as image files
    await this.saveScreenshots(sessionDir, documentation);
  }

  private generateMintConfig(documentation: CompleteDocumentation) {
    return {
      "$schema": "https://mintlify.com/schema.json",
      "name": `${documentation.platformName} Documentation`,
      "logo": {
        "dark": "/logo/dark.svg",
        "light": "/logo/light.svg"
      },
      "favicon": "/favicon.svg",
      "colors": {
        "primary": "#12acff",
        "light": "#12acff",
        "dark": "#12acff",
        "anchors": {
          "from": "#12acff",
          "to": "#06BCFB"
        }
      },
      "topbarLinks": [
        {
          "name": "Platform",
          "url": documentation.platformName
        }
      ],
      "navigation": [
        {
          "group": "Get Started",
          "pages": [
            "index",
            "quick-start"
          ]
        },
        {
          "group": "Features",
          "pages": [
            "features"
          ]
        }
      ],
      "footerSocials": {}
    };
  }

  private async createIndexMDX(sessionDir: string, documentation: CompleteDocumentation): Promise<void> {
    const content = `---
title: '${documentation.platformName} Overview'
description: 'AI-generated documentation for ${documentation.platformName}'
---

# Welcome to ${documentation.platformName}

${documentation.sections[0]?.content || `This documentation was automatically generated using AI analysis of ${documentation.platformName}.`}

## Key Insights

${documentation.summary.keyInsights.map(insight => `- ${insight}`).join('\n')}

## What's Inside

<CardGroup cols={2}>
  <Card
    title="Quick Start Guide"
    icon="rocket"
    href="/quick-start"
  >
    Get started with ${documentation.platformName} quickly
  </Card>
  <Card
    title="Features Overview"
    icon="stars"
    href="/features"
  >
    Explore the platform's key features and capabilities
  </Card>
</CardGroup>

## Documentation Stats

<Card>
  **Generated**: ${new Date(documentation.generatedAt).toLocaleString()}
  **Sections**: ${documentation.sections.length}
  **Screenshots**: ${documentation.summary.totalScreenshots}
</Card>
`;

    await fs.writeFile(path.join(sessionDir, 'index.mdx'), content);
  }

  private async createQuickStartMDX(sessionDir: string, documentation: CompleteDocumentation): Promise<void> {
    const authSection = documentation.sections.find(s => s.title.toLowerCase().includes('auth'));

    const content = `---
title: 'Quick Start Guide'
description: 'Get started with ${documentation.platformName} in minutes'
---

# Getting Started with ${documentation.platformName}

${authSection ? authSection.content : `Follow these steps to get started with ${documentation.platformName}.`}

## Next Steps

${documentation.summary.recommendedNextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

${authSection && authSection.screenshots.length > 0 ? `
## Authentication Screenshots

${authSection.screenshots.map((screenshot, idx) => `
<img
  src="/images/auth-screenshot-${idx + 1}.png"
  alt="Authentication Step ${idx + 1}"
  className="rounded-lg border"
/>
`).join('\n')}
` : ''}

<Tip>
  This documentation was automatically generated. Some steps may require verification with the actual platform.
</Tip>
`;

    await fs.writeFile(path.join(sessionDir, 'quick-start.mdx'), content);
  }

  private async createFeatureMDX(sessionDir: string, documentation: CompleteDocumentation): Promise<void> {
    const featureSection = documentation.sections.find(s =>
      s.title.toLowerCase().includes('feature') ||
      s.title.toLowerCase().includes('navigation')
    );

    const content = `---
title: 'Features & Capabilities'
description: 'Explore the key features of ${documentation.platformName}'
---

# Platform Features

${featureSection ? featureSection.content : `${documentation.platformName} offers a comprehensive set of features for users.`}

## Feature Overview

<CardGroup cols={2}>
  ${documentation.sections.slice(1).map(section => `
  <Card
    title="${section.title}"
    icon="feature"
  >
    ${section.content.split('\n')[0] || 'Key platform capability'}
  </Card>`).join('')}
</CardGroup>

${featureSection && featureSection.actionItems && featureSection.actionItems.length > 0 ? `
## Action Items

<Steps>
${featureSection.actionItems.map(item => `  <Step title="${item.split(':')[0] || item}">
    ${item.includes(':') ? item.split(':').slice(1).join(':').trim() : 'Complete this step'}
  </Step>`).join('\n')}
</Steps>
` : ''}

${featureSection && featureSection.screenshots.length > 0 ? `
## Feature Screenshots

${featureSection.screenshots.map((screenshot, idx) => `
<img
  src="/images/feature-screenshot-${idx + 1}.png"
  alt="Feature Screenshot ${idx + 1}"
  className="rounded-lg border"
/>
`).join('\n')}
` : ''}

<Note>
  This documentation was automatically generated through AI analysis. Some features may have changed since generation.
</Note>
`;

    await fs.writeFile(path.join(sessionDir, 'features.mdx'), content);
  }

  private async saveScreenshots(sessionDir: string, documentation: CompleteDocumentation): Promise<void> {
    const imagesDir = path.join(sessionDir, 'images');

    // Save screenshots for each section
    for (const section of documentation.sections) {
      const sectionName = section.title.toLowerCase().replace(/[^a-z0-9]/g, '-');

      for (let i = 0; i < section.screenshots.length; i++) {
        const screenshot = section.screenshots[i];

        if (screenshot.startsWith('data:image/')) {
          // Extract base64 data and save as file
          const matches = screenshot.match(/^data:image\/([^;]+);base64,(.+)$/);
          if (matches) {
            const [, extension, base64Data] = matches;
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `${sectionName}-screenshot-${i + 1}.${extension}`;
            await fs.writeFile(path.join(imagesDir, filename), buffer);
          }
        }
      }
    }
  }

  private toMarkdown(documentation: CompleteDocumentation): string {
    return `# ${documentation.platformName} Documentation

Generated on: ${new Date(documentation.generatedAt).toLocaleString()}
Session ID: ${documentation.sessionId}

${documentation.sections.map(section => `
## ${section.title}

${section.content}

${section.actionItems?.length ? `### Action Items:
${section.actionItems.map(item => `- ${item}`).join('\n')}` : ''}

${section.screenshots.length ? `### Screenshots:
${section.screenshots.map((screenshot, idx) => `![Screenshot ${idx + 1}](${screenshot})`).join('\n')}` : ''}

---
`).join('\n')}

## Summary

**Key Insights:**
${documentation.summary.keyInsights.map(insight => `- ${insight}`).join('\n')}

**Recommended Next Steps:**
${documentation.summary.recommendedNextSteps.map(step => `- ${step}`).join('\n')}

**Screenshots:** ${documentation.summary.totalScreenshots} captured

Generated with AI using Stagehand + Browserbase
`;
  }

  async cleanup(maxAgeHours: number = 24): Promise<void> {
    await this.ensureDirectoryExists();

    try {
      const files = await fs.readdir(this.docsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.docsDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime.getTime() < cutoffTime) {
            const sessionId = path.basename(file, '.json');
            await this.deleteDocumentation(sessionId);
            console.log(`[FileStorage] Cleaned up old documentation: ${sessionId}`);
          }
        } catch {
          // Ignore errors for individual files
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }
}

// Export singleton instance
export const fileDocumentationStorage = new FileDocumentationStorage();