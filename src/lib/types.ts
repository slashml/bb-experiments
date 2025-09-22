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
}

export interface ScreenshotStatus {
  status: 'idle' | 'loading' | 'capturing' | 'complete' | 'error';
  result?: ScreenshotResult;
}