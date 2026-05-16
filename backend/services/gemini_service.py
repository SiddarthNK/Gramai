from groq import Groq
import os
from dotenv import load_dotenv
import base64
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPTS = {
    "agriculture": """You are KrishiBot, an expert agricultural 
assistant for Karnataka farmers. Answer farming questions about 
crops, diseases, fertilizers, weather, and soil in simple English 
or Kannada. Be practical and concise.""",

    "medical": """You are a rural health assistant for Indian villages. 
Give basic health information in very simple language. Always add 
this disclaimer: 'Please consult a real doctor for proper treatment.'
Never diagnose — only inform.""",

    "education": """You are a friendly tutor for rural Indian students. 
Explain concepts simply using village life examples. 
Be encouraging and patient.""",

    "general": """You are Gram AI, a helpful assistant for rural 
Indian communities. Help with farming, health, and education 
questions in simple language."""
}


def chat_with_ai(user_message: str, agent_type: str = "general", history: list = None) -> str:
    try:
        system_prompt = SYSTEM_PROMPTS.get(
            agent_type, SYSTEM_PROMPTS["general"]
        )

        messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            for msg in history:
                role = "user" if msg["role"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})
        
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"[GROQ CHAT ERROR] {str(e)}")
        raise Exception(f"AI failed: {str(e)}")


def scan_disease_with_ai(image_bytes: bytes) -> dict:
    try:
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        response = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """You are an expert plant pathologist AI.
Analyze this plant image and respond ONLY in this exact JSON format 
with no extra text:

{
  "is_plant": true,
  "crop_detected": "Tomato/Rice/Potato/Corn/Wheat/Banana/Mango/Unknown",
  "image_quality": "good/blurry/too_dark/unclear",
  "disease_detected": "Disease name or Healthy or Unable to determine",
  "confidence": 0,
  "severity": "Mild/Moderate/Severe/Healthy/Unknown",
  "symptoms": "Visible symptoms in 2 sentences",
  "causes": "Primary causes",
  "organic_treatment": "Organic treatment methods",
  "chemical_treatment": "Chemical treatment with product names",
  "fertilizer_tip": "Fertilizer recommendation",
  "prevention": "Prevention tips",
  "recovery_estimate": "Recovery time with treatment",
  "farmer_advice": "Simple advice in 2 sentences"
}

If not a plant: set is_plant false, confidence 0.
If confidence below 60: set disease_detected to 
"Unable to confidently identify - please upload a clearer photo"
"""
                        }
                    ]
                }
            ],
            max_tokens=1024
        )

        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())

    except Exception as e:
        print(f"[GROQ SCAN ERROR] {str(e)}")
        raise Exception(f"Disease scan failed: {str(e)}")


def transcribe_audio_with_ai(audio_bytes: bytes,
                              filename: str = "audio.webm") -> str:
    try:
        # Groq expects a file-like object for transcriptions
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename
        
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3",
            language="en",
            response_format="text"
        )
        return transcription

    except Exception as e:
        import io # Ensure io is available
        print(f"[GROQ AUDIO ERROR] {str(e)}")
        raise Exception(f"Audio transcription failed: {str(e)}")
