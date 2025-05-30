from fastapi import APIRouter, UploadFile, File, HTTPException, status
from ..db import get_connection
from ..services import dedupe_shipments
import pandas as pd
import io

router = APIRouter()

# Define exactly the columns your CSV must have:
EXPECTED_COLUMNS = {
    "shipment_id",
    "customer_id",
    "origin",
    "destination",
    "weight",
    "volume",
    "carrier",
    "mode",
    "status",
    "arrival_date",
    "departure_date",
    "delivered_date",
}


@router.post("/", summary="Upload CSV file containing shipment data", status_code=status.HTTP_201_CREATED)
async def upload_csv(file: UploadFile = File(...)):
    """
    Uploads a CSV file, validates columns, processes it in-memory,
    loads into DuckDB as 'shipments', and drops duplicates automatically.
    Returns total rows and count of duplicates removed.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .csv files are accepted",
        )

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse CSV: {exc}",
        )

    # Validate columns
    incoming = set(df.columns.str.strip())
    missing = EXPECTED_COLUMNS - incoming
    extra = incoming - EXPECTED_COLUMNS
    if missing or extra:
        detail_parts = []
        if missing:
            detail_parts.append(f"Missing columns: {', '.join(sorted(missing))}")
        if extra:
            detail_parts.append(f"Unexpected columns: {', '.join(sorted(extra))}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(detail_parts),
        )

    try:
        conn = get_connection(in_memory=False)
        # Load raw data
        conn.execute("DROP TABLE IF EXISTS shipments;")
        conn.register("__temp_shipments", df)
        conn.execute(
            """
            CREATE TABLE shipments AS
            SELECT * FROM __temp_shipments;
            """
        )
        # Count before dedupe
        total_before = conn.execute("SELECT COUNT(*) FROM shipments;").fetchone()[0]
        # Remove duplicates
        removed = dedupe_shipments()
        # Count after dedupe
        total_after = conn.execute("SELECT COUNT(*) FROM shipments;").fetchone()[0]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load or clean data: {exc}",
        )

    return {
        "message": "CSV validated, loaded, and deduplicated successfully",
        "total_uploaded": total_before,
        "duplicates_removed": removed,
        "total_shipments": total_after,
    }
