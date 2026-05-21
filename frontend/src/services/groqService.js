const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPTS = {
  agriculture: `You are KrishiBot, farming AI for Karnataka farmers.
Give practical farming advice. Use bullet points. Max 150 words.`,

  medical: `You are a rural health assistant for Indian villages.
Give basic health info. Always say: consult a doctor.
Use bullet points. Max 150 words.`,

  education: `You are a friendly tutor for rural Indian students.
Explain simply with examples. Use bullet points. Max 150 words.`,

  assistant: `You are Gram AI personal assistant like ChatGPT.
Be helpful, friendly, and clear. Use bullet points. Max 150 words.`,

  grammar: `You are a grammar expert.
Correct mistakes and explain clearly. Max 150 words.`,

  general: `You are Gram AI helpful rural assistant.
Be brief and clear. Use bullet points. Max 150 words.`
};

const LANG_INSTRUCTION = {
  english: `
IMPORTANT LANGUAGE RULE:
- User may speak in ANY language (Kannada, Hindi, English)
- You MUST ALWAYS reply in ENGLISH only
- Never comment on what language the user spoke
- Never refuse to answer based on input language
- Just understand the question and reply in English`,

  kannada: `
IMPORTANT LANGUAGE RULE:
- User may speak in ANY language (Kannada, Hindi, English)
- You MUST ALWAYS reply in KANNADA only
- Never comment on what language the user spoke
- Never refuse to answer based on input language
- Just understand the question and reply in Kannada
- Use Kannada script always`,

  hindi: `
IMPORTANT LANGUAGE RULE:
- User may speak in ANY language (Kannada, Hindi, English)
- You MUST ALWAYS reply in HINDI only
- Never comment on what language the user spoke
- Never refuse to answer based on input language
- Just understand the question and reply in Hindi
- Use Hindi script always`
};

// ─── REALTIME CONTEXT HELPER ─────────────────────────────
const getRealtimeContext = (message) => {
  let context = "";
  const msgLower = message.toLowerCase();

  const timeKeywords = [
    "time", "date", "today", "day",
    "week", "month", "year", "now",
    "tomorrow", "yesterday", "schedule"
  ];
  
  if (timeKeywords.some(keyword => msgLower.includes(keyword))) {
    try {
      const now = new Date();
      // Format to India Standard Time (IST)
      const options = { 
        timeZone: "Asia/Kolkata", 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      
      const getValue = (type) => parts.find(p => p.type === type)?.value || '';
      const weekday = getValue('weekday');
      const day = getValue('day');
      const month = getValue('month');
      const year = getValue('year');
      const hour = getValue('hour');
      const minute = getValue('minute');
      const dayPeriod = getValue('dayPeriod');

      context += `
[REAL-TIME DATA]
Current Date: ${weekday}, ${day} ${month} ${year}
Current Time: ${hour}:${minute} ${dayPeriod} IST
Day of Week: ${weekday}
[END REAL-TIME DATA]

`;
    } catch (e) {
      console.error("Failed to inject time context:", e);
    }
  }

  return context;
};

// ─── CHAT FUNCTION ───────────────────────────────────────
export const sendChatMessage = async (
  message,
  agentType = "general",
  language = "english",
  chatHistory = []
) => {
  try {
    if (!GROQ_API_KEY) {
      console.warn("[GROQ] VITE_GROQ_API_KEY environment variable is not defined.");
      return {
        success: false,
        error: "VITE_GROQ_API_KEY is not defined. Please add your key to environment variables."
      };
    }

    const langKey = 
      language.toLowerCase() === "kn" || language.toLowerCase() === "kannada"
        ? "kannada"
        : language.toLowerCase() === "hi" || language.toLowerCase() === "hindi"
        ? "hindi"
        : "english";

    const agentKey = 
      agentType === "all"
        ? "assistant"
        : SYSTEM_PROMPTS[agentType]
        ? agentType
        : "general";

    const systemPrompt =
      (SYSTEM_PROMPTS[agentKey] || SYSTEM_PROMPTS.general) +
      "\n\n" +
      (LANG_INSTRUCTION[langKey] || LANG_INSTRUCTION.english);

    console.log("System prompt language:", language);
    console.log("Full prompt:", systemPrompt.slice(0, 100));

    const realtimeContext = getRealtimeContext(message);
    const enhancedMessage = realtimeContext + message;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-4),
      { role: "user", content: enhancedMessage }
    ];

    const response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Chat failed");
    }

    const data = await response.json();
    return {
      success: true,
      response: data.choices[0].message.content
    };

  } catch (error) {
    console.error("[CHAT ERROR]", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ─── IMAGE SCAN FUNCTION ─────────────────────────────────
export const scanCropImage = async (imageFile) => {
  try {
    if (!GROQ_API_KEY) {
      console.warn("[GROQ] VITE_GROQ_API_KEY environment variable is not defined.");
      return {
        success: false,
        error: "VITE_GROQ_API_KEY is not defined. Please add your key to environment variables."
      };
    }

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    const prompt = `You are an expert plant disease specialist AI for Indian farmers.

Analyze this plant image carefully.
Respond ONLY in this exact JSON format with no extra text:

{
  "is_plant": true,
  "crop_detected": "Tomato",
  "image_quality": "good",
  "disease_detected": "Early Blight",
  "confidence": 88,
  "severity": "Moderate",
  "symptoms": "Brown spots with yellow rings on leaves.",
  "causes": "Fungus Alternaria solani in humid conditions.",
  "organic_treatment": "Spray neem oil every 7 days.",
  "chemical_treatment": "Mancozeb 75% WP at 2.5g per liter.",
  "fertilizer_tip": "Apply potassium-rich fertilizer.",
  "prevention": "Avoid overhead watering. Rotate crops.",
  "recovery_estimate": "2 to 3 weeks with treatment.",
  "farmer_advice": "Remove infected leaves immediately and start treatment today."
}

Rules:
- If not a plant: set is_plant false, confidence 0, disease_detected "Not a plant image"
- If unclear: set confidence below 60
- Always try to identify crop even if dead`;

    // Note: We use the active 'meta-llama/llama-4-scout-17b-16e-instruct' vision model.
    const response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 1024,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Scan failed");
    }

    const data = await response.json();
    let text = data.choices[0].message.content.trim();

    // Clean JSON response
    if (text.includes("```")) {
      text = text.split("```")[1];
      if (text.startsWith("json")) {
        text = text.slice(4);
      }
    }

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start !== -1 && end > start) {
      text = text.slice(start, end);
    }

    const result = JSON.parse(text.trim());
    return { success: true, data: result };

  } catch (error) {
    console.error("[SCAN ERROR]", error);
    return { success: false, error: error.message };
  }
};

// ─── AUDIO TRANSCRIPTION ─────────────────────────────────
export const transcribeAudio = async (audioBlob) => {
  try {
    if (!GROQ_API_KEY) {
      console.warn("[GROQ] VITE_GROQ_API_KEY environment variable is not defined.");
      return {
        success: false,
        error: "VITE_GROQ_API_KEY is not defined. Please add your key to environment variables."
      };
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "text");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: formData
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Transcription failed");
    }

    const text = await response.text();
    return { success: true, text };

  } catch (error) {
    console.error("[AUDIO ERROR]", error);
    return { success: false, error: error.message };
  }
};

// ─── HELPER ──────────────────────────────────────────────
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
