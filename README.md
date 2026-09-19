# BreakPoint — System Failure Simulator

**BreakPoint** is an interactive visual simulator that models cascading failures in distributed systems and microservice architectures. It helps engineers and learners understand how a failure in a single upstream component ripples through dependent services and how recovery strategies (Restart, Failover to Backup, Circuit Breaking) can mitigate outages.

---

## 🌟 Features

1. **Interactive Visual Network Canvas (`@xyflow/react`)**:
   - Draggable, zoomable topology diagram with custom service cards.
   - Dynamic status badges & glow animations:
     - 🟢 **Healthy**: Component operational.
     - 🔴 **Root Failure**: The trigger component disabled.
     - 🟠 **Cascaded Failure**: Broken due to hard dependency failure.
     - 🟡 **Degraded**: Operating in fallback mode (soft dependency down).
     - 🔵 **Failover Active**: Traffic rerouted to redundant backup.
   - Dynamic edge lines that turn red and dashed when dependency links break.

2. **Cascade Simulation Engine (Python FastAPI)**:
   - Evaluates reverse dependency traversal layer by layer.
   - Distinguishes **Hard Dependencies** (service crashes) from **Soft Dependencies** (service degrades).
   - Computes real-time **Blast Radius %** and health distribution counters.
   - Step-by-step **Wave Animation** to watch the domino effect unfold.

3. **3 Real-World Recovery Strategies**:
   - 🔄 **Restart**: Reboots the root failed component to restore operational state.
   - 🛡️ **Failover**: Reroutes callers to warm standby / backup replicas if configured.
   - ⚡ **Circuit Breaker**: Isolates the failed service so parent services degrade gracefully instead of crashing.

4. **System Builder**:
   - Add custom services (Gateway, Service, Database, Cache, Queue, Third-Party).
   - Connect services with custom dependencies (Hard vs. Soft).
   - Link redundant backups and test resilience.

5. **Pre-Built Realistic Scenarios**:
   - **E-Commerce Checkout & Payments**: Demonstrates third-party payment gateway failures and database outages.
   - **Microservices with Cache & DB Cluster**: Explores Redis cache bypass and master database failover.
   - **Financial Transaction & Fraud Pipeline**: Simulates high-reliability banking infrastructure with multi-site disaster recovery.

---

## 🚀 Quick Start (Local Setup)

### Option 1: One-Click Run (Windows)
Double-click `run.bat` in the root folder. It opens two command windows: one for the backend and one for the frontend.

---

### Option 2: Manual Start

#### 1. Start Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing the Simulator

1. **Trigger a Failure**:
   - Select a scenario from the dropdown (e.g. `E-Commerce Checkout & Payments`).
   - Pick `Stripe Payment Gateway` or `Inventory PostgreSQL` from the target dropdown (or click the card directly).
   - Click **Simulate Failure**.
   - Watch the animated red pulses and lines cascade upstream through `Order Service`, `API Gateway`, `Cloud CDN`, and the `Client`.
   - Inspect the **Blast Radius %** and **Cascade Timeline** in the right-side metrics panel.

2. **Test Recovery Options**:
   - Click **Failover** to observe traffic rerouting to `PayPal Backup Gateway` or the standby database replica. Dependent services recover to 🟢 Healthy.
   - Click **Restart** to reboot the component cleanly.
   - Click **Circuit Breaker** to isolate the failed dependency, keeping the rest of the application functional in a degraded state.
