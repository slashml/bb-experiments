import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '../../../lib/session-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new NextResponse('Session ID required', { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      console.log(`[SSE] Starting progress stream for session: ${sessionId}`);

      const sendUpdate = () => {
        try {
          // Get session progress from the shared session store
          const progress = sessionStore.getSession(sessionId);

          if (progress) {
            const data = `data: ${JSON.stringify(progress)}\n\n`;
            controller.enqueue(encoder.encode(data));

            // If completed or failed, close the stream
            if (progress.status === 'completed' || progress.status === 'failed') {
              console.log(`[SSE] Session ${sessionId} ${progress.status}, closing stream`);
              controller.close();
              return;
            }
          } else {
            // Send a keep-alive message
            const keepAlive = `data: ${JSON.stringify({ type: 'keepalive', sessionId })}\n\n`;
            controller.enqueue(encoder.encode(keepAlive));
          }
        } catch (error) {
          console.error(`[SSE] Error sending update for session ${sessionId}:`, error);
          controller.error(error);
        }
      };

      // Send initial update
      sendUpdate();

      // Set up interval to send updates every 2 seconds
      const interval = setInterval(sendUpdate, 2000);

      // Clean up on close
      const cleanup = () => {
        clearInterval(interval);
        console.log(`[SSE] Cleaned up interval for session: ${sessionId}`);
      };

      // Handle stream cancellation
      return cleanup;
    }
  });

  // Return the stream with appropriate headers for SSE
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

