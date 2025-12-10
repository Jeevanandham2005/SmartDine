import pandas as pd
from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

# 1. Connect
client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client["SmartDineDB"]
collection = db["restaurants"]

# 2. Reset DB
try:
    collection.delete_many({})
    print("Old data cleared.")
except Exception as e:
    print(f"Error clearing data: {e}")

# 3. Load File
csv_file = "restaurants.csv"
print(f"Reading {csv_file}...")

try:
    df = pd.read_csv(csv_file, encoding='latin-1')
    
    # SAFETY STEP: Remove any accidental spaces in column names
    df.columns = df.columns.str.strip()

    # --- THE FIX IS HERE ---
    # We are using the standard Zomato dataset spellings (lowercase 'booking', 'delivery', etc.)
    # If your file is different, the code below will catch it and tell us EXACTLY what to fix.
    
    required_columns = [
        "Restaurant Name", "City", "Address", "Cuisines", 
        "Average Cost for two", "Currency", "Has Table booking", 
        "Has Online delivery", "Aggregate rating", "Rating text", "Votes"
    ]
    
    # Check if columns exist before proceeding
    missing_cols = [col for col in required_columns if col not in df.columns]
    
    if missing_cols:
        print("\n❌ CRITICAL ERROR: Column Name Mismatch!")
        print(f"Missing columns: {missing_cols}")
        print("\nHere are the ACTUAL columns in your file:")
        print(list(df.columns))
        print("\nCopy the list above and send it to Gemini so I can fix the spelling!")
        exit() # Stop the script

    # If all good, proceed!
    df_clean = df[required_columns].copy()

    # Standardize names for MongoDB (Optional: makes them nicer to use later)
    df_clean.rename(columns={
        "Has Table booking": "Has Table Booking",
        "Has Online delivery": "Has Online Delivery",
        "Aggregate rating": "Aggregate Rating",
        "Rating text": "Rating Text"
    }, inplace=True)

    df_clean.fillna("Not Available", inplace=True)
    data = df_clean.to_dict(orient='records')
    
    if data:
        collection.insert_many(data)
        print(f"✅ SUCCESS! Uploaded {len(data)} restaurants to MongoDB!")
    else:
        print("⚠️ File was empty.")

except FileNotFoundError:
    print(f"❌ ERROR: Could not find '{csv_file}'. Check the file name!")
except Exception as e:
    print(f"❌ UNEXPECTED ERROR: {e}")