import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '../../../../lib/session-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Documentation API] Fetching documentation for session: ${sessionId}`);

    // Get documentation from file storage
    const documentation = await sessionStore.getDocumentation(sessionId);
    const session = sessionStore.getSession(sessionId);

    if (!documentation) {
      return NextResponse.json(
        { error: 'Documentation not found for this session' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      documentation,
      session,
      generatedAt: documentation.generatedAt
    });

  } catch (error) {
    console.error('[Documentation API] Error fetching documentation:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}