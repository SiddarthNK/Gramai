import os
from typing import Optional
from groq import Groq
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    pipeline
)
from sentence_transformers import SentenceTransformer
import torch
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Global model cache (load once, reuse)
MODELS_CACHE = {}

def get_device():
    """Auto-detect GPU or CPU"""
    if torch.cuda.is_available():
        logger.info("Using GPU")
        return "cuda"
    else:
        logger.info("Using CPU")
        return "cpu"

DEVICE = get_device()

def load_mistral_model():
    """Load Mistral for high-quality chat"""
    if "mistral" not in MODELS_CACHE:
        logger.info("Loading Mistral model...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                "mistralai/Mistral-7B-Instruct-v0.1"
            )
            model = AutoModelForCausalLM.from_pretrained(
                "mistralai/Mistral-7B-Instruct-v0.1",
                device_map="auto",
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            MODELS_CACHE["mistral"] = {
                "model": model,
                "tokenizer": tokenizer
            }
            logger.info("Mistral loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Mistral: {e}")
            return None
    return MODELS_CACHE["mistral"]

def load_phi2_model():
    """Load Phi-2 for reasoning tasks"""
    if "phi2" not in MODELS_CACHE:
        logger.info("Loading Phi-2 model...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                "microsoft/phi-2"
            )
            model = AutoModelForCausalLM.from_pretrained(
                "microsoft/phi-2",
                device_map="auto",
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            MODELS_CACHE["phi2"] = {
                "model": model,
                "tokenizer": tokenizer
            }
            logger.info("Phi-2 loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Phi-2: {e}")
            return None
    return MODELS_CACHE["phi2"]

def load_tinyllama_model():
    """Load TinyLlama for lightweight/fast responses"""
    if "tinyllama" not in MODELS_CACHE:
        logger.info("Loading TinyLlama model...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
            )
            model = AutoModelForCausalLM.from_pretrained(
                "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                device_map="auto"
            )
            MODELS_CACHE["tinyllama"] = {
                "model": model,
                "tokenizer": tokenizer
            }
            logger.info("TinyLlama loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load TinyLlama: {e}")
            return None
    return MODELS_CACHE["tinyllama"]

def load_flan_t5_model():
    """Load FLAN-T5 for text generation"""
    if "flan_t5" not in MODELS_CACHE:
        logger.info("Loading FLAN-T5 model...")
        try:
            model_name = "google/flan-t5-large"
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(
                model_name,
                device_map="auto"
            )
            MODELS_CACHE["flan_t5"] = {
                "model": model,
                "tokenizer": tokenizer
            }
            logger.info("FLAN-T5 loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load FLAN-T5: {e}")
            return None
    return MODELS_CACHE["flan_t5"]

def load_bert_embeddings():
    """Load BERT for embeddings and similarity"""
    if "bert" not in MODELS_CACHE:
        logger.info("Loading BERT embeddings model...")
        try:
            model = SentenceTransformer(
                "all-MiniLM-L6-v2",
                device=DEVICE
            )
            MODELS_CACHE["bert"] = model
            logger.info("BERT loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load BERT: {e}")
            return None
    return MODELS_CACHE["bert"]

def chat_with_local_mistral(
    message: str,
    system_prompt: str,
    max_tokens: int = 400
) -> Optional[str]:
    """Generate response using local Mistral"""
    try:
        logger.info("[LOCAL] Using Mistral for chat")
        mistral_data = load_mistral_model()
        
        if not mistral_data:
            logger.warning("[LOCAL] Mistral not available")
            return None

        model = mistral_data["model"]
        tokenizer = mistral_data["tokenizer"]

        prompt = f"[INST] {system_prompt}\n\nUser: {message} [/INST]"
        
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2000
        ).to(DEVICE)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )

        response = tokenizer.decode(
            outputs[0],
            skip_special_tokens=True
        )
        
        # Extract only the response part after [/INST]
        if "[/INST]" in response:
            response = response.split("[/INST]")[-1].strip()

        logger.info(f"[LOCAL] Mistral response length: {len(response)}")
        return response if response else None

    except Exception as e:
        logger.error(f"[LOCAL] Mistral error: {e}")
        return None

# Alias to map chat_with_mistral to chat_with_local_mistral
chat_with_mistral = chat_with_local_mistral

def chat_with_phi2(
    message: str,
    system_prompt: str,
    max_tokens: int = 400
) -> Optional[str]:
    """Generate response using Phi-2 for reasoning"""
    try:
        logger.info("[LOCAL] Using Phi-2 for reasoning")
        phi2_data = load_phi2_model()
        
        if not phi2_data:
            logger.warning("[LOCAL] Phi-2 not available")
            return None

        model = phi2_data["model"]
        tokenizer = phi2_data["tokenizer"]

        prompt = f"{system_prompt}\n\nUser: {message}\nAssistant:"
        
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2000
        ).to(DEVICE)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9
            )

        response = tokenizer.decode(
            outputs[0],
            skip_special_tokens=True
        )

        # Extract only the response part
        if "Assistant:" in response:
            response = response.split("Assistant:")[-1].strip()

        logger.info(f"[LOCAL] Phi-2 response length: {len(response)}")
        return response if response else None

    except Exception as e:
        logger.error(f"[LOCAL] Phi-2 error: {e}")
        return None

def chat_with_tinyllama(
    message: str,
    system_prompt: str,
    max_tokens: int = 300
) -> Optional[str]:
    """Generate response using TinyLlama (lightweight)"""
    try:
        logger.info("[LOCAL] Using TinyLlama (lightweight)")
        tinyllama_data = load_tinyllama_model()
        
        if not tinyllama_data:
            logger.warning("[LOCAL] TinyLlama not available")
            return None

        model = tinyllama_data["model"]
        tokenizer = tinyllama_data["tokenizer"]

        prompt = f"[INST] {system_prompt}\n\n{message} [/INST]"
        
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=1500
        ).to(DEVICE)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9
            )

        response = tokenizer.decode(
            outputs[0],
            skip_special_tokens=True
        )

        if "[/INST]" in response:
            response = response.split("[/INST]")[-1].strip()

        logger.info(f"[LOCAL] TinyLlama response length: {len(response)}")
        return response if response else None

    except Exception as e:
        logger.error(f"[LOCAL] TinyLlama error: {e}")
        return None

def chat_with_groq(
    message: str,
    system_prompt: str,
    max_tokens: int = 400
) -> Optional[str]:
    """Generate response using Groq API (fallback)"""
    try:
        logger.info("[GROQ] Using Groq API")
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=max_tokens,
            temperature=0.7
        )
        
        result = response.choices[0].message.content
        logger.info(f"[GROQ] Response length: {len(result)}")
        return result

    except Exception as e:
        logger.error(f"[GROQ] Error: {e}")
        return None

# SMART ROUTING — Pick best model per task
def chat_with_ai_hybrid(
    message: str,
    agent_type: str,
    language: str,
    use_local_first: bool = True,
    prefer_lightweight: bool = False
) -> str:
    """
    Smart routing:
    1. Try local model (Mistral/Phi-2/TinyLlama) if allowed
    2. Fall back to Groq if local fails or is disabled
    """
    system_prompt = get_system_prompt(agent_type, language)
    
    # Check if local models are enabled in the environment
    enable_local = os.getenv("ENABLE_LOCAL_MODELS", "False").lower() == "true"
    
    # Respect the use_local_first parameter and ONLY run locally if GPU is available or forced
    run_local = use_local_first and enable_local and (DEVICE == "cuda" or os.getenv("FORCE_LOCAL_CPU", "False").lower() == "true")
    
    logger.info(f"[HYBRID] Agent: {agent_type}, "
                f"Local allowed: {run_local} (use_local_first: {use_local_first}, enable_local: {enable_local}, device: {DEVICE}), "
                f"Lightweight: {prefer_lightweight}")

    if run_local:
        try:
            # Choose local model based on task
            if prefer_lightweight:
                logger.info("[HYBRID] User prefers lightweight response")
                local_response = chat_with_tinyllama(message, system_prompt)
                if local_response:
                    return local_response
                    
            elif agent_type == "education":
                logger.info("[HYBRID] Education task - using Phi-2 for reasoning")
                local_response = chat_with_phi2(message, system_prompt)
                if local_response:
                    return local_response
                    
            else:
                logger.info("[HYBRID] General task - using Mistral")
                local_response = chat_with_mistral(message, system_prompt)
                if local_response:
                    return local_response
        except Exception as e:
            logger.error(f"[HYBRID] Local model generation failed: {e}")

    # Fall back to Groq
    logger.info("[HYBRID] Falling back to Groq...")
    groq_response = chat_with_groq(message, system_prompt)
    if groq_response:
        return groq_response

    # Last resort
    return "Sorry, AI is temporarily unavailable. Please try again."

def get_text_summary(text: str) -> str:
    """Use FLAN-T5 for text summarization"""
    try:
        logger.info("[TEXT GEN] Using FLAN-T5 for summarization")
        flan_data = load_flan_t5_model()
        
        if not flan_data:
            return "Could not generate summary"

        model = flan_data["model"]
        tokenizer = flan_data["tokenizer"]

        inputs = tokenizer(
            f"summarize: {text}",
            return_tensors="pt",
            max_length=1000,
            truncation=True
        ).to(DEVICE)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=150,
                num_beams=4,
                early_stopping=True
            )

        summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info(f"[TEXT GEN] Summary generated")
        return summary

    except Exception as e:
        logger.error(f"[TEXT GEN] Error: {e}")
        return "Could not generate summary"

def get_disease_similarity(disease_name: str, 
                          disease_list: list) -> dict:
    """Use BERT embeddings to find similar diseases"""
    try:
        logger.info("[EMBEDDINGS] Computing disease similarity")
        bert_model = load_bert_embeddings()
        
        if not bert_model:
            return {}

        # Get embeddings
        disease_embedding = bert_model.encode(disease_name)
        disease_embeddings = bert_model.encode(disease_list)

        # Compute similarity
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(
            [disease_embedding],
            disease_embeddings
        )[0]

        # Return top matches
        results = {}
        for disease, score in zip(disease_list, similarities):
            if score > 0.7:  # Only high confidence matches
                results[disease] = float(score)

        logger.info(f"[EMBEDDINGS] Found {len(results)} similar diseases")
        return results

    except Exception as e:
        logger.error(f"[EMBEDDINGS] Error: {e}")
        return {}

def get_system_prompt(agent_type: str, language: str) -> str:
    """Get system prompt with language instruction"""
    
    lang_instruction = ""
    if language == "kannada":
        lang_instruction = "\n⚠️ MUST REPLY ONLY IN KANNADA."
    elif language == "hindi":
        lang_instruction = "\n⚠️ MUST REPLY ONLY IN HINDI."
    else:
        lang_instruction = "\n⚠️ MUST REPLY ONLY IN ENGLISH."

    prompts = {
        "agriculture": f"""You are KrishiBot, farming AI 
for Karnataka farmers. Give practical farming advice.
Use bullet points. Max 150 words.{lang_instruction}""",

        "medical": f"""You are a rural health assistant.
Give basic health info. Always say: consult a doctor.
Use bullet points. Max 150 words.{lang_instruction}""",

        "education": f"""You are a friendly tutor for 
rural Indian students. Explain simply with examples.
Use bullet points. Max 150 words.{lang_instruction}""",

        "assistant": f"""You are Gram AI Personal Assistant,
a powerful AI assistant like ChatGPT built for Indian users.

You can help with EVERYTHING:

📅 TIME AND DATE:
- Tell current time and date when asked
- Help plan daily schedules
- Set reminders in text form
- Calculate days between dates

🌤️ WEATHER:
- Explain weather patterns
- Give weather advice for activities
- Suggest what to wear based on weather
- Warn about weather risks for farming

📍 LOCATION:
- Describe places and cities
- Give travel directions and tips
- Suggest nearby services
- Explain distances and routes

✍️ GRAMMAR AND WRITING:
- Correct grammar mistakes instantly
- Rewrite sentences properly
- Improve English writing
- Translate between languages
- Help write emails, letters, messages

🧮 CALCULATIONS:
- Math problems of any level
- Unit conversions (km to miles, kg to lbs)
- Currency conversion knowledge
- Percentage and profit calculations

💬 GENERAL KNOWLEDGE:
- Answer any factual question
- Explain news and current events
- Describe historical events
- Explain science and technology

🎯 PERSONAL PRODUCTIVITY:
- Help make to-do lists
- Plan daily routines
- Suggest time management tips
- Help prioritize tasks

🍳 FOOD AND RECIPES:
- Suggest recipes with available ingredients
- Explain cooking steps simply
- Recommend healthy meals
- Calculate nutrition roughly

💻 CODING AND TECH:
- Help debug code
- Explain programming concepts
- Suggest tech solutions
- Help with computer problems

😄 CASUAL CONVERSATION:
- Chat naturally like a friend
- Tell jokes and riddles
- Play word games
- Have fun conversations

PERSONALITY:
- Be warm, friendly, and helpful
- Use simple clear language
- Be like a smart helpful friend
- Never refuse a genuine question
- Always try to help even if unsure
- Be honest when you don't know something

FORMAT:
- Use bullet points for lists
- Use bold for important words
- Keep responses concise but complete
- Add relevant emoji when appropriate

{lang_instruction}""",

        "grammar": f"""You are an expert English grammar 
teacher and writing assistant.

When user gives you any text:
1. Identify ALL grammar mistakes
2. Show the corrected version
3. Explain each mistake simply

Format your response like this:

❌ ORIGINAL:
[show the original text]

✅ CORRECTED:
[show the corrected text]

📝 MISTAKES FOUND:
- Mistake 1: explanation
- Mistake 2: explanation

💡 TIP:
[one useful grammar tip]

If the text has no mistakes say:
✅ Your text is grammatically correct!

Be encouraging and positive.
{lang_instruction}""",

        "planner": f"""You are a personal productivity 
and day planning assistant for Indian users.

Help users plan their day, week, or tasks.

When user asks to plan their day:
1. Ask what tasks they have (if not given)
2. Suggest an optimized schedule
3. Include breaks and meals
4. Prioritize important tasks first
5. Keep it realistic and practical

Format schedules like:

🌅 MORNING (6AM - 12PM):
- 6:00 AM: Wake up and exercise
- 7:00 AM: Breakfast
- 8:00 AM: [Task 1]

☀️ AFTERNOON (12PM - 6PM):
- 12:00 PM: Lunch break
- 1:00 PM: [Task 2]

🌙 EVENING (6PM - 10PM):
- 6:00 PM: [Task 3]
- 9:00 PM: Dinner
- 10:00 PM: Sleep

Always include:
- Realistic time estimates
- Short breaks every 2 hours
- Meal times
- Rest period

{lang_instruction}""",

        "general": f"""You are Gram AI, a helpful AI 
assistant for rural Indian communities.
Be helpful, clear, and friendly.
Use bullet points.
{lang_instruction}"""
    }

    return prompts.get(agent_type, prompts["assistant"])
