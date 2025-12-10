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
    MODEL_NAME = 'gemini-2.5-flash'
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
    prompt = f"""
    You are a witty and knowledgeable local food critic for {user_city}.
    
    USER REQUEST: "{user_query}"
    CANDIDATE RESTAURANTS: {json.dumps(candidates)}

    STRICT INSTRUCTIONS FOR THE 'reason' FIELD:
    1. PROHIBITED: Do NOT simply repeat the user's query. (e.g., If user asks for "Comfort food", do NOT say "Good for comfort food".)
    2. REQUIRED: Mention specific details from the restaurant's Cuisine or Rating.
    3. STYLE: Be appetizing and specific. Instead of "Good place", say "Known for their authentic flavors and high rating."
    4. If the User Request is empty or generic, highlight the restaurant's best feature.
    5. Keep it under 25 words.

    OUTPUT FORMAT (JSON ARRAY ONLY):
    [
        {{
            "name": "Restaurant Name",
            "rating": "4.5",
            "cuisine": "Italian, Pizza",
            "cost": "1200",
            "address": "Full Address",
            "reason": "Famous for their wood-fired pizzas that melt in your mouth; a top-rated choice for Italian lovers."
        }}
    ]
    """

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt, generation_config={"temperature": 0.3})
        
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(clean_text)
        
        if isinstance(parsed_data, list) and len(parsed_data) > 0 and "error" not in parsed_data[0]:
            return json.dumps(parsed_data[:limit])
            
        return clean_text

    except Exception as e:
        error_str = str(e)
        # --- QUOTA ERROR HANDLING ---
        if "429" in error_str or "quota" in error_str.lower():
            return json.dumps([{"error": "⚠️ Traffic is high (Google API Quota). Please wait 30 seconds and try again!"}])
        
        return json.dumps([{"error": "AI formatting error. Please try again."}])

if __name__ == '__main__':
    query_arg = sys.argv[1] if len(sys.argv) > 1 else ""
    city_arg = sys.argv[2] if len(sys.argv) > 2 else ""
    limit_arg = sys.argv[3] if len(sys.argv) > 3 else "3"
    page_arg = sys.argv[4] if len(sys.argv) > 4 else "1"
    
    print(get_recommendation(query_arg, city_arg, limit_arg, page_arg))