import json
import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

# Destination for React
OUTPUT_FILE = "client/src/cities.json"

# Load Env for Mongo URI
load_dotenv()

def extract_cities_from_db():
    print("🔌 Connecting to MongoDB...")
    try:
        client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
        db = client["SmartDineDB"]
        collection = db["restaurants"]
        
        # Fast query to get all unique cities
        print("🔍 Fetching unique cities...")
        cities = collection.distinct("City")
        
        # Clean and Sort
        cleaned_cities = sorted([c.strip() for c in cities if c])
        
        # Save to Frontend
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, "w") as f:
            json.dump(cleaned_cities, f)
            
        print(f"✅ Success! Extracted {len(cleaned_cities)} cities from MongoDB to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    extract_cities_from_db()