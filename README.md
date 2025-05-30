# Freight Forwarding Shipment Management

A full-stack logistics dashboard to manage and analyze cargo shipments.

- **Backend**: FastAPI + DuckDB for data ingestion, analytics, and admin operations  
- **Frontend**: Next.js (App Router) + TailwindCSS + lucide-react + recharts for interactive dashboards

> **Created by Alan R. Gooding**

---

## Table of Contents

1. [Prerequisites]
2. [Backend Setup (FastAPI)] 
3. [Frontend Setup (Next.js)] 

---

## Prerequisites

- **Node.js** ≥ 18 with npm or yarn  
- **Python** ≥ 3.10  
- **DuckDB** (installed via pip)  
- Git  

---

## Backend Setup (FastAPI)

### 1. Clone & Install Dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # On macOS/Linux
# .venv\Scripts\activate         # On Windows
pip install -r requirements.txt
```

### 2. Run the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup (Next.js)

### 1. Clone & Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create .env file

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run the Frontend Server

```bash
npm run dev
```

