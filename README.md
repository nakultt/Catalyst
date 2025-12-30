<p align="center">
  <h1 align="center">🚀 Catalyst</h1>
  <p align="center">
    <strong>AI-Powered Startup Funding Intelligence Platform</strong>
  </p>
  <p align="center">
    Empowering Indian startups with intelligent funding navigation, investor matching, and pitch analysis
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangChain-0.3-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
</p>

---

## ✨ Features

### 📊 **Dashboard**
Real-time funding readiness overview with:
- **Funding Probability Score** — AI-calculated likelihood of securing funding
- **Investor Matching** — Discover investors aligned with your sector and stage
- **Eligible Schemes** — Government schemes and programs you qualify for
- **Recommended Actions** — Prioritized steps to improve your funding prospects

### 🤖 **Catalyst AI (AI Assistant)**
Your intelligent startup funding companion:
- Natural language conversations about funding strategies
- Powered by **LangChain** + **Google Gemini**
- **GraphRAG** integration for context-aware responses using knowledge graph
- Real-time investor and scheme recommendations

### 🗺️ **Funding Route Map**
Visual journey planner for your funding path:
- Step-by-step guidance from ideation to funding
- Stage-appropriate milestones and checkpoints
- Personalized recommendations based on your startup profile

### 📡 **Opportunities Radar**
Discover funding opportunities tailored to you:
- Live tracking of relevant funding programs
- AI-powered match scores
- Filter by sector, stage, and location
- Government scheme eligibility checker

### 🎤 **Pitch Analyzer**
Computer vision-powered pitch practice tool:
- **Real-time confidence scoring** using MediaPipe Face Mesh
- **Eye contact tracking** — Are you engaging your audience?
- **Head position analysis** — Maintain confident body language
- Detailed feedback to improve your investor pitch
- Scheme eligibility verification with document upload

---

## 🏗️ Architecture

```
catalyst/
├── 📁 src/                     # React Frontend
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Application pages
│   │   ├── Dashboard.tsx       # Funding overview
│   │   ├── SahayakAI.tsx       # AI chatbot interface
│   │   ├── RouteMap.tsx        # Funding journey planner
│   │   ├── Opportunities.tsx   # Opportunities radar
│   │   └── PitchAnalyzer.tsx   # Pitch practice tool
│   └── App.tsx                 # Main app with routing
│
├── 📁 backend/                 # FastAPI Backend
│   ├── main.py                 # API entry point
│   ├── config.py               # Configuration management
│   ├── data_loader.py          # Seed data loader
│   ├── seed_data.json          # Knowledge graph seed data
│   ├── routers/                # API route handlers
│   │   ├── chatbot.py          # AI chat endpoints
│   │   ├── dashboard.py        # Dashboard data
│   │   ├── opportunities.py    # Opportunities API
│   │   ├── pitch.py            # Pitch analysis
│   │   ├── route_map.py        # Route map data
│   │   └── schemes.py          # Scheme eligibility
│   └── services/               # Business logic
│       ├── langchain_service.py   # LangChain + Gemini integration
│       ├── knowledge_graph.py     # In-memory knowledge graph
│       ├── neo4j_service.py       # Neo4j graph database
│       ├── pitch_analyzer.py      # CV-based pitch analysis
│       └── route_generator.py     # Funding route generation
│
└── 📄 Configuration Files
    ├── package.json            # Frontend dependencies
    ├── vite.config.ts          # Vite configuration
    ├── tailwind.config.js      # Tailwind CSS config
    └── tsconfig.json           # TypeScript config
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Google Gemini API Key** — [Get one here](https://makersuite.google.com/app/apikey)
- *(Optional)* **Neo4j Database** for production knowledge graph

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/catalyst.git
cd catalyst
```

### 2️⃣ Setup Backend

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

### 3️⃣ Setup Frontend

```bash
# Back to root directory
cd ..

# Install dependencies
npm install
```

### 4️⃣ Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

🎉 **Open [http://localhost:5173](http://localhost:5173)** and start exploring!

---

## ⚙️ Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
# Required — AI Features
GOOGLE_API_KEY=your_gemini_api_key_here

# Production — Your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app

# Optional — Neo4j (for production)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# Application
DEBUG=false
```

**Frontend** (Vercel Environment Variables):
```env
VITE_API_URL=https://your-render-backend.onrender.com
```

---

## ☁️ Deployment

### Deploy to Vercel (Frontend)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repository
3. Set **Root Directory** to `.` (root)
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
5. Deploy!

### Deploy to Render (Backend)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `GOOGLE_API_KEY` = Your Gemini API key
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `DEBUG` = `false`
5. Deploy!

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Fetch dashboard metrics |
| `/api/chat` | POST | Send message to Sahayak AI |
| `/api/route-map` | GET | Get funding route map |
| `/api/opportunities` | GET | List funding opportunities |
| `/api/analyze-pitch` | POST | Analyze pitch video frame |
| `/api/check-eligibility` | POST | Check scheme eligibility |
| `/api/graph/stats` | GET | Knowledge graph statistics |
| `/api/graph/sync` | POST | Sync Neo4j database |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool & Dev Server |
| **Tailwind CSS** | Styling |
| **React Router** | Navigation |
| **Lucide React** | Icons |
| **Supabase JS** | Authentication (future) |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | API Framework |
| **LangChain** | LLM Orchestration |
| **Google Gemini** | Large Language Model |
| **Neo4j** | Graph Database |
| **MediaPipe** | Face Mesh Detection |
| **OpenCV** | Computer Vision |
| **Pydantic** | Data Validation |

---

## 📸 Screenshots

> *Coming soon! Run the app locally to explore the beautiful UI.*

---

## 🗺️ Roadmap

- [ ] User authentication with Supabase
- [ ] Persistent chat history
- [ ] Mobile responsive design improvements
- [ ] Multi-language support
- [ ] Advanced pitch metrics (speech analysis)
- [ ] Investor CRM integration
- [ ] Export reports to PDF
- [ ] Push notifications for opportunities

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [LangChain](https://langchain.com/) — LLM orchestration framework
- [Google Gemini](https://ai.google.dev/) — Powerful AI model
- [MediaPipe](https://mediapipe.dev/) — ML solutions for live and streaming media
- [Startup India](https://www.startupindia.gov.in/) — Inspiration for scheme data

---

<p align="center">
  <strong>Built with ❤️ for the Indian Startup Ecosystem</strong>
</p>

<p align="center">
  <a href="#-catalyst">Back to Top ↑</a>
</p>
