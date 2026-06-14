# Campus OS 🎓

A fully local student academic assistant. No cloud, no accounts — just your data on your machine.

**Features:** Attendance Tracker · Smart Notes with AI · Notice Board · Community Chat

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt && uvicorn main:app --reload
```

The SQLite database is auto-created on first run with sample data.  
Backend runs on **http://localhost:8000**

### 2. Start the Frontend

```bash
cd frontend
npm install && npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Optional: Enable AI Features

AI-powered note summarisation, auto-tagging, and tag-scoped chat require [Ollama](https://ollama.ai) running locally:

```bash
brew install ollama        # Install (macOS)
ollama pull llama3.1       # Download model (~4.7 GB)
ollama serve               # Start server on port 11434
```

> The app works fully without Ollama — AI features will show a friendly error if it's not running.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend  | FastAPI + SQLite (aiosqlite)      |
| AI       | Ollama (Llama 3.1 8B, local)     |

---

## Project Structure

```
campus-os/
├── backend/
│   ├── main.py              # FastAPI endpoints
│   ├── database.py           # SQLite schema + seed data
│   ├── ollama_client.py      # Ollama AI helper
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Root layout
│   │   ├── api.js            # API client
│   │   ├── index.css         # Design system
│   │   └── components/       # All UI components
│   ├── index.html
│   └── package.json
└── README.md
```
