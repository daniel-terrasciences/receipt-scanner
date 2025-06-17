import vision from '@google-cloud/vision';

// Initialize the Vision API client
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    console.log('Processing image with Google Vision API...');
    
    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    });
    
    const detections = result.textAnnotations;
    const extractedText = detections && detections[0] ? detections[0].description || '' : '';
    
    console.log('OCR Result:', extractedText.substring(0, 200) + '...');
    return extractedText;
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error(`Failed to process image with Google Vision API: ${error}`);
  }
}