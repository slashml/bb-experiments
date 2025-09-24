import { PlatformConfig } from './schemas';

export const DEMO_PLATFORMS: PlatformConfig[] = [
  {
    name: "Notion",
    url: "https://www.notion.so",
    description: "All-in-one workspace for notes, docs, and collaboration",
    complexity: "Medium",
    estimatedTime: "3-4 minutes",
    specialFeatures: ["Rich text editor", "Database views", "AI features", "Templates"]
  },
  {
    name: "Linear",
    url: "https://linear.app",
    description: "Issue tracking and project management for modern teams",
    complexity: "High",
    estimatedTime: "4-5 minutes",
    specialFeatures: ["Keyboard shortcuts", "Git integrations", "Roadmaps", "Analytics"]
  },
  {
    name: "Airtable",
    url: "https://www.airtable.com",
    description: "Spreadsheet-database hybrid for organizing work",
    complexity: "Low",
    estimatedTime: "2-3 minutes",
    specialFeatures: ["Views and filters", "Automations", "Apps", "Sync"]
  },
  {
    name: "Figma",
    url: "https://www.figma.com",
    description: "Collaborative design and prototyping platform",
    complexity: "Medium",
    estimatedTime: "3-4 minutes",
    specialFeatures: ["Real-time collaboration", "Design systems", "Prototyping", "Dev handoff"]
  },
  {
    name: "Stripe",
    url: "https://stripe.com",
    description: "Payment processing and financial infrastructure",
    complexity: "High",
    estimatedTime: "4-5 minutes",
    specialFeatures: ["Payment APIs", "Dashboard", "Connect", "Billing"]
  },
  {
    name: "Vercel",
    url: "https://vercel.com",
    description: "Frontend deployment and hosting platform",
    complexity: "Low",
    estimatedTime: "2-3 minutes",
    specialFeatures: ["Git integrations", "Preview deployments", "Edge functions", "Analytics"]
  }
];

export const getRandomPlatform = (): PlatformConfig => {
  const randomIndex = Math.floor(Math.random() * DEMO_PLATFORMS.length);
  return DEMO_PLATFORMS[randomIndex];
};

export const getPlatformByName = (name: string): PlatformConfig | undefined => {
  return DEMO_PLATFORMS.find(platform =>
    platform.name.toLowerCase() === name.toLowerCase()
  );
};