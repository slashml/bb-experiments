import { NextResponse } from 'next/server';
import { fileDocumentationStorage } from '../../../lib/file-storage';

export async function GET() {
  try {
    const docs = await fileDocumentationStorage.listDocumentation();

    return NextResponse.json({
      success: true,
      docs: docs.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    });
  } catch (error) {
    console.error('[Docs List API] Error listing documentation:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to list documentation files'
    }, { status: 500 });
  }
}