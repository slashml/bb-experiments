export interface ScreenshotRequest {
  url: string;
  sessionId?: string;
}

export interface ScreenshotResult {
  url: string;
  screenshotUrl: string;
  timestamp: string;
  success: boolean;
  error?: string;
  scrollPosition?: number;
  description?: string;
}

export interface ExplorationResult {
  url: string;
  screenshots: ScreenshotResult[];
  timestamp: string;
  success: boolean;
  error?: string;
  totalScrollHeight?: number;
  signInDetected?: boolean;
  authenticationCompleted?: boolean;
  postAuthScreenshots?: ScreenshotResult[];
  liveViewUrl?: string;
}

export interface ScreenshotStatus {
  status: 'idle' | 'loading' | 'capturing' | 'complete' | 'error';
  result?: ScreenshotResult;
}

export interface ExplorationStatus {
  status: 'idle' | 'loading' | 'exploring' | 'waiting_auth' | 'post_auth' | 'complete' | 'error';
  result?: ExplorationResult;
  currentStep?: string;
  progress?: number;
  liveViewUrl?: string;
  authMessage?: string;
}