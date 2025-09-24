import { z } from 'zod';

export const HomepageDataSchema = z.object({
  platformName: z.string().describe("The name of the SaaS platform"),
  valueProposition: z.string().describe("Main value proposition or tagline"),
  keyFeatures: z.array(z.string()).describe("List of key features mentioned on homepage"),
  pricingTiers: z.array(z.string()).describe("Available pricing tiers or plans"),
  signupOptions: z.array(z.string()).describe("Available signup/auth options (email, Google, etc.)"),
  targetAudience: z.string().optional().describe("Target audience or use cases mentioned"),
  testimonials: z.array(z.string()).optional().describe("Customer testimonials if visible")
});

export const AuthFlowDataSchema = z.object({
  signupProcess: z.object({
    steps: z.array(z.string()).describe("Steps in the signup process"),
    requiredFields: z.array(z.string()).describe("Required form fields"),
    socialLogins: z.array(z.string()).describe("Social login options available"),
    verificationRequired: z.boolean().describe("Whether email verification is required")
  }),
  loginProcess: z.object({
    loginOptions: z.array(z.string()).describe("Available login methods"),
    forgotPasswordFlow: z.boolean().describe("Whether forgot password is available"),
    twoFactorAuth: z.boolean().describe("Whether 2FA is supported")
  })
});

export const FeatureDataSchema = z.object({
  navigation: z.object({
    mainSections: z.array(z.string()).describe("Main navigation sections"),
    sidebar: z.array(z.string()).optional().describe("Sidebar navigation items"),
    footer: z.array(z.string()).optional().describe("Footer links")
  }),
  coreFeatures: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional()
  })).describe("Core features discovered through navigation"),
  integrations: z.array(z.string()).optional().describe("Third-party integrations mentioned"),
  apiAccess: z.boolean().optional().describe("Whether API access is mentioned"),
  mobileApp: z.boolean().optional().describe("Whether mobile apps are available")
});

export const DocumentationSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  screenshots: z.array(z.string()),
  actionItems: z.array(z.string()).optional()
});

export const CompleteDocumentationSchema = z.object({
  platformName: z.string(),
  generatedAt: z.string(),
  sessionId: z.string(),
  sections: z.array(DocumentationSectionSchema),
  summary: z.object({
    totalScreenshots: z.number(),
    keyInsights: z.array(z.string()),
    recommendedNextSteps: z.array(z.string())
  })
});

// Platform configuration
export const PlatformConfigSchema = z.object({
  name: z.string(),
  url: z.string(),
  description: z.string(),
  complexity: z.enum(["Low", "Medium", "High"]),
  estimatedTime: z.string(),
  specialFeatures: z.array(z.string()).optional()
});

// Progress tracking
export const TaskProgressSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "error"]),
  progress: z.number().min(0).max(100),
  currentAction: z.string().optional(),
  screenshots: z.array(z.string()),
  error: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional()
});

export const SessionProgressSchema = z.object({
  sessionId: z.string(),
  platformName: z.string(),
  platformUrl: z.string(),
  status: z.enum(["initializing", "running", "completed", "failed"]),
  currentTask: z.string().optional(),
  tasks: z.array(TaskProgressSchema),
  overallProgress: z.number().min(0).max(100),
  liveViewUrl: z.string().optional(),
  replayUrl: z.string().optional(),
  startTime: z.string(),
  estimatedEndTime: z.string().optional()
});

// Type exports
export type HomepageData = z.infer<typeof HomepageDataSchema>;
export type AuthFlowData = z.infer<typeof AuthFlowDataSchema>;
export type FeatureData = z.infer<typeof FeatureDataSchema>;
export type DocumentationSection = z.infer<typeof DocumentationSectionSchema>;
export type CompleteDocumentation = z.infer<typeof CompleteDocumentationSchema>;
export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;
export type TaskProgress = z.infer<typeof TaskProgressSchema>;
export type SessionProgress = z.infer<typeof SessionProgressSchema>;