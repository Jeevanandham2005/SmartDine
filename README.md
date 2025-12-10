# 🍽️ SmartDine - AI-Powered Food Discovery
SmartDine is a full-stack web application that helps users discover the best restaurants in their city using AI. It combines a MERN Stack (MongoDB, Express, React, Node.js) with a Python backend (Google Gemini API) to provide witty, context-aware restaurant recommendations.



## 🚀 Features
**AI Recommendations**: Uses Google Gemini to generate unique, appetizing reasons for every restaurant choice.
**City Autocomplete**: Intelligent dropdown to search for supported cities.
**Smart Filtering**: Filter by specific cravings or use "Surprise Me" mode for random picks.
**Secure Authentication**: User Signup & Login with password encryption, validation, and visibility toggles.
**Interactive UI**: Attractive animations, glassmorphism design, and responsive layout.



## 🛠️ Tech Stack
**Frontend**: React.js, Vite, CSS3
**Backend**: Node.js, Express.js
**AI Engine**: Python, Google Gemini 1.5 Flash
**Database**: MongoDB Atlas (or Local MongoDB)



## ⚙️ Setup & Installation

1. Clone the Repository

    git clone <YOUR_REPO_URL_HERE>
    cd SmartDine


2. Backend Setup (Node.js)
Install the server dependencies.

    npm install


3. Frontend Setup (React)
Navigate to the client folder and install dependencies.

    cd client
    npm install
    cd ..  # Return to the root folder


4. Python Setup (AI Engine)
Ensure you have Python installed, then install the required libraries.

    pip install pymongo google-generativeai python-dotenv certifi



## 🔐 Environment Configuration (Crucial)
This project relies on environment variables for security. You must create a .env file in the ROOT directory.
Create a file named .env
Paste the following template and fill in your real keys:

Code snippet:
#Database Connection
MONGO_URI=your_mongodb_connection_string

#AI Service Configuration
GEMINI_API_KEY=your_google_gemini_api_key



## 🗄️ Data & Utilities Setup (Run Once)
Before running the app, you must populate the database and generate the city list for the frontend.

1. Upload Restaurant Data to MongoDB Ensure restaurants.csv is in the root folder, then run:

    python upload_data.py


2. Generate City List Run this script to create the cities.json file used by the search bar:

    python get_cities.py


## 🏃‍♂️ Running the Application
You need to run the Backend and Frontend in two separate terminals.

Terminal 1: Start Backend (Server + AI)
From the root directory:

    node server.js

You should see: "Server running on port 5000" and "MongoDB Connected".


Terminal 2: Start Frontend
From the root directory:

    cd client
    npm run dev
The app will launch in your browser (usually http://localhost:5173).



## 📝 Usage Guide
**Sign Up**: Create a new account (Password must be 8+ chars with at least 1 special symbol).
**Login**: Access the main dashboard.
**Search**:
**City**: Select a city from the dropdown (e.g., "Coimbatore").
**Craving**: Type what you want (e.g., "Spicy Biryani" or "Comfort food").
**Results**: The AI will return the best matches and explain why it picked them!



##⚠️ Troubleshooting
**"No restaurants found"**: Ensure you ran python upload_data.py and that your City name matches the CSV data.
**Dropdown Empty**: Ensure you ran python get_cities.py to generate the city list.
**API Errors**: Check if your GEMINI_API_KEY in .env is valid and has quota remaining.
**Connection Refused**: Ensure MongoDB is running and your IP is whitelisted in MongoDB Atlas.
