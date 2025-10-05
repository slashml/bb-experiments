import { NextRequest, NextResponse } from 'next/server';
import { DocsAgent } from '../../../lib/docs-agent';

export async function POST(request: NextRequest) {
  try {
    const { prompt, sessionId, websiteData } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required and must be a string'
      }, { status: 400 });
    }

    // Use provided sessionId or generate one
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 11)}`;

    console.log(`[DocsAgent API] Starting documentation agent for session: ${finalSessionId}`);
    console.log(`[DocsAgent API] Prompt: ${prompt}`);
    console.log(`[DocsAgent API] Website data:`, websiteData);

    // Create and run the docs agent
    const agent = await DocsAgent.create(finalSessionId, websiteData);
    const result = await agent.run(prompt);

    return NextResponse.json({
      success: true,
      sessionId: finalSessionId,
      result: result,
      outputPath: `docs/generated/${finalSessionId}`,
      message: 'Documentation generated successfully'
    });

  } catch (error) {
    console.error('[DocsAgent API] Error:', error);

    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check file permissions.';
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        errorMessage = 'Template files not found. Please check template directory.';
        statusCode = 404;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: 'Session ID is required'
    }, { status: 400 });
  }

  try {
    const outputPath = `docs/generated/${sessionId}`;
    const fs = require('fs').promises;
    const path = require('path');

    // Check if session documentation exists
    const fullPath = path.join(process.cwd(), outputPath);

    try {
      await fs.access(fullPath);

      // Get list of generated files
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const fileList = files.map((file: any) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: `${outputPath}/${file.name}`
      }));

      return NextResponse.json({
        success: true,
        sessionId,
        outputPath,
        files: fileList,
        message: 'Documentation found'
      });

    } catch {
      return NextResponse.json({
        success: false,
        error: 'Documentation not found for this session'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('[DocsAgent API] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check documentation status'
    }, { status: 500 });
  }
}