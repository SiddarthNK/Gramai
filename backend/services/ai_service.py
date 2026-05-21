from groq import Groq
import os
import base64
import json
import io
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_system_prompt(agent_type: str, language: str = "english") -> str:
    """
    Generate language-aware system prompt with strict formatting rules.
    """
    lang_instruction = ""
    
    if language.lower() == "kannada":
        lang_instruction = """
IMPORTANT LANGUAGE RULE:
- User may speak in ANY language (Kannada, Hindi, English)
- You MUST ALWAYS reply in KANNADA only
- Never comment on what language the user spoke
- Never refuse to answer based on input language
- Just understand the question and reply in Kannada
- Use Kannada script always"""
    elif language.lower() == "hindi":
        lang_instruction = """
IMPORTANT LANGUAGE RULE:
- User may speak in ANY language (Kannada, Hindi, English)
- You MUST ALWAYS reply in HINDI only
- Never comment on what language the user spoke
- Never refuse to answer based on input language
- Just understand the question and reply in Hindi
- Use Hindi script always"""
    else:
        lang_instruction = """
IMPORTANT LANGUAGE RULE:
- User may speak in ANY language (Kannada, Hindi, English)
- You MUST ALWAYS reply in ENGLISH only
- Never comment on what language the user spoke
- Never refuse to answer based on input language
- Just understand the question and reply in English"""

    formatting_rules = """
ALWAYS format your response with:
- Bold section headings (e.g. **Symptoms:**)
- Bullet points for every list or step
- Short, clear 1-2 sentence bullets
- Simple farmer-friendly language
- Never write wall-of-text paragraphs

Structure:
**[Section Name]:**
- Point one
- Point two
"""

    base_prompts = {
        "agriculture": f"""You are KrishiBot, farming AI for Karnataka farmers. Be brief and practical. 
Format: use bullet points and short sentences. Max response: 150 words.
{lang_instruction}""",

        "medical": f"""You are HealthBot, a rural health assistant for Indian villages. Be brief and clear. 
Format: use bullet points and short sentences. Always end with: Consult a real doctor. Max response: 150 words.
{lang_instruction}""",

        "education": f"""You are TutorBot, a friendly tutor for rural Indian students. Be simple and clear. 
Format: use bullet points and examples. Max response: 150 words.
{lang_instruction}""",

        "general": f"""You are Gram AI rural assistant. Be brief, helpful, and clear. 
Format: use bullet points and short sentences. Max response: 150 words.
{lang_instruction}"""
    }

    return base_prompts.get(agent_type, base_prompts["general"])


def chat_with_ai(user_message: str, 
                 agent_type: str = "general",
                 language: str = "english",
                 chat_history: list = []) -> str:
    try:
        system_prompt = get_system_prompt(agent_type, language)

        messages = [{"role": "system", "content": system_prompt}]
        
        # Only keep last 4 messages to reduce token count
        recent_history = chat_history[-4:] if chat_history else []
        
        for msg in recent_history:
            messages.append(msg)
        
        messages.append({
            "role": "user", 
            "content": user_message
        })

        print(f"[CHAT] Sending {len(messages)} messages to Groq")
        print(f"[CHAT] Agent: {agent_type}, Language: {language}")

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=400,
            temperature=0.7
        )

        result = response.choices[0].message.content
        print(f"[CHAT] Response length: {len(result)} chars")
        return result

    except Exception as e:
        print(f"[AI CHAT ERROR] {str(e)}")
        raise Exception(str(e))


async def scan_disease_with_ai(image_bytes: bytes) -> dict:
    try:
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        
        print("[SCANNER] Sending image to Groq vision model...")
        
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
                            "text": """You are an expert plant disease 
specialist AI for Indian farmers in Karnataka.

Carefully examine this plant image.

You MUST respond ONLY with a valid JSON object.
No explanation. No markdown. No extra text.
Start your response with { and end with }

Use exactly this format:

{
  "is_plant": true,
  "crop_detected": "Tomato",
  "image_quality": "good",
  "disease_detected": "Early Blight",
  "confidence": 88,
  "severity": "Moderate",
  "symptoms": "Brown circular spots with yellow rings visible on leaves. Lower leaves affected more severely.",
  "causes": "Caused by fungus Alternaria solani. Spreads in humid warm conditions.",
  "organic_treatment": "Spray neem oil mixed with water every 7 days. Remove infected leaves immediately.",
  "chemical_treatment": "Spray Mancozeb 75% WP at 2.5g per liter of water every 10 days.",
  "fertilizer_tip": "Apply potassium-rich fertilizer to strengthen plant immunity.",
  "prevention": "Avoid overhead watering. Maintain spacing between plants. Rotate crops every season.",
  "recovery_estimate": "Plant should recover in 2 to 3 weeks with proper treatment.",
  "farmer_advice": "Start treatment immediately and remove all infected leaves. Your crop can be saved with quick action."
}

Rules you must follow:
- If image is not a plant at all: 
  set is_plant to false, confidence to 0,
  disease_detected to "Not a plant image"
- If image is blurry or too dark:
  set image_quality to "blurry" or "too_dark",
  set confidence below 40
- If plant is dead but identifiable:
  still name the crop, describe what you can see,
  set disease_detected to most likely cause of death
- If completely unidentifiable:
  set confidence to 0,
  set disease_detected to "Unable to identify - please upload clearer photo"
- confidence must be a NUMBER not a string
- is_plant must be true or false not a string
"""
                        }
                    ]
                }
            ],
            max_tokens=1024,
            temperature=0.1
        )
        
        raw_text = response.choices[0].message.content.strip()
        print("[SCANNER] Raw response:", raw_text[:200])
        
        # Clean the response
        if "```" in raw_text:
            parts = raw_text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    raw_text = part
                    break
        
        # Find JSON in response
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        if start != -1 and end > start:
            raw_text = raw_text[start:end]
        
        result = json.loads(raw_text)
        print("[SCANNER] Success:", result.get("disease_detected"))
        return result
        
    except json.JSONDecodeError as e:
        print(f"[SCANNER JSON ERROR] {str(e)}")
        print(f"[SCANNER RAW TEXT] {raw_text}")
        return {
            "is_plant": True,
            "crop_detected": "Unknown",
            "image_quality": "unclear",
            "disease_detected": "Could not process - please try again",
            "confidence": 0,
            "severity": "Unknown",
            "symptoms": "Image could not be analyzed properly",
            "causes": "Please try again with a clearer image",
            "organic_treatment": "N/A",
            "chemical_treatment": "N/A",
            "fertilizer_tip": "N/A",
            "prevention": "N/A",
            "recovery_estimate": "N/A",
            "farmer_advice": "Please take a clear photo in good lighting and try again"
        }
    
    except Exception as e:
        print(f"[SCANNER ERROR] {str(e)}")
        raise Exception(f"Scan failed: {str(e)}")


async def transcribe_audio(audio_bytes: bytes,
                           filename: str = "audio.webm") -> str:
    try:
        print(f"[AUDIO] Transcribing audio, size: {len(audio_bytes)}")
        
        transcription = client.audio.transcriptions.create(
            file=(filename, audio_bytes, "audio/webm"),
            model="whisper-large-v3",
            response_format="text",
            language="en"
        )
        
        print(f"[AUDIO] Transcription: {transcription}")
        return transcription
        
    except Exception as e:
        print(f"[AUDIO ERROR] {str(e)}")
        raise Exception(f"Transcription failed: {str(e)}")


def get_ai_recommendation(disease_result: dict) -> str:
    try:
        prompt = f"""
A Karnataka farmer got this crop disease scan result:
Crop: {disease_result.get('crop_detected')}
Disease: {disease_result.get('disease_detected')}
Severity: {disease_result.get('severity')}

Give a friendly, simple 3-4 sentence recommendation 
in language a village farmer can understand.
Include what to do immediately, what to buy from 
the local market, and words of encouragement.
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": get_system_prompt("agriculture", "english")
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=512
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"[RECOMMENDATION ERROR] {str(e)}")
        return "Please consult your local agricultural officer for advice."
