# Around-the-world

github link: https://github.com/alengeorgemartin/Around-the-world.git

Listed directory Around-the-world
Viewed package.json:1-66
Listed directory server
Viewed package.json:1-32
Viewed README.md
Viewed .env:1-4
Listed directory Around-the-world
Listed directory src
Searched for "import.meta.env"
Viewed vite.config.js:1-15
Edited README.md

### Prerequisites
Before running the project, they need:
- **Node.js** installed on their computer (v16 or higher).
- **MongoDB** installed and running locally on the default port `27017` (or they can use a cloud MongoDB Atlas URI).

### Getting Started

First, they will clone the repository and navigate into the project directory:
```bash
git clone <your-github-repo-url>
cd Around-the-world
```

### 1. Setup the Backend Server
The backend handles API requests, database connections, and AI interactions. They will need to run the following commands:

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory to configure the environment variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/ai_trip_planner
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
   > **Note:** They will need to put in their own valid Google Gemini API key for the AI itinerary generation features to function properly.

4. Start the backend server:
   ```bash
   npm start
   ```

### 2. Setup the Frontend Client
The frontend is built using React and Vite. They should open a **new terminal window** in the main project directory (`Around-the-world`).

1. Install the frontend dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. The application will normally launch in the default browser at `http://localhost:5173`. 

### Summary for Running
They need to keep **both terminal windows running concurrently** — one with `npm start` running in the `server` directory and one with `npm run dev` running in the root directory.
