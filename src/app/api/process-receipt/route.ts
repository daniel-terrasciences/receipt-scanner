import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/vision';

export async function POST(request: NextRequest) {
  try {
    console.log('Received OCR request');
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    console.log('Processing file:', file.name, 'Size:', file.size);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Extract text using Google Vision API
    const extractedText = await extractTextFromImage(buffer);
    
    return NextResponse.json({ 
      text: extractedText,
      success: true 
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}