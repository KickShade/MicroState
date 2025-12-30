# **MicroState (μState)**  
## Real-Time Market Microstructure Analytics & Prediction System

> **MicroState (μState)** is a production-style, real-time system that reconstructs the Level-2 limit order book, computes event-driven microstructure features, and performs live machine-learning inference on streaming market data.

---

## 🚀 Overview

Electronic markets operate at **microsecond timescales**, where price formation is driven by **order flow, queue dynamics, and liquidity imbalance**, not classical time-series indicators.

**MicroState (μState)** models markets at the **microstructure level** by maintaining an in-memory market state and updating features and predictions **incrementally** as events arrive.

This project is designed as a **streaming system**, not a notebook or static backtest.

---

## 🎯 Key Capabilities

- 📊 **Level-2 limit order book reconstruction**
- ⚙️ **Event-driven market state management**
- 📈 **Incremental microstructure feature extraction**
- 🤖 **Online machine-learning inference**
- 🔌 **FastAPI + WebSocket real-time streaming**
- 🔁 **Deterministic replay & evaluation**
- 🐳 **Containerized deployment**

---

## 🧠 High-Level Architecture

Market Data (Live / Replay)
↓
L2 Order Book Reconstruction
↓
Event-Driven Feature Engine
↓
Online ML Inference
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
- Event-conditioned statistics
- Time-windowed dynamics

> ❌ No bar aggregation  
> ❌ No look-ahead bias  
> ❌ No feature leakage  

---

## 🤖 Machine Learning

The ML pipeline focuses on **short-horizon price movement prediction**:

- Supervised labels derived from future mid-price movement
- Baseline models (e.g., gradient-boosted trees)
- Offline evaluation via deterministic replay
- Models designed to be **online-inference compatible**

> Predictions are treated as **signals**, not trades.

---

## ⚡ Real-Time API Layer

MicroState exposes predictions through:

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

