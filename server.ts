import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Server-side Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Feature & Code Generation Endpoint
app.post('/api/ai/generate-module', async (req, res) => {
  try {
    const { prompt, existingCode } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in environment. Please check the Secrets panel.',
      });
    }

    const systemInstruction = `You are the Autonomous Self-Evolving AI Engine for "NexusHub Sovereign OS", a universal connectivity and business operations platform built for Sheikh Farid.
Generate an interactive, clean, self-contained dynamic module snippet.
The output MUST be valid JSON conforming to:
{
  "title": "Module Title (e.g. Birthday & Event Greeting Dispatcher)",
  "description": "Short explanation in Bengali or English",
  "category": "Hotel" | "Productivity" | "Finance" | "Dispatcher",
  "icon": "Calendar" | "Cake" | "Calculator" | "Gift" | "Clock" | "DollarSign" | "Award" | "Zap",
  "code": "Interactive component script or formula implementation"
}
Do NOT include markdown quotes around the JSON. Return only the JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User Prompt: ${prompt}. ${existingCode ? `Existing Code to modify: ${existingCode}` : ''}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = {
        title: prompt.slice(0, 30),
        description: prompt,
        category: 'Productivity',
        icon: 'Zap',
        code: `// Dynamic module for ${prompt}`,
      };
    }

    return res.json({ success: true, module: parsedData });
  } catch (error: any) {
    console.error('Server Gemini Error:', error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// AI Weekly Productivity Summary Endpoint
app.post('/api/ai/weekly-summary', async (req, res) => {
  try {
    const { logs, payments, contactsCount } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const systemInstruction = `You are the Executive AI Strategic Advisor for Sheikh Farid on NexusHub Sovereign OS.
Analyze the user's recent communication logs, payments, and interactions.
Provide an inspiring, executive-level weekly productivity & business intelligence report in Bengali (বাংলা) with bullet points and key takeaways.
Mention key contacts like Lamisa Aktar Raisha or Hotel Al Sheikh Farid if relevant.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Recent Logs: ${JSON.stringify(logs?.slice(0, 20) || [])}. Recent Payments: ${JSON.stringify(payments?.slice(0, 10) || [])}. Total Contacts: ${contactsCount || 0}. Generate weekly business report.`,
      config: {
        systemInstruction,
      },
    });

    return res.json({ success: true, summary: response.text });
  } catch (error: any) {
    console.error('AI Weekly Summary Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
});

// Vite Middleware for SPA
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NexusHub Sovereign Server running on http://0.0.0.0:${PORT}`);
});
