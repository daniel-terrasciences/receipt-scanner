import { NextRequest, NextResponse } from 'next/server';

// For now, we'll create a mock OCR function
// Replace this with actual Google Vision implementation later
async function mockOCR(imageBuffer: Buffer): Promise<string> {
  // Mock OCR response - replace with actual Google Vision API
  return `MOCK RECEIPT
Restaurant Name
Date: ${new Date().toLocaleDateString()}
Total: £15.50
Payment: Credit Card
Thank you!`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Use mock OCR for now - replace with Google Vision later
    const extractedText = await mockOCR(buffer);
    
    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}