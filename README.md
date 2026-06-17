# IKnowYou 🧠

> **A Privacy-First, Fully Local Personal Relationship Memory System**

IKnowYou is an offline-first application designed to help you remember the humans in your life without sacrificing your privacy. It tracks people you meet, their relationships to you, and the memories associated with them—all visualized as an interactive knowledge graph. 

Because your relationships are deeply personal, **IKnowYou operates entirely on your local machine.** No cloud APIs, no data mining, and no external dependencies once set up.

---

## ✨ Key Features

- **Fully Local & Private:** Zero external API calls. Everything runs natively on your machine using local models.
- **Intelligent Memory Extraction:** Leverages **Ollama** to automatically extract people, connections, and metadata from your notes. It falls back to robust regex rules if the LLM is unavailable.
- **Graph Knowledge Base:** Uses **Neo4j** to build an interconnected web of your relationships, seamlessly visualizing family trees, friend groups, and professional networks.
- **Semantic Vector Search:** Built-in **ChromaDB** combined with `sentence-transformers` allows you to search through your memories and person profiles using natural language. (e.g. *"Who did I meet last week?"*)
- **Interactive UI & Network Graphs:** A beautifully designed modern web interface providing intuitive tools for visualizing connections and managing your personal contacts.
- **Indian Cultural Resolver:** Culturally aware relationship resolution. The system understands complex Indian kinship terms like *Amma*, *Chithappa*, *Dada*, automatically mapping them to canonical relationship structures.


---

## 🛠️ Tech Stack 

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Next.js 14, Tailwind CSS, `react-force-graph-2d` | Modern React patterns with excellent performance and easy 2D interactive graph visualizations. |
| **Backend API** | FastAPI, Pydantic v2 | High-performance, async Python web framework with strict type validation. |
| **Graph Database** | Neo4j 5.x | Best-in-class for querying multi-hop relationship connections ("Who is my friend's brother?"). |
| **Vector DB** | ChromaDB | Highly efficient, serverless vector database to power semantic and similarity searches. |
| **Relational State** | SQLite | Lightweight embedded database for managing application state like pending connection confirmations. |
| **AI Extraction** | Ollama (Mistral 7B) | Local, uncensored LLM extraction ensuring zero personal data leaves your device. |
| **Embeddings** | `sentence-transformers` (`all-MiniLM-L6-v2`) | Small, highly capable local model for producing rich semantic vectors. |

---

## 🚀 Setup & Installation Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** 
- **Docker** (Required for running the Neo4j Graph DB container)
- **Ollama** installed locally (For LLM extraction)

### 1. Database Setup (Neo4j)
IKnowYou uses Neo4j to store the graph of your relationships. Start the database via Docker:
```bash
docker run -d --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/iknow_you_local neo4j:latest
```
*(Or use `docker-compose up -d neo4j` if you prefer the included docker-compose configuration).*

### 2. Pull Local AI Models
Ensure Ollama is running on your machine, then pull the necessary models for memory extraction:
```bash
ollama pull mistral:7b-instruct-q4_K_M
```

### 3. Backend Setup
Navigate to the backend directory, install the dependencies, and start the FastAPI server:
```bash
cd backend

# Create a virtual environment and activate it
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup
Navigate to the frontend directory, install dependencies, and start the Next.js development server:
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Visit **http://localhost:3000** in your browser to start building your personal relationship graph!

---

## 📖 How It Works

### The Data Flow of a Memory
1. **Input**: You type a memory log in the frontend (e.g. *"I met Ramesh uncle at the coffee shop"*).
2. **Extraction**: The text is passed to the FastAPI backend. Ollama parses the text into structured JSON, identifying entities (people), roles, and locations. 
3. **Cultural Resolution**: The `relation_resolver` scans extracted roles. If it detects a term like *"uncle"*, it maps it correctly in the graph structure.
4. **Storage & Indexing**: 
    - The memory text is instantly embedded via `sentence-transformers` and indexed into **ChromaDB**.
    - New Person Nodes and Relationship Edges are dynamically created and interconnected in **Neo4j**.
5. **Search & Visualization**: 
    - As you navigate to the Graph view, Neo4j is queried to render the web of connections.
    - When searching, ChromaDB finds semantic matches across all stored memories and automatically generated profiles.

---

## 📄 License
MIT License - Take back ownership of your digital memory.
