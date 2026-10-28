import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Modality, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));

function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Smart Teacher Hint & Vocabulary Coach using gemini-4-argon with ThinkingLevel.HIGH
app.post("/api/coach/hint", async (req, res) => {
  try {
    const { animalNameVi, animalNameEn, partNameVi, partNameEn, suggestedColorVi, progressPercent } = req.body;
    const ai = getGeminiClient();

    const prompt = `Bạn là cô giáo mầm non ấm áp, vui vẻ đang dạy bé Mỹ (học lớp lá chuẩn bị lên lớp 1) vừa tô tượng 3D vừa học đánh vần tiếng Việt và từ vựng tiếng Anh.
Hiện tại bé Mỹ đang tô tượng: "${animalNameVi}" (${animalNameEn}), đã tô được ${progressPercent || 0}% bức tượng.
Bộ phận gợi ý tiếp theo là: "${partNameVi}" (${partNameEn}), màu gợi ý: "${suggestedColorVi}".

Hãy tạo phản hồi JSON gồm:
- encouragement: Lời khen và gợi ý ngắn gọn, dịu dàng dành cho bé Mỹ (1-2 câu).
- spellingLesson: Cách đánh vần tiếng Việt dễ nhớ cho từ "${partNameVi}" hoặc "${animalNameVi}" cho bé chuẩn bị vào lớp 1.
- funPoem: 4 câu thơ 4 chữ thật vần điệu, đáng yêu về "${animalNameVi}" và "${partNameVi}" màu "${suggestedColorVi}".
- bilingualTip: Một câu ngắn giúp bé nhớ từ tiếng Anh "${partNameEn}" và "${animalNameEn}".`;

    const response = await ai.models.generateContent({
      model: "gemini-4-argon",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            encouragement: { type: Type.STRING },
            spellingLesson: { type: Type.STRING },
            funPoem: { type: Type.STRING },
            bilingualTip: { type: Type.STRING },
          },
          required: ["encouragement", "spellingLesson", "funPoem", "bilingualTip"],
        },
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text.trim());
    res.json({ ok: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || "Không thể kết nối AI gợi ý lúc này.",
    });
  }
});

// 2. Music Generation using lyria-3-clip-preview
app.post("/api/music/generate", async (req, res) => {
  try {
    const { animalNameEn, animalNameVi, mood } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate a cheerful, playful 30-second children's nursery instrumental melody with xylophone, marimba, acoustic guitar, and gentle bells inspired by a cute ${animalNameEn || "little duck"} (${animalNameVi || "Vịt Con"}) for a 5-year-old painting game. Mood: ${mood || "bright, happy, bouncy, warm"}.`;

    const responseStream = await ai.models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: prompt,
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    let audioBase64 = "";
    let lyrics = "";
    let mimeType = "audio/wav";

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      res.status(500).json({ ok: false, error: "Không nhận được dữ liệu nhạc từ Lyria." });
      return;
    }

    res.json({
      ok: true,
      audioBase64,
      mimeType,
      lyrics,
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || "Không thể tạo nhạc Lyria lúc này.",
    });
  }
});

// 3. Text-to-Speech using gemini-3.8-flash-lite-tts
app.post("/api/tts/speak", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ ok: false, error: "Thiếu nội dung văn bản." });
      return;
    }
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Đọc to, rõ ràng, giọng cô giáo mầm non vui tươi ấm áp cho bé 5 tuổi: ${text}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(500).json({ ok: false, error: "Không tạo được âm thanh giọng đọc." });
      return;
    }

    res.json({
      ok: true,
      audioBase64: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || "Không thể đọc văn bản qua Gemini TTS.",
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
