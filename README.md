# MicroState (μState)
**Real-Time Market Microstructure Analytics & Prediction System**

MicroState (μState) is a production-style, real-time system that reconstructs the Level-2 limit order book, computes event-driven microstructure features, and performs live machine-learning inference on streaming market data. The system is designed to separate instantaneous order-flow pressure from short-term price context, enabling interpretable, multi-timescale market understanding.

---

## 🚀 Overview

Electronic markets operate at microsecond timescales, where price formation is driven by order flow, queue dynamics, and liquidity imbalance, not classical time-series indicators.

MicroState (μState) models markets at the microstructure level by maintaining an in-memory market state and updating features and predictions incrementally as events arrive.

This project is designed as a **streaming system**, not a notebook or signal-only prototype.

---

## 🎯 Key Capabilities

- 📊 **Level-2 limit order book reconstruction**
- ⚙️ **Event-driven market state management**
- 📈 **Incremental microstructure feature extraction**
- 🤖 **Online machine-learning inference**
- 🔌 **FastAPI + WebSocket real-time streaming** (short horizon)
- 🧭 **Mid-term price context estimation** (trend & uncertainty)
- 🧠 **Deterministic multi-signal interpretation layer**
- 🔁 **Deterministic replay & evaluation**
- 🐳 **Containerized deployment**
- 🎨 **Real-time web dashboard with authentication**

---

## 🧠 System Design Philosophy

MicroState is built around a **multi-timescale separation of concerns**:

| Component | Timescale | Purpose |
|-----------|-----------|---------|
| **Microstructure ML** | 1–5 seconds | Detect instantaneous order-flow pressure |
| **Price Context Model** | 15–30 minutes | Estimate short-term price drift & uncertainty |
| **Interpretation Layer** | N/A | Combine signals into human-meaningful context |

**Models are not merged or ensembled.**  
Signals remain independent and are combined only at the interpretation layer to avoid horizon leakage and false confidence.

---

## 🏗️ High-Level Architecture

```
Market Data (Live / Replay)
          ↓
L2 Order Book Reconstruction
          ↓
Event-Driven Feature Engine
          ↓
Microstructure ML Inference (1s horizon)
          ↓
Mid-Price Stream
          ↓
Price Context Model (15–30m horizon)
          ↓
Signal Aggregator (Interpretation Layer)
          ↓
FastAPI + WebSocket API
          ↓
Web Dashboard / Strategy Simulators / Clients
```

All components operate in **event time** and are designed for **low latency, correctness, and reproducibility**.

---

## 📁 Project Structure

```
lob-microstructure-analysis/
│
├── src/
│   ├── core/          # Order book state & mechanics
│   ├── ingestion/     # Market data ingestion & parsing
│   ├── features/      # Incremental feature computation
│   ├── ml/            # Models, labels, training logic
│   ├── api/           # FastAPI & WebSocket layer
│   ├── models/        # Trained model artifacts
│   └── utils/         # Shared utilities
│
├── data/
│   ├── raw/           # Raw exchange data
│   ├── processed/     # Replayable market streams
│   └── features/      # Feature datasets
│
├── frontend/          # React/TypeScript dashboard
│   ├── src/
│   │   ├── pages/     # Landing, Auth, Dashboard pages
│   │   ├── context/   # Auth context & state management
│   │   └── lib/       # Supabase client configuration
│   └── public/        # Static assets
│
├── scripts/           # Training, replay, evaluation scripts
├── tests/             # Unit & integration tests
├── configs/           # Configuration files
└── README.md
```

---

## 📊 Microstructure Features

Features are computed **incrementally** and aligned with **real-time constraints**:

- Best bid / ask
- Spread & mid-price
- Top-N depth aggregation
- Order book imbalance
- Rolling volatility
- Rolling mid-price returns
- Event-conditioned statistics
- Time-windowed dynamics

**❌ No bar aggregation**  
**❌ No look-ahead bias**  
**❌ No feature leakage**

---

## 🤖 Machine Learning

### Microstructure Model
- Short-horizon supervised prediction (≈1s)
- Labels derived from future mid-price movement
- Models optimized for online inference
- Predictions treated as **pressure signals**, not trades

### Price Context Model
- Trained on mid-price derived from L2 data
- Estimates short-term trend direction and uncertainty
- Used strictly for **context**, not execution

**Numerical price forecasts are intentionally downgraded into directional context.**

---

## 🧠 Signal Interpretation Layer

The system includes a **deterministic signal aggregation module** that interprets alignment or conflict between signals:

| Microstructure | Price Context | Interpretation |
|----------------|---------------|----------------|
| UP | BULLISH | Strong bullish alignment |
| UP | BEARISH | Counter-trend buying (risky) |
| DOWN | BULLISH | Pullback within uptrend |
| DOWN | BEARISH | Strong bearish alignment |

This layer converts model outputs into **human-readable market meaning**.

---

## ⚡ Real-Time API Layer

MicroState exposes real-time state and intelligence via:

- **FastAPI** for HTTP endpoints
- **WebSockets** for real-time streaming inference

### Key Properties
- Event-aligned inference (update → features → prediction)
- Stateless API layer
- Stateful core engine

This enables:
- Live dashboards
- Strategy simulators
- Downstream consumers

### API Endpoints

| Endpoint | Method | Purpose | Update Rate |
|----------|--------|---------|-------------|
| `/orderbook` | GET | Live order book data | 1s |
| `/features` | GET | Microstructure features | 1s |
| `/prediction` | GET | ML predictions (1s horizon) | 1s |
| `/context/price` | GET | Price context (15m horizon) | 1s |
| `/metrics` | GET | System health metrics | 1s |
| `/interpretation` | GET | Signal aggregation layer | 1s |

---

## 🎨 Frontend Dashboard

### Tech Stack
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Supabase** for authentication & database
- **Real-time data** from FastAPI backend
- **Recharts** for data visualization
- **Lucide React** for icons

### Features

#### ✅ Landing Page
- Hero section showcasing key metrics
- Smooth animations and interactive hover effects
- Modern glassmorphism design with gradient backgrounds

#### ✅ Authentication System
- **Email/Password** signup and login
- **Google OAuth** integration
- User profile management via Supabase

#### ✅ Real-Time Dashboard
- **Live metrics** updating every 1 second:
  - Mid Price with trend indicator
  - Spread (absolute & percentage)
  - Order book imbalance
  - ML prediction confidence
- **Interactive Components**:
  - Order book visualization (bids/asks)
  - Price & Prediction chart (time series)
  - Microstructure features panel (1s horizon)
  - Price context panel (15m horizon)
  - AI interpretation with confidence scores
  - Liquidity profile heatmap
  - System status monitoring
  - Real-time event log

## 🐳 Deployment

### Backend Deployment
The system is fully containerized for reproducibility.

```bash
docker compose up
```

#### Runtime Components
This setup launches the following services:
- Market data ingestion or replay
- Inference engine
- API server

**No local Python environment setup is required.**

### Frontend Deployment
- **Platform**: Vercel
- **URL**: `https://microstate.vercel.app`
- **Build Command**: `npm run build`
- **Environment Variables**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Backend Server
- **Host**: `80.225.214.25:8000`
- **API Docs**: `http://80.225.214.25:8000/docs`
- **Health Check**: `http://80.225.214.25:8000/health`

---

## 🧪 Testing & Validation

The system is tested with an emphasis on **streaming correctness**, not just offline metrics.

- Order book consistency checks
- Integration tests for market data ingestion
- Replay-based validation of inference behavior

This ensures correctness under **real-time and replayed streaming conditions**.

---

## 🗺️ Project Phases

### ✅ Completed
- L2 order book reconstruction
- Event-driven feature engine
- ML foundation
- Streaming inference engine
- Multi-timescale price context model
- Signal aggregation layer
- FastAPI + WebSocket API
- Frontend dashboard with real-time data visualization

### 🚧 In Progress / Planned
- User preferences and customization
- Advanced charting with technical indicators
- Alert system for market events
- Strategy simulation & PnL evaluation
- Latency monitoring
- Feature drift monitoring
- Extended replay-based evaluation harness
- Mobile app (iOS/Android)
- Multi-asset support
- Historical data playback

---

## 📈 What This Project Demonstrates

- Deep understanding of **market microstructure**
- **Real-time systems engineering**
- Practical **machine learning deployment**
- **Full-stack development** (Python backend + React frontend)
- **Modern authentication** and user management
- Clean, **phase-driven project design**
- Production-grade **Git and code hygiene**
- **Scalable architecture** with separation of concerns
- **Event-driven design patterns**

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Supabase account (for authentication)

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/KickShade/MicroState.git

# Start the backend services
docker compose up -d

# Verify API is running
curl http://localhost:8000/health
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build
```

### Access the Application
- **Frontend**: `http://localhost:5173` (dev) or deployed URL
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`

---

## 🔐 Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://80.225.214.25:8000
```

### Backend (docker-compose.yml)
```yaml
environment:
  - EXCHANGE_API_KEY=your_key
  - EXCHANGE_API_SECRET=your_secret
  - MODEL_PATH=/app/models/microstructure_model.pkl
  - REDIS_URL=redis://redis:6379
```

---

## 📚 Documentation

- **API Documentation**: Available at `/docs` endpoint (Swagger UI)
- **Architecture Guide**: See `/docs/architecture.md`
- **Model Documentation**: See `/docs/models.md`
- **Frontend Components**: See `/README.md`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

**This project is for educational and research purposes only.**  
It is **not financial advice** and is **not intended for live trading**.

---

## 🙏 Acknowledgments

- Market microstructure research community
- Open-source libraries: FastAPI, React, Supabase, Tailwind CSS
- Exchange APIs for market data access

---

## 📞 Contact

For questions, suggestions, or collaborations:
- **GitHub Issues**: [Create an issue](https://github.com/KickShade/MicroState/issues)
- **Email**: [arjunharidasmaster123@gmail.com](mailto:arjunharidasmaster123@gmail.com), [danybinu2005@gmail.com](mailto:danybinu2005@gmail.com), [sanjanakozhipurath@gmail.com](mailto:sanjankozhipurath@gmail.com)

---

**Built with ❤️ for the quantitative finance community**
