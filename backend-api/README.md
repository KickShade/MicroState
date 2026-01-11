# **MicroState (μState)**  
## Real-Time Market Microstructure Analytics & Prediction System

> **MicroState (μState)** is a production-style, real-time system that reconstructs the Level-2 limit order book, computes event-driven microstructure features, and performs live machine-learning inference on streaming market data.
> The system is designed to **separate instantaneous order-flow pressure from short-term price context**, enabling interpretable, multi-timescale market understanding.
---

## 🚀 Overview

Electronic markets operate at **microsecond timescales**, where price formation is driven by **order flow, queue dynamics, and liquidity imbalance**, not classical time-series indicators.

**MicroState (μState)** models markets at the **microstructure level** by maintaining an in-memory market state and updating features and predictions **incrementally** as events arrive.

This project is designed as a **streaming system**, not a notebook or signal-only prototype.

---

## 🎯 Key Capabilities

- 📊 **Level-2 limit order book reconstruction**
- ⚙️ **Event-driven market state management**
- 📈 **Incremental microstructure feature extraction**
- 🤖 **Online machine-learning inference**
- 🔌 **FastAPI + WebSocket real-time streaming (short horizon)**
- 🧭 **Mid-term price context estimation (trend & uncertainty)**
- 🧠 **Deterministic multi-signal interpretation layer**
- 🔁 **Deterministic replay & evaluation**
- 🐳 **Containerized deployment**

---
## 🧠 System Design Philosophy

- MicroState is built around a multi-timescale separation of concerns:

| Component            | Timescale     | Purpose                                       |
| -------------------- | ------------- | --------------------------------------------- |
| Microstructure ML    | 1–5 seconds   | Detect instantaneous order-flow pressure      |
| Price Context Model  | 15–30 minutes | Estimate short-term price drift & uncertainty |
| Interpretation Layer | N/A           | Combine signals into human-meaningful context |


- Models are not merged or ensembled.
- Signals remain independent and are combined only at the interpretation layer to avoid horizon leakage and false confidence.

---

## 🧠 High-Level Architecture

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
Dashboards / Strategy Simulators / Clients


All components operate in **event time** and are designed for **low latency, correctness, and reproducibility**.

---

## 📁 Project Structure

lob-microstructure-analysis/
│
├── src/
│ ├── core/ # Order book state & mechanics
│ ├── ingestion/ # Market data ingestion & parsing
│ ├── features/ # Incremental feature computation
│ ├── ml/ # Models, labels, training logic
│ ├── api/ # FastAPI & WebSocket layer
│ ├── models/ # Trained model artifacts
│ └── utils/ # Shared utilities
│
├── data/
│ ├── raw/ # Raw exchange data
│ ├── processed/ # Replayable market streams
│ └── features/ # Feature datasets
│
├── scripts/ # Training, replay, evaluation scripts
├── tests/ # Unit & integration tests
├── configs/ # Configuration files
└── README.md


---

## 📊 Microstructure Features

Features are computed **incrementally** and aligned with real-time constraints:

- Best bid / ask
- Spread & mid-price
- Top-N depth aggregation
- Order book imbalance
- Rolling volatility
- Rolling mid-price returns
- Event-conditioned statistics
- Time-windowed dynamics

> ❌ No bar aggregation  
> ❌ No look-ahead bias  
> ❌ No feature leakage  

---

## 🤖 Machine Learning

Microstructure Model
- Short-horizon supervised prediction (≈1s)
- Labels derived from future mid-price movement
- Models optimized for online inference
- Predictions treated as pressure signals, not trades

Price Context Model
- Trained on mid-price derived from L2 data
- Estimates short-term trend direction and uncertainty
- Used strictly for context, not execution

Numerical price forecasts are intentionally downgraded into directional context.

---

## 🧠 Signal Interpretation Layer
The system includes a deterministic signal aggregation module that interprets alignment or conflict between signals:

| Microstructure | Price Context | Interpretation               |
| -------------- | ------------- | ---------------------------- |
| UP             | BULLISH       | Strong bullish alignment     |
| UP             | BEARISH       | Counter-trend buying (risky) |
| DOWN           | BULLISH       | Pullback within uptrend      |
| DOWN           | BEARISH       | Strong bearish alignment     |

This layer converts model outputs into human-readable market meaning.

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

---

## 🐳 Deployment

The system is fully containerized for reproducibility.


```bash
docker compose up
```
## 🧩 Runtime Components

This setup launches the following services:
- Market data ingestion or replay
- Inference engine
- API server
- No local Python environment setup is required.

## 🧪 Testing & Validation

- The system is tested with an emphasis on streaming correctness, not just offline metrics.
- Order book consistency checks
- Integration tests for market data ingestion
- Replay-based validation of inference behavior

This ensures correctness under real-time and replayed streaming conditions.

## 🗺️ Project Phases
✅ Completed

- L2 order book reconstruction
- Event-driven feature engine
- ML foundation
- Streaming inference engine
- Multi-timescale price context model
- Signal aggregation layer
- FastAPI + WebSocket API

## 🚧 In Progress / Planned
- Live frontend dashboard
- Strategy simulation & PnL evaluation
- Latency monitoring
- Feature drift monitoring
- Extended replay-based evaluation harness

## 📈 What This Project Demonstrates
- Deep understanding of market microstructure
- Real-time systems engineering
- Practical machine learning deployment
- Clean, phase-driven project design
- Production-grade Git and code hygiene

## ⚠️ Disclaimer
This project is for educational and research purposes only.
It is not financial advice and is not intended for live trading.

