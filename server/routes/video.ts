import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';
import Logger from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/video/generate
 * @desc    Generate video using Google GenAI (API key kept secure on server)
 * @access  Private
 */
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { prompt, imageB64, mimeType, aspectRatio, numberOfVideos, resolution } = req.body;

    if (!prompt || !imageB64 || !mimeType) {
      return res.status(400).json({ message: 'Missing required fields: prompt, imageB64, mimeType' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      Logger.error('GEMINI_API_KEY is not defined in server .env');
      return res.status(500).json({ message: 'Video generation service not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageB64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: numberOfVideos || 1,
        resolution: resolution || '720p',
        aspectRatio: aspectRatio || '16:9'
      }
    });

    // Poll for completion (with timeout to prevent infinite loops)
    const MAX_POLL_TIME = 5 * 60 * 1000; // 5 minutes max
    const POLL_INTERVAL = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (!operation.done) {
      if (Date.now() - startTime > MAX_POLL_TIME) {
        return res.status(504).json({ message: 'Video generation timed out. Please try again.' });
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      return res.status(500).json({ message: 'Video generation failed to return a valid link' });
    }

    // Download the video on the server and return it
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
      return res.status(500).json({ message: `Failed to download video: ${videoResponse.statusText}` });
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');

    res.status(200).json({
      success: true,
      videoData: `data:video/mp4;base64,${videoBase64}`,
      mimeType: 'video/mp4'
    });

  } catch (error: any) {
    Logger.error('Video generation error:', error);
    
    if (error.message?.includes('Requested entity was not found')) {
      return res.status(400).json({ 
        message: 'API Key invalid. Please check server configuration.',
        code: 'INVALID_API_KEY'
      });
    }
    
    return res.status(500).json({ 
      message: error.message || 'Failed to generate video' 
    });
  }
});

export default router;

