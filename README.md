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
4. [Design Decisions & Assumptions]
5. [How to Use the Project]

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

## Design Decisions & Assumptions

### UI Design

The UI was intentionally kept minimalist and easy to use to ensure clarity and focus. TailwindCSS and lucide-react were chosen to deliver a clean, responsive experience with visually consistent icons and charts.

### Assumptions

    •	It is assumed that input data is clean and complete.
    •	There is no functionality to edit or impute missing values, so missing or invalid fields are not handled.
    •	The application expects the CSV format and column structure to match the expected schema.

## How to Use the Project

    1.	Login
    •	Navigate to http://localhost:3000/login
    •	Use the following credentials:
            Username: admin
            Password: AdminPassword123
    2.	Upload Shipments (If no DB data)
    •	If no DuckDB file or data exists, you will be redirected to the Upload CSV page.
    •	Upload a CSV file containing your shipment data.
    •	A modal will show success or failure of the upload process.
    3.	View Dashboard
    •	After uploading, you will be redirected to the Dashboard where you can view:
    •	Summary stats
    •	Shipment trends by carrier and mode
    •	Shipment table with filters
    •	Consolidation recommendations
    4.	Logout
    •	Logging out will delete the DuckDB file from the backend to clear all data.
    •	You will be redirected to the login page.
