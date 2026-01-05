import sys
import os
import json
import random
import certifi
from pymongo import MongoClient
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure API
try:
    # KEEPING YOUR MODEL VERSION
    MODEL_NAME = 'gemini-2.5-flash-lite'
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    pass 

def get_recommendation(user_query, user_city, limit=3, page=1):
    try:
        client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
        db = client["SmartDineDB"]
        collection = db["restaurants"]
    except Exception as e:
        return json.dumps([{"error": "Database Connection Failed."}])

    try:
        limit = int(limit)
        page = int(page)
    except:
        limit = 3
        page = 1

    # --- STEP 1: VALIDATION ---
    is_surprise = False
    if user_query == "__SURPRISE__MODE__":
        is_surprise = True
        user_query = "Surprise me with a random restaurant recommendation."

    if not is_surprise:
        forbidden_topics = ["time", "weather", "president", "minister", "capital", "code", "math", "who is", "movie", "song"]
        if any(word in user_query.lower() for word in forbidden_topics):
            return json.dumps([{"error": "I can only answer food-related questions."}])

    # --- STEP 2: DB SEARCH ---
    query_filter = {}
    if user_city and user_city.strip():
        query_filter["City"] = {"$regex": f"^{user_city}", "$options": "i"}
    
    fetch_limit = 50 if is_surprise else max(20, limit * 5)
    skip_amount = 0 if is_surprise else (page - 1) * limit

    candidates = list(collection.find(query_filter, {"_id": 0})
                      .sort("Aggregate Rating", -1)
                      .skip(skip_amount)
                      .limit(fetch_limit))

    if not candidates:
        if page > 1:
            return json.dumps([{"error": "No more restaurants found on this page."}])
        else:
            return json.dumps([{"error": f"No restaurants found in '{user_city}'."}])

    # --- STEP 3: SURPRISE LOGIC ---
    if is_surprise:
        random_choice = random.choice(candidates)
        candidates = [random_choice]
        limit = 1

    # --- STEP 4: AI REASONING ---
# --- STEP 4: AI REASONING (UPDATED WITH GUARDRAILS) ---
    prompt = f"""
    You are a witty and knowledgeable local food critic for {user_city}.
    
    USER REQUEST: "{user_query}"
    CANDIDATE RESTAURANTS: {json.dumps(candidates)}

    STRICT INSTRUCTIONS:
    1. **SAFETY CHECK (CRITICAL):**
       - If the USER REQUEST is NOT related to food, dining, restaurants, hunger, or cravings (e.g., questions about politics, science, coding, general knowledge), YOU MUST REFUSE.
       - In this case, return a single JSON object with the name "⚠️ Food Only", the cuisine "System", and the reason: "I am a dedicated food critic. I cannot answer questions about {user_query}."

    2. **NORMAL MODE (If food related):**
       - Pick the best matching restaurants from the candidates.
       - Write a short, appetizing 'reason' (max 25 words).
       - Do not simply repeat the user's query.

    OUTPUT FORMAT (JSON ARRAY ONLY):
    [
        {{
            "name": "Restaurant Name",
            "rating": "4.5",
            "cuisine": "Italian, Pizza",
            "cost": "1200",
            "address": "Full Address",
            "reason": "Famous for their wood-fired pizzas; a top-rated choice for Italian lovers."
        }}
    ]
    """

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt, generation_config={"temperature": 0.3})
        
        # --- NEW ROBUST PARSING LOGIC (THE FIX) ---
        raw_text = response.text
        
        # This ignores "Here is the JSON:" and "Hope this helps!"
        # It finds the first '[' and the last ']' to extract ONLY the list.
        start_index = raw_text.find('[')
        end_index = raw_text.rfind(']')
        
        if start_index != -1 and end_index != -1:
            clean_text = raw_text[start_index : end_index + 1]
            parsed_data = json.loads(clean_text)
            
            if isinstance(parsed_data, list) and len(parsed_data) > 0:
                return json.dumps(parsed_data[:limit])
        
        # Debugging: If it fails, print what the AI actually said to the terminal
        print(f"⚠️ AI FORMAT FAIL. RAW RESPONSE: {raw_text}")
        return json.dumps([{"error": "AI response error. Please try again."}])

    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            return json.dumps([{"error": "⚠️ Traffic is high. Please wait 30 seconds."}])
        
        # Print error to terminal so you can see it
        print(f"🔥 SERVER ERROR: {error_str}")
        return json.dumps([{"error": "AI formatting error. Please try again."}])

if __name__ == '__main__':
    query_arg = sys.argv[1] if len(sys.argv) > 1 else ""
    city_arg = sys.argv[2] if len(sys.argv) > 2 else ""
    limit_arg = sys.argv[3] if len(sys.argv) > 3 else "3"
    page_arg = sys.argv[4] if len(sys.argv) > 4 else "1"
    
    print(get_recommendation(query_arg, city_arg, limit_arg, page_arg))